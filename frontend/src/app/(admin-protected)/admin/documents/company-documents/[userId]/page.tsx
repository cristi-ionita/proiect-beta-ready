import AdminCompanyDocumentsDetailsScreen from "@/components/admin/documents/admin-company-documents-details-screen";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function Page({ params }: Props) {
  const { userId } = await params;

  return (
    <AdminCompanyDocumentsDetailsScreen userId={Number(userId)} />
  );
}