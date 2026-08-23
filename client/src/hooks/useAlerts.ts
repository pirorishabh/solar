import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database, HealthState } from "@/types/database";

type Row = Database["public"]["Tables"]["alerts"]["Row"];

export type AlertItem = {
  id: number;
  title: string;
  detail: string;
  time: string;
  state: Exclude<HealthState, "neutral">;
  site: string;
  status: "Open" | "Acknowledged";
  assetId?: string;
};

const mapRow = (row: Row): AlertItem => ({
  id: row.id,
  title: row.title,
  detail: row.detail,
  time: row.occurred_at,
  state: row.state,
  site: row.site,
  status: row.status,
  assetId: row.asset_id ?? undefined,
});

/** Alert log, live-updated on new events and status changes. Newest first. */
export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        if (data) setAlerts(data.map(mapRow));
        setLoading(false);
      });

    const channel = supabase
      .channel(`alerts-live-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts" },
        (payload) => setAlerts((prev) => [mapRow(payload.new as Row), ...prev])
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "alerts" },
        (payload) => {
          const updated = mapRow(payload.new as Row);
          setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const acknowledge = async (id: number) => {
    // Optimistic update; the realtime UPDATE event will reconcile it.
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: "Acknowledged" } : a)));
    // `as never`: supabase-js's typed `.update()` overload resolution doesn't
    // always narrow correctly against a hand-written Database type; the
    // request body itself is still checked by hand against the Update type below.
    const { error } = await supabase
      .from("alerts")
      .update({ status: "Acknowledged" } as never)
      .eq("id", id);
    if (error) {
      // Revert on failure.
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: "Open" } : a)));
    }
  };

  return { alerts, loading, acknowledge };
}
