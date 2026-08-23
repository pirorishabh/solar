import { supabase } from "@/lib/supabase";

/**
 * Grid Atlas: thin one-shot wrappers around Supabase for call sites that just
 * need a snapshot (no live updates). For live-updating data, prefer the hooks
 * in `client/src/hooks/` (useTelemetry, useAlerts, useEnergyHistory, etc.),
 * which additionally subscribe to realtime changes.
 */
export const api = {
  async getTelemetry() {
    const { data } = await supabase
      .from("telemetry")
      .select("*")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  },
  async getForecast() {
    const [solar, load] = await Promise.all([
      supabase.from("solar_forecast").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("load_forecast").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    return { solarForecast: solar.data, loadForecast: load.data };
  },
  async getOptimization() {
    const [decision, state] = await Promise.all([
      supabase.from("optimization_decisions").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("operating_state").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("priority_dispatch").select("*").order("tier", { ascending: true }),
    ]);
    return { optimizationDecision: decision.data, operatingState: state.data };
  },
  async getAlerts() {
    const { data } = await supabase.from("alerts").select("*").order("created_at", { ascending: false });
    return data ?? [];
  },
  async getHistoricalEnergy() {
    const { data } = await supabase.from("energy_history").select("*").order("recorded_at", { ascending: true });
    return data ?? [];
  },
  async getFeature1Data() {
    const { data } = await supabase.from("feature1_metering").select("*").order("id", { ascending: true });
    return data ?? [];
  },
};
