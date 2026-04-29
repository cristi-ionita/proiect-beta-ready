import type { ComponentProps } from "react";
import StatusBadge from "@/components/ui/status-badge";

type StatusVariant = ComponentProps<typeof StatusBadge>["variant"];

type IssueStatusConfig = {
  label: string;
  variant: StatusVariant;
};

const ISSUE_STATUS_MAP: Record<string, IssueStatusConfig> = {
  open: {
    label: "Open",
    variant: "warning",
  },
  in_progress: {
    label: "In progress",
    variant: "info",
  },
  resolved: {
    label: "Resolved",
    variant: "success",
  },
  closed: {
    label: "Closed",
    variant: "neutral",
  },
  rejected: {
    label: "Rejected",
    variant: "danger",
  },
};

export function getIssueStatusLabel(status: string): string {
  return ISSUE_STATUS_MAP[status]?.label ?? "Unknown";
}

export function getIssueStatusVariant(status: string): StatusVariant {
  return ISSUE_STATUS_MAP[status]?.variant ?? "neutral";
}