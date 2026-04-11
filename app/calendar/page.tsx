"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Sidebar from "../../components/sidebar"
import Header from "../../components/header"
import { PageContainer, GlassCard, PageTitle } from "../../components/ui"

export default function CalendarPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])

  const [selectedClient, setSelectedClient] = useState("all")
  const [selectedBrand, setSelectedBrand] = useState("all")

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

  useEffect(() => {
    fetchAll()
  }, [])

  // 🔥 FILTRO
  const filteredPosts = posts.filter(p => {
    const byClient =
      selectedClient === "all" || p.brands?.client_id === selectedClient

    const byBrand =
      selectedBrand === "all" || p.brand_id === selectedBrand

    return byClient && byBrand
  })

  const days = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"]

  const getStatusColor = (post: any) => {
    if (!post.published_date) return "bg-gray-600"

    const scheduled = new Date(post.scheduled_date)
    const published = new Date(post.published_date)

    const diff = Math.floor(
      (published.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diff <= 0) return "bg-green-600"
    if (diff <= 1) return "bg-yellow-500"
    return "bg-red-600"
  }

  return (
    <div className="flex">

      <Sidebar />

      <PageContainer>

        <Header />

        <PageTitle>📅 Parrilla Semanal</PageTitle>

        {/* 🔥 FILTROS */}
        <div className="flex gap-2 mb-4">

          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="bg-black border p-2 rounded"
          >
            <option value="all">🌎 Todos los clientes</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="bg-black border p-2 rounded"
          >
            <option value="all">🏷 Todas las marcas</option>
            {brands
              .filter(b => selectedClient === "all" || b.client_id === selectedClient)
              .map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
          </select>

        </div>

        <div className="grid grid-cols-7 gap-4">

          {days.map((day, i) => (
            <GlassCard key={day} title={day}>

              {filteredPosts
                .filter(p =>
                  p.scheduled_date &&
                  new Date(p.scheduled_date).getDay() === i
                )
                .map(post => {

                  let color = getStatusColor(post)

                  return (
                    <div
                      key={post.id}
                      className={`p-2 mb-2 rounded text-xs ${color}`}
                    >

                      <p className="font-bold">{post.title}</p>
                      <p>{post.brands?.name}</p>

                      {/* 💬 COMENTARIO */}
                      {post.approval_comment && (
                        <p className="bg-black/20 p-1 rounded mt-1">
                          💬 {post.approval_comment}
                        </p>
                      )}

                      {/* 🚀 PUBLICAR / DESPUBLICAR */}
                      <button
                        onClick={async () => {

                          if (!post.published_date) {
                            if (post.approval_status !== "aprobado") return

                            await supabase
                              .from("content")
                              .update({
                                published_date: new Date().toISOString()
                              })
                              .eq("id", post.id)

                          } else {
                            await supabase
                              .from("content")
                              .update({ published_date: null })
                              .eq("id", post.id)
                          }

                          fetchAll()
                        }}
                        disabled={!post.published_date && post.approval_status !== "aprobado"}
                        className={`mt-1 px-2 py-1 rounded w-full
                          ${
                            post.published_date
                              ? "bg-red-600"
                              : post.approval_status === "aprobado"
                              ? "bg-black"
                              : "bg-gray-500 opacity-50"
                          }
                        `}
                      >
                        {post.published_date ? "❌ Despublicar" : "🚀 Publicar"}
                      </button>

                      {/* 🔥 APROBACIÓN */}
                      <div className="flex gap-2 mt-2">

                        {/* TOGGLE APROBADO */}
                        <button
                          onClick={async () => {
                            const newStatus =
                              post.approval_status === "aprobado"
                                ? "pendiente"
                                : "aprobado"

                            await supabase
                              .from("content")
                              .update({
                                approval_status: newStatus,
                                approval_comment: null
                              })
                              .eq("id", post.id)

                            fetchAll()
                          }}
                          className={`px-2 py-1 rounded text-[10px] w-full
                            ${
                              post.approval_status === "aprobado"
                                ? "bg-green-700"
                                : "bg-gray-700"
                            }
                          `}
                        >
                          {post.approval_status === "aprobado"
                            ? "✔ Aprobado"
                            : "Aprobar"}
                        </button>

                        {/* CAMBIOS */}
                        <button
                          onClick={async () => {
                            const comment = prompt("¿Qué cambios necesitas?")
                            if (!comment) return

                            await supabase
                              .from("content")
                              .update({
                                approval_status: "cambios",
                                approval_comment: comment
                              })
                              .eq("id", post.id)

                            fetchAll()
                          }}
                          className="bg-yellow-500 px-2 py-1 rounded text-[10px] w-full"
                        >
                          ✏️ Cambios
                        </button>

                      </div>

                    </div>
                  )
                })}

            </GlassCard>
          ))}

        </div>

      </PageContainer>
    </div>
  )
}