import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type TelemetryRow = Database["public"]["Tables"]["telemetry"]["Row"];

export type Telemetry = {
  solarKw: number;
  gridKw: number;
  batterySoc: number;
  batteryKw: number;
  loadKw: number;
  criticalLoadKw: number;
  tier2LoadKw: number;
  tier3LoadKw: number;
  estimatedSavingsInr: number;
  gridConnected: boolean;
  site: string;
  lastUpdated: string;
};

function mapRow(row: TelemetryRow): Telemetry {
  return {
    solarKw: row.solar_kw,
    gridKw: row.grid_kw,
    batterySoc: row.battery_soc,
    batteryKw: row.battery_kw,
    loadKw: row.load_kw,
    criticalLoadKw: row.critical_load_kw,
    tier2LoadKw: row.tier2_load_kw,
    tier3LoadKw: row.tier3_load_kw,
    estimatedSavingsInr: row.estimated_savings_inr,
    gridConnected: row.grid_connected,
    site: row.site,
    lastUpdated: new Date(row.recorded_at).toLocaleTimeString("en-IN", { hour12: false }),
  };
}

/** Latest telemetry row, live-updated whenever a new reading is inserted. */
export function useLiveTelemetry() {
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase
      .from("telemetry")
      .select("*")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (data) setTelemetry(mapRow(data));
        setLoading(false);
      });

    const channel = supabase
      .channel(`telemetry-live-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "telemetry" },
        (payload) => setTelemetry(mapRow(payload.new as TelemetryRow))
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { telemetry, loading };
}
