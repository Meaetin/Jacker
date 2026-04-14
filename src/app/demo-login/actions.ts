"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function signInAsDemo() {
  const admin = createAdminClient();

  const { data, error } = await admin.auth.signInWithPassword({
    email: process.env.DEMO_USER_EMAIL!,
    password: process.env.DEMO_USER_PASSWORD!,
  });

  if (error || !data.session) {
    redirect("/login?error=demo_unavailable");
  }

  // Set the session in the user's browser cookies
  const supabase = await createClient();
  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
