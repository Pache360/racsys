"use client"

import { useRouter } from "next/navigation"
import { getUserRole } from "@/lib/auth"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Sidebar from "../../components/sidebar"
import Header from "../../components/header"

import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"

export default function DashboardPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])

  const [selectedClient, setSelectedClient] = useState("all")
  const [selectedBrand, setSelectedBrand] = useState("all")

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    const { data: content } = await supabase
      .from("content")
      .select("*, brands(id, name, client_id)")

    const { data: clientsData } = await supabase.from("clients").select("*")
    const { data: brandsData } = await supabase.from("brands").select("*")

    setPosts(content || [])
    setClients(clientsData || [])
    setBrands(brandsData || [])
  }

  // 🔥 FILTRO
  const filteredPosts = posts.filter(p => {
    const byClient =
      selectedClient === "all" || p.brands?.client_id === selectedClient

    const byBrand =
      selectedBrand === "all" || p.brand_id === selectedBrand

    return byClient && byBrand
  })

  // 🔥 FUNCIÓN PARA DESCARGAR DATOS ACTUALES (CSV)
  const downloadCurrentData = () => {
    if (filteredPosts.length === 0) return;

    // Encabezados del CSV
    const headers = ["ID", "Marca", "Tipo", "Estado", "Fecha Creación", "Objetivo"];
    
    // Mapeo de filas limpiando comas y comillas
    const rows = filteredPosts.map(p => [
      p.id,
      p.brands?.name || "N/A",
      p.content_type || "N/A",
      p.published_date ? "Publicado" : "Pendiente",
      p.created_at ? new Date(p.created_at).toLocaleDateString() : "N/A",
      `"${(p.objective || "").replace(/"/g, '""')}"`
    ].join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `RacSys_Reporte_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 🔥 MÉTRICAS
  const total = filteredPosts.length
  const publicados = filteredPosts.filter(p => p.published_date).length
  const pendientes = filteredPosts.filter(p => !p.published_date).length

  const cumplimiento = total === 0 ? 0 : Math.round((publicados / total) * 100)

  // 🔥 KPI CRECIMIENTO
  const now = new Date()
  const last30 = filteredPosts.filter(p => {
    const d = new Date(p.created_at)
    return (now.getTime() - d.getTime()) < (1000 * 60 * 60 * 24 * 30)
  }).length

  const prev30 = filteredPosts.filter(p => {
    const d = new Date(p.created_at)
    const diff = now.getTime() - d.getTime()
    return diff >= (1000 * 60 * 60 * 24 * 30) &&
           diff < (1000 * 60 * 60 * 24 * 60)
  }).length

  const growth = prev30 === 0 ? 100 : Math.round(((last30 - prev30) / prev30) * 100)

  // 🔥 BURBUJAS
  const brandStats = brands.map(b => ({
    name: b.name,
    count: filteredPosts.filter(p => p.brand_id === b.id).length
  }))

  // 🔥 TIPO CONTENIDO
  const typeMap: any = {}
  filteredPosts.forEach(p => {
    if (!typeMap[p.content_type]) typeMap[p.content_type] = 0
    typeMap[p.content_type]++
  })

  const typeData = Object.keys(typeMap).map(key => ({
    name: key,
    value: typeMap[key]
  }))

  // 🔥 TIMELINE
  const days = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"]

  const timelineData = days.map((d, i) => ({
    day: d,
    value: filteredPosts.filter(p => {
      if (!p.created_at) return false
      return new Date(p.created_at).getDay() === i
    }).length
  }))

  const heatmap = days.map((d, i) => ({
    day: d,
    value: filteredPosts.filter(p => {
      if (!p.created_at) return false
      return new Date(p.created_at).getDay() === i
    }).length
  }))

  const COLORS = ["#8b5cf6","#22c55e","#f59e0b","#ef4444","#06b6d4"]

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen bg-[#020617] text-white">
        <Header />
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">📊 Dashboard</h1>
          </div>

          {/* 🔥 FILTROS Y BOTÓN DE DESCARGA */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex gap-3">
              <select
                value={selectedClient}
                onChange={(e)=>{
                  setSelectedClient(e.target.value)
                  setSelectedBrand("all")
                }}
                className="bg-[#0f172a] border px-3 py-2 rounded text-sm outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="all">🌎 Clientes</option>
                {clients.map(c=>(
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={selectedBrand}
                onChange={(e)=>setSelectedBrand(e.target.value)}
                className="bg-[#0f172a] border px-3 py-2 rounded text-sm outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="all">🏷 Marcas</option>
                {brands
                  .filter(b=>selectedClient==="all"||b.client_id===selectedClient)
                  .map(b=>(
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
              </select>
            </div>

            {/* BOTÓN DE DESCARGA VISTA ACTUAL */}
            <button
              onClick={downloadCurrentData}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition"
            >
              📥 Descargar vista actual (.csv)
            </button>
          </div>

          {/* 🔥 CARDS */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-[#0f172a] p-4 rounded hover:scale-105 transition">
              <p className="text-sm opacity-70">Total</p>
              <h2 className="text-xl font-bold">{total}</h2>
            </div>
            <div className="bg-green-600 p-4 rounded hover:scale-105 transition">
              <p className="text-sm opacity-70">Publicados</p>
              <h2 className="text-xl font-bold">{publicados}</h2>
            </div>
            <div className="bg-yellow-500 p-4 rounded hover:scale-105 transition">
              <p className="text-sm opacity-70">Pendientes</p>
              <h2 className="text-xl font-bold">{pendientes}</h2>
            </div>
            <div className="bg-purple-600 p-4 rounded hover:scale-105 transition">
              <p className="text-sm opacity-70">Cumplimiento</p>
              <h2 className="text-xl font-bold">{cumplimiento}%</h2>
              <div className="bg-black/30 mt-2 h-2 rounded">
                <div
                  className="bg-white h-2 rounded transition-all"
                  style={{ width: `${cumplimiento}%` }}
                />
              </div>
            </div>
            <div className="bg-blue-600 p-4 rounded hover:scale-105 transition">
              <p className="text-sm opacity-70">Crecimiento</p>
              <h2 className="text-xl font-bold">
                {growth > 0 ? "+" : ""}{growth}%
              </h2>
            </div>
          </div>

          {/* 🔥 GRÁFICAS */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#0f172a] p-4 rounded">
              <h2 className="mb-2">Marcas</h2>
              <div className="flex flex-wrap gap-4 mt-2">
                {brandStats.map((b,i)=>(
                  <div
                    key={i}
                    className="rounded-full bg-purple-600 flex items-center justify-center text-[10px] transition-all duration-500 text-center px-1"
                    style={{
                      width: 45 + b.count * 10,
                      height: 45 + b.count * 10
                    }}
                  >
                    {b.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0f172a] p-4 rounded">
              <h2>Tipos</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={typeData} dataKey="value" innerRadius={40}>
                    {typeData.map((_,i)=>(
                      <Cell key={i} fill={COLORS[i%COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0f172a] p-4 rounded">
              <h2>Timeline</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timelineData}>
                  <XAxis dataKey="day" stroke="#475569" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none' }} />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 🔥 HEATMAP */}
          <div className="mt-6 bg-[#0f172a] p-4 rounded">
            <h2>🔥 Actividad semanal</h2>
            <div className="grid grid-cols-7 gap-2 mt-3">
              {heatmap.map((h,i)=>(
                <div
                  key={i}
                  className="h-16 flex flex-col items-center justify-center text-xs rounded transition hover:ring-1 hover:ring-purple-400"
                  style={{
                    backgroundColor: `rgba(139,92,246,${h.value > 0 ? (h.value/total) + 0.1 : 0.05})`
                  }}
                >
                  <span className="font-bold">{h.day}</span>
                  <span>{h.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}