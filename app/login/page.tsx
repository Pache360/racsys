"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert("Error al iniciar sesión")
      return
    }

    // 🔥 saber si es cliente o admin
    const { data: { user } } = await supabase.auth.getUser()

    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user?.id)
      .single()

    if (client) {
      router.push("/client/dashboard")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">

      <div className="bg-[#0f172a] p-6 rounded w-80">

        <h1 className="text-xl font-bold mb-4">Login</h1>

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-2 p-2 rounded text-black"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-2 rounded text-black"
        />

        <button
          onClick={handleLogin}
          className="bg-purple-600 w-full py-2 rounded"
        >
          Entrar
        </button>

      </div>

    </div>
  )
}