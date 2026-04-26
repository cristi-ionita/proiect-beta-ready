"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, XCircle } from "lucide-react";

import SectionCard from "@/components/ui/section-card";
import DataStateBoundary from "@/components/patterns/data-state-boundary";
import Button from "@/components/ui/button";

import { getRejectedAssignments } from "@/services/assignments.api";
import type { AssignmentItem } from "@/types/assignment.types";

export default function AdminRejectedAssignmentsScreen() {
  const router = useRouter();

  const [data, setData] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      const res = await getRejectedAssignments();
      setData(Array.isArray(res) ? res : []);
    } catch {
      setError("Nu s-au putut încărca alocările refuzate.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <DataStateBoundary
      isLoading={loading}
      isError={Boolean(error)}
      errorMessage={error}
    >
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/assignments")}
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi
        </Button>

        <SectionCard
          title="Alocări refuzate"
          icon={<XCircle className="h-5 w-5" />}
        >
          {data.length === 0 ? (
            <p className="text-sm text-slate-400">
              Nu există alocări refuzate.
            </p>
          ) : (
            <div className="space-y-2">
              {data.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">
                      {item.user_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.vehicle_brand} {item.vehicle_model} —{" "}
                      {item.vehicle_license_plate}
                    </p>
                  </div>

                  <div className="text-right text-xs text-slate-400">
                    <p>Tură: {item.shift_number}</p>
                    <p>
                      Refuzată la:{" "}
                      {item.ended_at
                        ? new Date(item.ended_at).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </DataStateBoundary>
  );
}