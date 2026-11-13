import { createServerSupabaseClient } from "./server";
import { UserRole } from "@/lib/schemas/database";

export interface AuthenticatedUserSession {
  userId: string;
  email?: string;
  role: UserRole;
  displayName: string;
}

export async function requireUserSession(): Promise<AuthenticatedUserSession> {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("UNAUTHENTICATED");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  return {
    userId: user.id,
    email: user.email,
    role: profile.role as UserRole,
    displayName: profile.display_name,
  };
}

export async function requireRole(allowedRoles: UserRole[]): Promise<AuthenticatedUserSession> {
  const session = await requireUserSession();
  if (!allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
