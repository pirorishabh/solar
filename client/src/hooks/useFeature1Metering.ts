import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type Row = Database["public"]["Tables"]["feature1_metering"]["Row"];

export type Feature1MeteringRow = {
  metric: string;
  current: string;
  reference: string;
  status: string;
  source: string;
};

const mapRow = (row: Row): Feature1MeteringRow => ({
  metric: row.metric,
  current: row.current_value,
  reference: row.reference_value,
  status: row.status,
  source: row.source,
});

/** Metering instrument rows, live-updated as meter readings are recorded. */
export function useFeature1Metering() {
  const [rows, setRows] = useState<Feature1MeteringRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase
      .from("feature1_metering")
      .select("*")
      .order("id", { ascending: true })
      .then(({ data }) => {
        if (!active) return;
        if (data) setRows(data.map(mapRow));
        setLoading(false);
      });

    const channel = supabase
      .channel(`feature1-metering-live-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feature1_metering" },
        () => {
          supabase
            .from("feature1_metering")
            .select("*")
            .order("id", { ascending: true })
            .then(({ data }) => data && setRows(data.map(mapRow)));
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { rows, loading };
}
