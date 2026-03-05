import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fidbarjoswfggjpipmuv.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZGJhcmpvd3dmZ2dqcGlwbXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NjY2OTIsImV4cCI6MjA4ODI0MjY5Mn0.AtYF_PTVc06jr0NQZe1ghSTGkXaiaVgr9xe3vjmVBZs";

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials missing! Check your Environment Variables on Vercel.");
  }

  return createBrowserClient(
    supabaseUrl || "",
    supabaseKey || ""
  )
}
