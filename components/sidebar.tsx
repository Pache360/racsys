"use client"

import Link from "next/link"

export default function Sidebar() {
  return (
    <div className="w-64 bg-[#020617] text-white h-screen p-4 border-r border-white/10">

      <h2 className="text-xl font-bold mb-6">
        🐾 Mapache360
      </h2>

      <nav className="space-y-2 text-sm">

        <MenuItem href="/dashboard" label="📊 Dashboard" />
        <MenuItem href="/calendar" label="📅 Calendario" />
        <MenuItem href="/content" label="📝 Crear contenido" />
        <MenuItem href="/posts" label="📚 Contenidos" />
        <MenuItem href="/export" label="📤 Exportar" />

      </nav>

    </div>
  )
}

function MenuItem({ href, label }: any) {
  return (
    <Link
      href={href}
      className="block px-3 py-2 rounded-lg hover:bg-white/10 transition"
    >
      {label}
    </Link>
  )
}