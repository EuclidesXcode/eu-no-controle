import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fidbarjoswfggjpipmuv.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZGJhcmpvd3dmZ2dqcGlwbXUidiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzQxMTE4NDQ0LCJleHAiOjIwNTY2OTQ0NDR9.5681067952141111111111111111111111111111111111111111111111111111";

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials missing! Check your Environment Variables on Vercel.");
  }

  return createBrowserClient(
    supabaseUrl || "",
    supabaseKey || ""
  )
}
