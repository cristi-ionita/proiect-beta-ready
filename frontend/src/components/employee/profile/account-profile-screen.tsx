"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Save, X } from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import FormField from "@/components/ui/form-field";
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

type UpdateAccountPayload = {
  email?: string | null;
  username?: string | null;
  current_password?: string;
  password?: string;
};

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

  const [initialForm, setInitialForm] = useState<AccountFormState>({
    email: "",
    username: "",
    current_password: "",
    password: "",
  });

  const [isEditing, setIsEditing] = useState(false);
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

        const nextForm = {
          email: account?.email ?? data?.user.email ?? "",
          username: account?.username ?? data?.user.username ?? "",
          current_password: "",
          password: "",
        };

        setForm(nextForm);
        setInitialForm(nextForm);
      } catch (err: unknown) {
        if (!isMounted) return;

        setSubmitError(
          isApiClientError(err)
            ? err.message
            : t("profile", "failedToLoadAccount")
        );

        const fallbackForm = {
          email: data?.user.email ?? "",
          username: data?.user.username ?? "",
          current_password: "",
          password: "",
        };

        setForm(fallbackForm);
        setInitialForm(fallbackForm);
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

  function startEdit() {
    setIsEditing(true);
    setSuccessMessage("");
    setSubmitError("");
  }

  function cancelEdit() {
    setIsEditing(false);
    setSubmitError("");
    setSuccessMessage("");
    setForm(initialForm);
  }

  async function handleSave() {
    const payload: UpdateAccountPayload = {};

    if (form.email.trim() !== initialForm.email.trim()) {
      payload.email = form.email.trim() || null;
    }

    if (form.username.trim() !== initialForm.username.trim()) {
      payload.username = form.username.trim() || null;
    }

    if (form.password.trim()) {
      if (!form.current_password.trim()) {
        setSubmitError(t("profile", "currentPasswordRequired"));
        return;
      }

      payload.current_password = form.current_password.trim();
      payload.password = form.password.trim();
    }

    if (Object.keys(payload).length === 0) {
      setIsEditing(false);
      setForm((current) => ({
        ...current,
        current_password: "",
        password: "",
      }));
      return;
    }

    try {
      setSaving(true);
      setSuccessMessage("");
      setSubmitError("");

      await updateMyAccount(payload);

      const cleanForm = {
        ...form,
        current_password: "",
        password: "",
      };

      setForm(cleanForm);
      setInitialForm(cleanForm);
      setSuccessMessage(t("profile", "accountUpdated"));
      setIsEditing(false);
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
        {t("common", "back")}
      </Button>

      <SectionCard
        title={t("profile", "loginSettings")}
        actions={
          !isEditing ? (
            <Button
              type="button"
              size="sm"
              className="flex h-9 w-9 items-center justify-center p-0"
              onClick={startEdit}
              aria-label="Edit"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          ) : null
        }
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
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
              <div className="grid gap-4">
                <FormField label="Email">
                  <Input
                    type="email"
                    value={form.email}
                    disabled={!isEditing || saving}
                    onChange={(event) =>
                      handleChange("email", event.target.value)
                    }
                    placeholder="email@example.com"
                  />
                </FormField>

                <FormField label={t("profile", "username")}>
                  <Input
                    type="text"
                    value={form.username}
                    disabled={!isEditing || saving}
                    onChange={(event) =>
                      handleChange("username", event.target.value)
                    }
                    placeholder={t("profile", "enterUsername")}
                  />
                </FormField>

                {isEditing ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label={t("profile", "enterCurrentPassword")}>
                      <Input
                        type="password"
                        value={form.current_password}
                        disabled={saving}
                        onChange={(event) =>
                          handleChange("current_password", event.target.value)
                        }
                        placeholder={t("profile", "enterCurrentPassword")}
                      />
                    </FormField>

                    <FormField label={t("profile", "enterNewPassword")}>
                      <Input
                        type="password"
                        value={form.password}
                        disabled={saving}
                        onChange={(event) =>
                          handleChange("password", event.target.value)
                        }
                        placeholder={t("profile", "enterNewPassword")}
                      />
                    </FormField>
                  </div>
                ) : null}
              </div>
            </div>

            {successMessage ? (
              <Alert variant="success" message={successMessage} />
            ) : null}

            {submitError ? <Alert variant="error" message={submitError} /> : null}

            {isEditing ? (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  <X className="h-4 w-4" />
                  {t("common", "cancel")}
                </Button>

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