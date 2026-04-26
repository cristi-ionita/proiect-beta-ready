"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AtSign, Edit3, Lock, Mail, Save, UserRound, X } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import SectionCard from "@/components/ui/section-card";
import { useProfileSummary } from "@/hooks/profile/use-profile-summary";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { getMyAccount, updateMyAccount } from "@/services/profile.api";

type AccountFormState = {
  email: string;
  username: string;
  current_password: string;
  password: string;
};

type EditingField = "email" | "username" | "password" | null;

export default function AccountProfileScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();
  const { data, loading, error } = useProfileSummary();

  const [form, setForm] = useState<AccountFormState>({
    email: "",
    username: "",
    current_password: "",
    password: "",
  });

  const [editingField, setEditingField] = useState<EditingField>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadAccount() {
      try {
        setAccountLoading(true);
        setSubmitError("");

        const account = await getMyAccount();

        if (!isMounted) return;

        setForm({
          email: account?.email ?? data?.user.email ?? "",
          username: account?.username ?? data?.user.username ?? "",
          current_password: "",
          password: "",
        });
      } catch (err: any) {
        if (!isMounted) return;

        setSubmitError(err?.message || t("profile", "failedToLoadAccount"));

        setForm({
          email: data?.user.email ?? "",
          username: data?.user.username ?? "",
          current_password: "",
          password: "",
        });
      } finally {
        if (isMounted) setAccountLoading(false);
      }
    }

    void loadAccount();

    return () => {
      isMounted = false;
    };
  }, [data, t]);

  function handleChange(field: keyof AccountFormState, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setSuccessMessage("");
    setSubmitError("");
  }

  function cancelEdit() {
    setEditingField(null);
    setSubmitError("");
    setSuccessMessage("");

    setForm((prev) => ({
      ...prev,
      current_password: "",
      password: "",
    }));
  }

  async function handleSave() {
    if (editingField === "password" && !form.current_password.trim()) {
      setSubmitError(t("profile", "currentPasswordRequired"));
      return;
    }

    try {
      setSaving(true);
      setSuccessMessage("");
      setSubmitError("");

      await updateMyAccount({
        email: form.email.trim() || null,
        username: form.username.trim() || null,
        ...(editingField === "password" && form.password.trim()
          ? {
              current_password: form.current_password.trim(),
              password: form.password.trim(),
            }
          : {}),
      });

      setSuccessMessage(t("profile", "accountUpdated"));
      setEditingField(null);

      setForm((prev) => ({
        ...prev,
        current_password: "",
        password: "",
      }));
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "";

      if (
        String(message).toLowerCase().includes("current password is incorrect")
      ) {
        setSubmitError(t("profile", "incorrectCurrentPassword"));
        return;
      }

      setSubmitError(message || t("profile", "failedToSaveAccount"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DataStateBoundary
      isLoading={loading || accountLoading}
      isError={Boolean(error && !data)}
      errorMessage={error ?? t("profile", "failedToLoadAccount")}
      isEmpty={!data}
      emptyTitle={t("profile", "noAccountData")}
      emptyDescription={t("profile", "accountDataUnavailable")}
    >
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/employee/profile")}
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common", "back")}
        </Button>

        <SectionCard
          title={t("profile", "loginSettings")}
          icon={<UserRound className="h-5 w-5" />}
        >
          <div className="space-y-3">
            <AccountRow
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              isEditing={editingField === "email"}
              onEdit={() => setEditingField("email")}
              onCancel={cancelEdit}
            >
              {editingField === "email" ? (
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                  placeholder="email@example.com"
                  className="md:max-w-[520px]"
                />
              ) : (
                <p className="truncate text-sm font-semibold text-white">
                  {form.email || "—"}
                </p>
              )}
            </AccountRow>

            <AccountRow
              icon={<AtSign className="h-4 w-4" />}
              label={t("profile", "username")}
              isEditing={editingField === "username"}
              onEdit={() => setEditingField("username")}
              onCancel={cancelEdit}
            >
              {editingField === "username" ? (
                <Input
                  type="text"
                  value={form.username}
                  onChange={(event) =>
                    handleChange("username", event.target.value)
                  }
                  placeholder={t("profile", "enterUsername")}
                  className="md:max-w-[520px]"
                />
              ) : (
                <p className="truncate text-sm font-semibold text-white">
                  {form.username || "—"}
                </p>
              )}
            </AccountRow>

            <AccountRow
              icon={<Lock className="h-4 w-4" />}
              label={t("profile", "changePassword")}
              isEditing={editingField === "password"}
              onEdit={() => setEditingField("password")}
              onCancel={cancelEdit}
            >
              {editingField === "password" ? (
                <div className="grid gap-3 md:w-full md:max-w-[520px]">
                  <Input
                    type="password"
                    value={form.current_password}
                    onChange={(event) =>
                      handleChange("current_password", event.target.value)
                    }
                    placeholder={t("profile", "enterCurrentPassword")}
                  />

                  <Input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      handleChange("password", event.target.value)
                    }
                    placeholder={t("profile", "enterNewPassword")}
                  />
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-300">
                  {t("profile", "passwordHidden")}
                </p>
              )}
            </AccountRow>

            {successMessage ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            {submitError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {submitError}
              </div>
            ) : null}

            {editingField ? (
              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  loading={saving}
                  className="rounded-full"
                >
                  <Save className="h-4 w-4" />
                  {t("common", "save")}
                </Button>
              </div>
            ) : null}
          </div>
        </SectionCard>
      </div>
    </DataStateBoundary>
  );
}

function AccountRow({
  icon,
  label,
  isEditing,
  onEdit,
  onCancel,
  children,
}: {
  icon: ReactNode;
  label: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/30 text-white">
          {icon}
        </div>

        <p className="w-44 shrink-0 text-sm font-semibold text-white">
          {label}
        </p>
      </div>

      <div className="min-w-0 flex-1">{children}</div>

      <div className="flex shrink-0 justify-end">
        {isEditing ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onCancel}
            className="rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/15"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onEdit}
            className="rounded-full"
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}