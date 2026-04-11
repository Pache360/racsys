import { supabase } from "@/lib/supabase"

export const getUserRole = async () => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (client) return "client"

  return "admin"
}