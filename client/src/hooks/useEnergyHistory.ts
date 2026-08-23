import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type Row = Database["public"]["Tables"]["energy_history"]["Row"];

export type EnergyPoint = {
  time: string;
  solar: number;
  demand: number;
  battery: number;
  grid: number;
  forecast: number;
};

const mapRow = (row: Row): EnergyPoint => ({
  time: row.time_label,
  solar: row.solar,
  demand: row.demand,
  battery: row.battery,
  grid: row.grid,
  forecast: row.forecast,
});

/** Full energy history series, live-appended as new points are inserted. */
export function useEnergyHistory() {
  const [history, setHistory] = useState<EnergyPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase
      .from("energy_history")
      .select("*")
      .order("recorded_at", { ascending: true })
      .then(({ data }) => {
        if (!active) return;
        if (data) setHistory(data.map(mapRow));
        setLoading(false);
      });

    const channel = supabase
      .channel(`energy-history-live-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "energy_history" },
        (payload) => setHistory((prev) => [...prev, mapRow(payload.new as Row)])
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { history, loading };
}
