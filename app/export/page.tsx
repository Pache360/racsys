"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import Sidebar from "../../components/sidebar"
import Header from "../../components/header"

export default function ExportPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])

  const [selectedClient, setSelectedClient] = useState("all")
  const [selectedBrand, setSelectedBrand] = useState("all")
  const [isExporting, setIsExporting] = useState(false)

  const pdfRef = useRef<HTMLDivElement | null>(null)

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
  const filteredPosts = posts.filter((p) => {
    const byClient =
      selectedClient === "all" || p.brands?.client_id === selectedClient

    const byBrand =
      selectedBrand === "all" || p.brand_id === selectedBrand

    return byClient && byBrand
  })

  // 📄 EXPORT PDF (FIX COMPLETO)
  const exportPDF = async () => {
    if (!pdfRef.current) return

    setIsExporting(true)

    const html2pdf = (await import("html2pdf.js")).default

    setTimeout(() => {
      html2pdf()
        .set({
          margin: 0.5,
          filename: "reporte_contenido.pdf",
          image: { type: "jpeg", quality: 1 },
          html2canvas: {
            scale: 2,
            useCORS: true // 🔥 PARA IMÁGENES
          },
          jsPDF: {
            unit: "in",
            format: "letter",
            orientation: "portrait"
          }
        })
        .from(pdfRef.current!) // 🔥 FIX TYPESCRIPT
        .save()

      setIsExporting(false)
    }, 400)
  }

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 min-h-screen bg-[#020617] text-white">
        <Header />

        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">
            📄 Exportar Reporte
          </h1>

          {/* 🔥 FILTROS */}
          <div className="flex gap-3 mb-6">

            <select
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value)
                setSelectedBrand("all")
              }}
              className="bg-[#0f172a] border px-3 py-2 rounded"
            >
              <option value="all">🌎 Clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-[#0f172a] border px-3 py-2 rounded"
            >
              <option value="all">🏷 Marcas</option>
              {brands
                .filter(
                  (b) =>
                    selectedClient === "all" ||
                    b.client_id === selectedClient
                )
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>

            <button
              onClick={exportPDF}
              className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
            >
              📄 Descargar PDF
            </button>

          </div>

          {/* 🔥 CONTENIDO PARA PDF */}
          <div
            ref={pdfRef}
            style={{
              backgroundColor: "#ffffff",
              color: "#000000",
              padding: "24px",
              borderRadius: "12px"
            }}
          >

            <h2
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "10px"
              }}
            >
              Reporte de Contenido
            </h2>

            <p
              style={{
                fontSize: "12px",
                marginBottom: "20px"
              }}
            >
              Cliente:{" "}
              {selectedClient === "all"
                ? "Todos"
                : clients.find((c) => c.id === selectedClient)?.name}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px"
              }}
            >

              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  style={{
                    border: "1px solid #ddd",
                    padding: "12px",
                    borderRadius: "10px"
                  }}
                >

                  {/* 🖼 IMAGEN */}
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      crossOrigin="anonymous"
                      style={{
                        width: "100%",
                        height: "150px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        marginBottom: "8px"
                      }}
                    />
                  )}

                  <p
                    style={{
                      fontWeight: "bold",
                      fontSize: "13px"
                    }}
                  >
                    {post.title}
                  </p>

                  <p
                    style={{
                      fontSize: "11px",
                      color: "#555"
                    }}
                  >
                    {post.brands?.name}
                  </p>

                  <p
                    style={{
                      fontSize: "11px",
                      marginTop: "4px"
                    }}
                  >
                    {post.scheduled_date
                      ? new Date(post.scheduled_date).toLocaleDateString()
                      : ""}
                  </p>

                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: "bold",
                      marginTop: "4px",
                      color: post.published_date ? "green" : "orange"
                    }}
                  >
                    {post.published_date ? "Publicado" : "Pendiente"}
                  </p>

                </div>
              ))}

            </div>

          </div>

        </div>
      </div>
    </div>
  )
}