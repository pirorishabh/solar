import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database, HealthState } from "@/types/database";

type Row = Database["public"]["Tables"]["priority_dispatch"]["Row"];

export type PriorityDispatchTier = {
  tier: string;
  assetId: string;
  label: string;
  description: string;
  state: string;
  status: HealthState;
  allocation: string;
};

const mapRow = (row: Row): PriorityDispatchTier => ({
  tier: row.tier,
  assetId: row.asset_id,
  label: row.label,
  description: row.description,
  state: row.state,
  status: row.status,
  allocation: row.allocation,
});

/** Tier 01–03 dispatch policy, live-updated as allocations change. */
export function usePriorityDispatch() {
  const [priorityDispatch, setPriorityDispatch] = useState<PriorityDispatchTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase
      .from("priority_dispatch")
      .select("*")
      .order("tier", { ascending: true })
      .then(({ data }) => {
        if (!active) return;
        if (data) setPriorityDispatch(data.map(mapRow));
        setLoading(false);
      });

    const channel = supabase
      .channel(`priority-dispatch-live-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "priority_dispatch" },
        (payload) => {
          const updated = mapRow(payload.new as Row);
          setPriorityDispatch((prev) => {
            const exists = prev.some((p) => p.tier === updated.tier);
            return exists
              ? prev.map((p) => (p.tier === updated.tier ? updated : p))
              : [...prev, updated].sort((a, b) => a.tier.localeCompare(b.tier));
          });
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { priorityDispatch, loading };
}
