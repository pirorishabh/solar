/**
 * Hand-written mirror of the schema in supabase/migrations/0001_init.sql.
 * If you change the SQL, update this file (or generate it with the Supabase
 * CLI: `supabase gen types typescript --linked > client/src/types/database.ts`).
 */

export type HealthState = "healthy" | "watch" | "critical" | "neutral";
export type OperatingMode = "Self-Powered" | "Cost Saving" | "Emergency Watch" | "Grid Backup";
export type PowerFlowState = "normal" | "high-demand" | "grid-outage" | "recovery";
export type AlertStatus = "Open" | "Acknowledged";

export interface Database {
  public: {
    Tables: {
      telemetry: {
        Row: {
          id: number;
          site: string;
          solar_kw: number;
          grid_kw: number;
          battery_soc: number;
          battery_kw: number;
          load_kw: number;
          critical_load_kw: number;
          tier2_load_kw: number;
          tier3_load_kw: number;
          estimated_savings_inr: number;
          grid_connected: boolean;
          recorded_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["telemetry"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["telemetry"]["Row"]>;
        Relationships: [];
      };
      energy_history: {
        Row: {
          id: number;
          time_label: string;
          solar: number;
          demand: number;
          battery: number;
          grid: number;
          forecast: number;
          recorded_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["energy_history"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["energy_history"]["Row"]>;
        Relationships: [];
      };
      alerts: {
        Row: {
          id: number;
          title: string;
          detail: string;
          occurred_at: string;
          state: Exclude<HealthState, "neutral">;
          site: string;
          status: AlertStatus;
          asset_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["alerts"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["alerts"]["Row"]>;
        Relationships: [];
      };
      solar_forecast: {
        Row: {
          id: number;
          current: number;
          next_hour: number;
          peak_expected: number;
          confidence: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["solar_forecast"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["solar_forecast"]["Row"]>;
        Relationships: [];
      };
      load_forecast: {
        Row: {
          id: number;
          current: number;
          expected_peak: number;
          peak_time: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["load_forecast"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["load_forecast"]["Row"]>;
        Relationships: [];
      };
      optimization_decisions: {
        Row: {
          id: number;
          action: string;
          reason: string;
          expected_effect: { label: string; value: string }[];
          confidence: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["optimization_decisions"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["optimization_decisions"]["Row"]>;
        Relationships: [];
      };
      operating_state: {
        Row: {
          id: number;
          mode: OperatingMode;
          flow_state: PowerFlowState;
          mode_detail: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["operating_state"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["operating_state"]["Row"]>;
        Relationships: [];
      };
      priority_dispatch: {
        Row: {
          id: number;
          tier: string;
          asset_id: string;
          label: string;
          description: string;
          state: string;
          status: HealthState;
          allocation: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["priority_dispatch"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["priority_dispatch"]["Row"]>;
        Relationships: [];
      };
      feature1_metering: {
        Row: {
          id: number;
          metric: string;
          current_value: string;
          reference_value: string;
          status: string;
          source: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["feature1_metering"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["feature1_metering"]["Row"]>;
        Relationships: [];
      };
    };
  };
}
