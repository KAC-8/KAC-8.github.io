import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/utils/supabase";

export function useMaintenanceMode() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("system_settings")
      .select("maintenance_mode")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ maintenance_mode: boolean }>();

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setEnabled(Boolean(data?.maintenance_mode));
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refresh();

    const channel = supabase
      .channel("maintenance-mode-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "system_settings" }, refresh)
      .subscribe();

    const handleRefresh = () => refresh();
    window.addEventListener("kac8-data-updated", handleRefresh);

    return () => {
      window.removeEventListener("kac8-data-updated", handleRefresh);
      supabase.removeChannel(channel);
    };
  }, [refresh, supabase]);

  return { enabled, loading, error, refresh };
}
