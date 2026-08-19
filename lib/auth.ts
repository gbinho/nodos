import type { User } from "@supabase/supabase-js";
import type { ProfileRow } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { supabase: null, user: null, profile: null, configured: false as const };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, profile: null, configured: true as const };
  }

  const profile = await ensureProfile(supabase, user);
  return { supabase, user, profile, configured: true as const };
}

async function ensureProfile(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  user: User,
): Promise<ProfileRow | null> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return existing;

  const username =
    (user.user_metadata?.username as string | undefined) ||
    user.email?.split("@")[0] ||
    null;

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      username,
      total_xp: 0,
    })
    .select("*")
    .single();

  if (error) {
    const { data: retry } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    return retry;
  }

  return created;
}
