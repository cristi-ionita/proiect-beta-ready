import AdminDocumentsDetailsScreen from "@/components/admin/documents/admin-documents-details-screen";

type Props = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function UserDocumentsDetailsPage({ params }: Props) {
  const { userId } = await params;

  return <AdminDocumentsDetailsScreen userId={Number(userId)} />;
}