"use client"

import { supabase } from "@/lib/supabase"

export default function Header() {
  return (
    <div className="flex justify-between items-center p-4 bg-[#1e293b] text-white">

      <input
        placeholder="Buscar..."
        className="bg-[#0f172a] px-3 py-2 rounded w-64"
      />

      <button
        onClick={async () => {
          await supabase.auth.signOut()
          window.location.href = "/login"
        }}
        className="bg-red-600 px-3 py-1 rounded"
      >
        Logout
      </button>

    </div>
  )
}