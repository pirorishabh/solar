import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type TelemetryRow = Database["public"]["Tables"]["telemetry"]["Row"];

/**
 * Grid Atlas: live telemetry stream backed by Supabase Realtime (postgres_changes
 * on INSERT into `telemetry`). Prefer the `useTelemetry` hook in components; this
 * remains for non-React call sites that want a plain subscribe/unsubscribe function.
 */
export type EnergyEvent = {
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
  timestamp: string;
};

export function subscribeToEnergyUpdates(onEvent: (event: EnergyEvent) => void) {
  const channel = supabase
    .channel(`telemetry-stream-${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "telemetry" },
      (payload) => {
        const row = payload.new as TelemetryRow;
        onEvent({
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
          timestamp: row.recorded_at,
        });
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
