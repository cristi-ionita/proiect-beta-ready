import type { ComponentProps } from "react";
import StatusBadge from "@/components/ui/status-badge";

type StatusVariant = ComponentProps<typeof StatusBadge>["variant"];

/**
 * Normalize backend status → UI label
 */
export function getIssueStatusLabel(status: string): string {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "In progress";
    case "resolved":
      return "Resolved";
    case "closed":
      return "Closed";
    case "rejected":
      return "Rejected";
    default:
      return "Unknown";
  }
}

/**
 * Map backend status → badge variant
 */
export function getIssueStatusVariant(status: string): StatusVariant {
  switch (status) {
    case "open":
      return "warning";
    case "in_progress":
      return "info";
    case "resolved":
      return "success";
    case "closed":
      return "neutral";
    case "rejected":
      return "danger";
    default:
      return "neutral";
  }
}