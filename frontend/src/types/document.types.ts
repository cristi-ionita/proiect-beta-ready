export const DOCUMENT_TYPE = {
  CONTRACT: "contract",
  PAYSLIP: "payslip",
  ID_CARD: "id_card",
  PASSPORT: "passport",
  DRIVER_LICENSE: "driver_license",
  TAX_NUMBER: "tax_number",
  BANK_CARD: "bank_card",
  MEDICAL_CERTIFICATE: "medical_certificate",
  OTHER: "other",
} as const;

export type DocumentType =
  (typeof DOCUMENT_TYPE)[keyof typeof DOCUMENT_TYPE];

export const DOCUMENT_CATEGORY = {
  COMPANY: "company",
  PERSONAL: "personal",
} as const;

export type DocumentCategory =
  (typeof DOCUMENT_CATEGORY)[keyof typeof DOCUMENT_CATEGORY];

export const DOCUMENT_STATUS = {
  ACTIVE: "active",
  EXPIRED: "expired",
  ARCHIVED: "archived",
} as const;

export type DocumentStatus =
  (typeof DOCUMENT_STATUS)[keyof typeof DOCUMENT_STATUS];

export interface DocumentItem {
  id: number;
  user_id: number;
  uploaded_by: number | null;
  type: DocumentType;
  category: DocumentCategory;
  status: DocumentStatus;
  title?: string | null;

  file_name: string;
  mime_type: string;
  file_size: number;

  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  documents: DocumentItem[];
}