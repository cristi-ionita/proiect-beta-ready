import AdminDocumentsDetailsScreen from "@/components/admin/documents/admin-user-documents-details-screen";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function Page({ params }: Props) {
  const { userId } = await params;

  return <AdminDocumentsDetailsScreen userId={Number(userId)} />;
}