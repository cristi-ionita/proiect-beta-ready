import type { ReactNode } from "react";

import Alert from "@/components/ui/alert";
import EmptyState from "@/components/ui/empty-state";
import LoadingState from "@/components/ui/loading-state";

type DataStateBoundaryProps = {
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  loadingText?: string;
  children: ReactNode;
};

export default function DataStateBoundary({
  isLoading,
  isError,
  errorMessage,
  isEmpty,
  emptyTitle = "Nu există date",
  emptyDescription,
  emptyAction,
  loadingText,
  children,
}: DataStateBoundaryProps) {
  if (isLoading) {
    return <LoadingState text={loadingText} />;
  }

  if (isError) {
    return (
      <Alert
        variant="error"
        message={errorMessage ?? "A apărut o eroare"}
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return <>{children}</>;
}