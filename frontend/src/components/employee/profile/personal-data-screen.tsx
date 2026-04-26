"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building,
  Calendar,
  CreditCard,
  Edit3,
  MapPin,
  Phone,
  Save,
  User,
  X,
} from "lucide-react";

import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import SectionCard from "@/components/ui/section-card";
import { useProfileSummary } from "@/hooks/profile/use-profile-summary";
import { useSafeI18n } from "@/hooks/use-safe-i18n";
import { updateMyProfile } from "@/services/profile.api";

type FormState = {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  position: string;
  department: string;
  hire_date: string;
  iban: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
};

type EditingField = keyof FormState | null;

type I18nFn = {
  (namespace: "common", key: "back" | "edit" | "save"): string;
  (
    namespace: "profile",
    key:
      | "personalData"
      | "firstName"
      | "lastName"
      | "phone"
      | "address"
      | "position"
      | "department"
      | "hireDate"
      | "emergencyContactName"
      | "emergencyContactPhone"
      | "profileUpdated"
      | "failedToSaveProfile"
      | "failedToLoadProfile"
      | "noProfileData"
      | "profileDataUnavailable"
  ): string;
};

export default function PersonalProfileScreen() {
  const router = useRouter();
  const { t } = useSafeI18n();
  const { data, loading, error, refetch } = useProfileSummary();

  const [form, setForm] = useState<FormState>({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    position: "",
    department: "",
    hire_date: "",
    iban: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  const [editingField, setEditingField] = useState<EditingField>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!data?.employee_profile) return;

    const profile = data.employee_profile;

    setForm({
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      phone: profile.phone ?? "",
      address: profile.address ?? "",
      position: profile.position ?? "",
      department: profile.department ?? "",
      hire_date: profile.hire_date ?? "",
      iban: profile.iban ?? "",
      emergency_contact_name: profile.emergency_contact_name ?? "",
      emergency_contact_phone: profile.emergency_contact_phone ?? "",
    });
  }, [data]);

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setSuccessMessage("");
    setSubmitError("");
  }

  function cancelEdit() {
    setEditingField(null);
    setSuccessMessage("");
    setSubmitError("");
  }

  async function handleSave() {
    if (!editingField) return;

    try {
      setSaving(true);
      setSuccessMessage("");
      setSubmitError("");

      await updateMyProfile({
        [editingField]: form[editingField].trim() || null,
      });

      await refetch();

      setSuccessMessage(t("profile", "profileUpdated"));
      setEditingField(null);
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.message ||
          err?.response?.data?.detail ||
          err?.message ||
          t("profile", "failedToSaveProfile")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error ?? t("profile", "failedToLoadProfile")}
      isEmpty={!data}
      emptyTitle={t("profile", "noProfileData")}
      emptyDescription={t("profile", "profileDataUnavailable")}
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
          title={t("profile", "personalData")}
          icon={<User className="h-5 w-5" />}
        >
          <div className="space-y-3">
            <ProfileField
              icon={<User className="h-4 w-4" />}
              label={t("profile", "firstName")}
              value={form.first_name}
              field="first_name"
              editingField={editingField}
              onEdit={() => setEditingField("first_name")}
              onCancel={cancelEdit}
              onChange={handleChange}
              t={t}
            />

            <ProfileField
              icon={<User className="h-4 w-4" />}
              label={t("profile", "lastName")}
              value={form.last_name}
              field="last_name"
              editingField={editingField}
              onEdit={() => setEditingField("last_name")}
              onCancel={cancelEdit}
              onChange={handleChange}
              t={t}
            />

            <ProfileField
              icon={<Phone className="h-4 w-4" />}
              label={t("profile", "phone")}
              value={form.phone}
              field="phone"
              editingField={editingField}
              onEdit={() => setEditingField("phone")}
              onCancel={cancelEdit}
              onChange={handleChange}
              t={t}
            />

            <ProfileField
              icon={<MapPin className="h-4 w-4" />}
              label={t("profile", "address")}
              value={form.address}
              field="address"
              editingField={editingField}
              onEdit={() => setEditingField("address")}
              onCancel={cancelEdit}
              onChange={handleChange}
              t={t}
            />

            <ProfileField
              icon={<Briefcase className="h-4 w-4" />}
              label={t("profile", "position")}
              value={form.position}
              field="position"
              editingField={editingField}
              onEdit={() => setEditingField("position")}
              onCancel={cancelEdit}
              onChange={handleChange}
              t={t}
            />

            <ProfileField
              icon={<Building className="h-4 w-4" />}
              label={t("profile", "department")}
              value={form.department}
              field="department"
              editingField={editingField}
              onEdit={() => setEditingField("department")}
              onCancel={cancelEdit}
              onChange={handleChange}
              t={t}
            />

            <ProfileField
              icon={<Calendar className="h-4 w-4" />}
              label={t("profile", "hireDate")}
              value={form.hire_date}
              field="hire_date"
              type="date"
              editingField={editingField}
              onEdit={() => setEditingField("hire_date")}
              onCancel={cancelEdit}
              onChange={handleChange}
              t={t}
            />

            <ProfileField
              icon={<CreditCard className="h-4 w-4" />}
              label="IBAN"
              value={form.iban}
              field="iban"
              editingField={editingField}
              onEdit={() => setEditingField("iban")}
              onCancel={cancelEdit}
              onChange={handleChange}
              t={t}
            />

            <ProfileField
              icon={<User className="h-4 w-4" />}
              label={t("profile", "emergencyContactName")}
              value={form.emergency_contact_name}
              field="emergency_contact_name"
              editingField={editingField}
              onEdit={() => setEditingField("emergency_contact_name")}
              onCancel={cancelEdit}
              onChange={handleChange}
              t={t}
            />

            <ProfileField
              icon={<Phone className="h-4 w-4" />}
              label={t("profile", "emergencyContactPhone")}
              value={form.emergency_contact_phone}
              field="emergency_contact_phone"
              editingField={editingField}
              onEdit={() => setEditingField("emergency_contact_phone")}
              onCancel={cancelEdit}
              onChange={handleChange}
              t={t}
            />

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

function ProfileField({
  icon,
  label,
  value,
  field,
  type = "text",
  editingField,
  onEdit,
  onCancel,
  onChange,
  t,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  field: keyof FormState;
  type?: "text" | "date";
  editingField: EditingField;
  onEdit: () => void;
  onCancel: () => void;
  onChange: (field: keyof FormState, value: string) => void;
  t: I18nFn;
}) {
  const isEditing = editingField === field;

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

      <div className="min-w-0 flex-1">
        {isEditing ? (
          <Input
            type={type}
            value={value}
            onChange={(event) => onChange(field, event.target.value)}
            className="md:max-w-[520px]"
          />
        ) : (
          <p className="truncate text-sm font-semibold text-white">
            {value || "—"}
          </p>
        )}
      </div>

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
            {t("common", "edit")}
          </Button>
        )}
      </div>
    </div>
  );
}