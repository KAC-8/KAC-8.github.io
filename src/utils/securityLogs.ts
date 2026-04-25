import type { SupabaseClient } from "@supabase/supabase-js";

type SecurityLogParams = {
  supabase: SupabaseClient;
  actionType: string;
  actionStatus?: "success" | "failed";
  userId?: string | null;
  details?: string | null;
  metadata?: Record<string, unknown> | null;
};

async function getClientIpAddress() {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    if (!response.ok) {
      return "unknown";
    }

    const data = (await response.json()) as { ip?: string };
    return data.ip || "unknown";
  } catch {
    return "unknown";
  }
}

export async function createSecurityLog({
  supabase,
  actionType,
  actionStatus = "success",
  userId = null,
  details = null,
  metadata = null,
}: SecurityLogParams) {
  const ipAddress = await getClientIpAddress();

  const { error } = await supabase.from("security_logs").insert({
    user_id: userId,
    action_type: actionType,
    action_status: actionStatus,
    ip_address: ipAddress,
    details,
    metadata,
  });

  return { error };
}
