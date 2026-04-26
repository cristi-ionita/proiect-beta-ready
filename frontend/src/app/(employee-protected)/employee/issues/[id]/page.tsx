import MyIssueDetailsScreen from "@/components/employee/issues/my-issue-details-screen";

type Props = {
  params: {
    id: string;
  };
};

export default function Page({ params }: Props) {
  return <MyIssueDetailsScreen issueId={Number(params.id)} />;
}