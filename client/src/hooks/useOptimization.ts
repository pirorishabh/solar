import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database, OperatingMode, PowerFlowState } from "@/types/database";

type DecisionRow = Database["public"]["Tables"]["optimization_decisions"]["Row"];
type StateRow = Database["public"]["Tables"]["operating_state"]["Row"];

export type OptimizationDecision = {
  action: string;
  reason: string;
  expectedEffect: { label: string; value: string }[];
  confidence: string;
};
export type OperatingState = { mode: OperatingMode; flowState: PowerFlowState; modeDetail: string };

const mapDecision = (row: DecisionRow): OptimizationDecision => ({
  action: row.action,
  reason: row.reason,
  expectedEffect: row.expected_effect,
  confidence: row.confidence,
});

const mapState = (row: StateRow): OperatingState => ({
  mode: row.mode,
  flowState: row.flow_state,
  modeDetail: row.mode_detail,
});

/** Latest dispatch recommendation + operating mode, live-updated on new rows. */
export function useOptimization() {
  const [optimizationDecision, setOptimizationDecision] = useState<OptimizationDecision | null>(null);
  const [operatingState, setOperatingState] = useState<OperatingState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([
      supabase.from("optimization_decisions").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("operating_state").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    ]).then(([decision, state]) => {
      if (!active) return;
      if (decision.data) setOptimizationDecision(mapDecision(decision.data));
      if (state.data) setOperatingState(mapState(state.data));
      setLoading(false);
    });

    const channel = supabase
      .channel(`optimization-live-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "optimization_decisions" },
        (payload) => setOptimizationDecision(mapDecision(payload.new as DecisionRow))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "operating_state" },
        (payload) => setOperatingState(mapState(payload.new as StateRow))
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { optimizationDecision, operatingState, loading };
}
