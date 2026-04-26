import { api } from "@/lib/axios";
import type { DocumentItem, DocumentListResponse } from "@/types/document.types";

export async function getUserDocuments(userId: number): Promise<DocumentItem[]> {
  const { data } = await api.get<DocumentListResponse>(`/documents/admin/${userId}`);
  return Array.isArray(data.documents) ? data.documents : [];
}

export async function adminUploadDocument(
  userId: number,
  formData: FormData
): Promise<DocumentItem> {
  const { data } = await api.post<DocumentItem>(
    `/documents/admin/upload/${userId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
}

export async function adminDeleteDocument(documentId: number): Promise<void> {
  await api.delete(`/documents/admin/${documentId}`);
}

export async function adminDownloadDocumentFile(
  documentId: number
): Promise<Blob> {
  const response = await api.get(`/documents/admin/file/${documentId}/download`, {
    responseType: "blob",
  });

  return response.data;
}

export async function getMyDocuments(): Promise<DocumentItem[]> {
  const { data } = await api.get<DocumentListResponse>("/documents/me");
  return Array.isArray(data.documents) ? data.documents : [];
}

export async function uploadMyDocument(
  formData: FormData
): Promise<DocumentItem> {
  const { data } = await api.post<DocumentItem>("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}

export async function deleteMyDocument(documentId: number): Promise<void> {
  await api.delete(`/documents/${documentId}`);
}

export async function myDownloadDocumentFile(
  documentId: number
): Promise<Blob> {
  const response = await api.get(`/documents/${documentId}/download`, {
    responseType: "blob",
  });

  return response.data;
}