import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type SolarRow = Database["public"]["Tables"]["solar_forecast"]["Row"];
type LoadRow = Database["public"]["Tables"]["load_forecast"]["Row"];

export type SolarForecast = { current: number; nextHour: number; peakExpected: number; confidence: string };
export type LoadForecast = { current: number; expectedPeak: number; peakTime: string };

const mapSolar = (row: SolarRow): SolarForecast => ({
  current: row.current,
  nextHour: row.next_hour,
  peakExpected: row.peak_expected,
  confidence: row.confidence,
});

const mapLoad = (row: LoadRow): LoadForecast => ({
  current: row.current,
  expectedPeak: row.expected_peak,
  peakTime: row.peak_time,
});

/** Latest solar + load forecast, live-updated whenever a new forecast run lands. */
export function useForecast() {
  const [solarForecast, setSolarForecast] = useState<SolarForecast | null>(null);
  const [loadForecast, setLoadForecast] = useState<LoadForecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([
      supabase.from("solar_forecast").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("load_forecast").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    ]).then(([solar, load]) => {
      if (!active) return;
      if (solar.data) setSolarForecast(mapSolar(solar.data));
      if (load.data) setLoadForecast(mapLoad(load.data));
      setLoading(false);
    });

    const channel = supabase
      .channel(`forecast-live-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "solar_forecast" },
        (payload) => setSolarForecast(mapSolar(payload.new as SolarRow))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "load_forecast" },
        (payload) => setLoadForecast(mapLoad(payload.new as LoadRow))
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { solarForecast, loadForecast, loading };
}
