import { api } from "@/lib/axios";
import type { MyVehicleResponse } from "@/types/vehicle.types";
import type {
  CreateVehiclePayload,
  UpdateVehiclePayload,
  VehicleItem,
  VehicleLiveStatusItem,
  VehicleLiveStatusResponse,
} from "@/types/vehicle.types";

export async function listVehicles(): Promise<VehicleItem[]> {
  const { data } = await api.get<VehicleItem[]>("/vehicles");
  return data;
}

export async function createVehicle(
  payload: CreateVehiclePayload
): Promise<VehicleItem> {
  const { data } = await api.post<VehicleItem>("/vehicles", payload);
  return data;
}

export async function getVehicle(vehicleId: number): Promise<VehicleItem> {
  const { data } = await api.get<VehicleItem>(`/vehicles/${vehicleId}`);
  return data;
}

export async function updateVehicle(
  vehicleId: number,
  payload: UpdateVehiclePayload
): Promise<VehicleItem> {
  const { data } = await api.put<VehicleItem>(
    `/vehicles/${vehicleId}`,
    payload
  );
  return data;
}

export async function deleteVehicle(vehicleId: number): Promise<void> {
  await api.delete(`/vehicles/${vehicleId}`);
}

export async function getVehicleLiveStatus(): Promise<VehicleLiveStatusItem[]> {
  const { data } = await api.get<VehicleLiveStatusResponse>(
    "/vehicles/live-status"
  );

  return data.vehicles;
}

export async function getMyVehicleDetails(): Promise<MyVehicleResponse> {
  const { data } = await api.get<MyVehicleResponse>("/my-vehicle");
  return data;
}

export type VehiclePhotoType =
  | "exterior"
  | "interior"
  | "damage"
  | "registration";

export type VehiclePhotoItem = {
  id: number;
  type: VehiclePhotoType;
  file_name: string;
  mime_type: string;
  file_size: number;
  created_at: string;
};

export async function getVehiclePhotos(
  vehicleId: number
): Promise<VehiclePhotoItem[]> {
  const { data } = await api.get<VehiclePhotoItem[]>(
    `/vehicles/${vehicleId}/photos`
  );

  return data;
}

export async function uploadVehiclePhotos(
  vehicleId: number,
  type: VehiclePhotoType,
  files: File[]
): Promise<{ uploaded: number }> {
  const form = new FormData();

  form.append("type", type);

  files.forEach((file) => {
    form.append("files", file);
  });

  const { data } = await api.post<{ uploaded: number }>(
    `/vehicles/${vehicleId}/photos`,
    form
  );

  return data;
}

export async function getMyVehiclePhotoFile(photoId: number): Promise<Blob> {
  const { data } = await api.get(`/my-vehicle/photos/${photoId}/file`, {
    responseType: "blob",
  });

  return data;
}

export async function replaceMyVehiclePhoto(
  photoId: number,
  file: File
): Promise<unknown> {
  const form = new FormData();
  form.append("file", file);

  const { data } = await api.post(
    `/my-vehicle/photos/${photoId}/replace`,
    form
  );

  return data;
}

export async function confirmMyVehicle(): Promise<void> {
  await api.post("/my-vehicle/confirm");
}

export async function rejectMyVehicle(): Promise<void> {
  await api.post("/my-vehicle/reject");
}

export async function getAdminVehiclePhotoFile(photoId: number): Promise<Blob> {
  const { data } = await api.get(`/vehicles/photos/${photoId}/file`, {
    responseType: "blob",
  });

  return data;
}

export async function updateMyVehicleMileage(
  currentMileage: number
): Promise<{ current_mileage: number }> {
  const { data } = await api.patch("/my-vehicle/mileage", {
    current_mileage: currentMileage,
  });

  return data;
}