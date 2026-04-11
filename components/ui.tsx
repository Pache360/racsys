"use client"

export function PageContainer({ children }: any) {
  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-[#020617] via-[#020617] to-[#0f172a] text-white">
      <div className="p-6 space-y-6">{children}</div>
    </div>
  )
}

export function GlassCard({ title, children }: any) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-lg hover:shadow-2xl transition">
      <h2 className="mb-3 text-sm text-gray-300">{title}</h2>
      {children}
    </div>
  )
}

export function PageTitle({ children }: any) {
  return <h1 className="text-2xl font-bold">{children}</h1>
}

export function Button({ children, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-2 rounded-lg hover:scale-105 transition"
    >
      {children}
    </button>
  )
}