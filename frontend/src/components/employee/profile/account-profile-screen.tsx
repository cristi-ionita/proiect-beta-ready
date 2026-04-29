"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AtSign,
  Edit3,
  Lock,
  Mail,
  Save,
  UserRound,
  X,
} from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import SectionCard from "@/components/ui/section-card";
import { useProfileSummary } from "@/hooks/profile/use-profile-summary";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { isApiClientError } from "@/lib/api-error";
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
      } catch (err: unknown) {
        if (!isMounted) return;

        setSubmitError(
          isApiClientError(err) ? err.message : t("profile", "failedToLoadAccount")
        );

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
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSuccessMessage("");
    setSubmitError("");
  }

  function cancelEdit() {
    setEditingField(null);
    setSubmitError("");
    setSuccessMessage("");

    setForm((current) => ({
      ...current,
      current_password: "",
      password: "",
    }));
  }

  async function handleSave() {
    if (editingField === "password") {
      if (!form.current_password.trim()) {
        setSubmitError(t("profile", "currentPasswordRequired"));
        return;
      }

      if (!form.password.trim()) {
        setSubmitError(t("profile", "enterNewPassword"));
        return;
      }
    }

    try {
      setSaving(true);
      setSuccessMessage("");
      setSubmitError("");

      await updateMyAccount({
        email: form.email.trim() || null,
        username: form.username.trim() || null,
        ...(editingField === "password"
          ? {
              current_password: form.current_password.trim(),
              password: form.password.trim(),
            }
          : {}),
      });

      setSuccessMessage(t("profile", "accountUpdated"));
      setEditingField(null);

      setForm((current) => ({
        ...current,
        current_password: "",
        password: "",
      }));
    } catch (err: unknown) {
      const message = isApiClientError(err) ? err.message : "";

      if (message.toLowerCase().includes("current password is incorrect")) {
        setSubmitError(t("profile", "incorrectCurrentPassword"));
        return;
      }

      setSubmitError(message || t("profile", "failedToSaveAccount"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="back"
        onClick={() => router.push("/employee/profile")}
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common", "back")}
      </Button>

      <SectionCard
        title={t("profile", "loginSettings")}
        icon={<UserRound className="h-5 w-5" />}
      >
        <DataStateBoundary
          isLoading={loading || accountLoading}
          isError={Boolean(error && !data)}
          errorMessage={error ?? t("profile", "failedToLoadAccount")}
          isEmpty={!data}
          emptyTitle={t("profile", "noAccountData")}
          emptyDescription={t("profile", "accountDataUnavailable")}
        >
          <div className="space-y-4">
            <div className="grid gap-5">
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
                    onChange={(event) =>
                      handleChange("email", event.target.value)
                    }
                    placeholder="email@example.com"
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
                  <div className="grid gap-3">
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
            </div>

            {successMessage ? (
              <Alert variant="success" message={successMessage} />
            ) : null}

            {submitError ? (
              <Alert variant="error" message={submitError} />
            ) : null}

            {editingField ? (
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  loading={saving}
                >
                  <Save className="h-4 w-4" />
                  {t("common", "save")}
                </Button>
              </div>
            ) : null}
          </div>
        </DataStateBoundary>
      </SectionCard>
    </div>
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
    <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_auto] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/30 text-white">
          {icon}
        </div>

        <p className="truncate text-sm font-semibold text-white">{label}</p>
      </div>

      <div className="min-w-0">{children}</div>

      <div className="flex justify-end">
        {isEditing ? (
          <Button type="button" size="sm" variant="secondary" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" size="sm" variant="secondary" onClick={onEdit}>
            <Edit3 className="h-4 w-4" />
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}