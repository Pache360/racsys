"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Sidebar from "../../components/sidebar"
import Header from "../../components/header"
import { PageContainer, GlassCard, PageTitle, Button } from "../../components/ui"

export default function ContentPage() {
  const [brands, setBrands] = useState<any[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [form, setForm] = useState({
    title: "",
    short_description: "",
    content_type: "",
    objective: "",
    copy: "",
    scheduled_date: "",
    brand_id: "",
    is_paid: false
  })

  const fetchBrands = async () => {
    const { data } = await supabase.from("brands").select("*")
    setBrands(data || [])
  }

  useEffect(() => {
    fetchBrands()
  }, [])

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    })
  }

  const uploadImage = async (file: File, contentId: string) => {
    const filePath = `${contentId}`

    const { error } = await supabase.storage
      .from("content-images")
      .upload(filePath, file)

    if (error) throw error

    const { data } = supabase.storage
      .from("content-images")
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleSubmit = async () => {
    const { data, error } = await supabase
      .from("content")
      .insert([form])
      .select()
      .single()

    if (error) {
      alert("Error al guardar")
      console.log(error)
      return
    }

    if (imageFile) {
      const imageUrl = await uploadImage(imageFile, data.id)

      await supabase
        .from("content")
        .update({ image_url: imageUrl })
        .eq("id", data.id)
    }

    alert("Contenido guardado 🚀")
  }

  return (
    <div className="flex">

      <Sidebar />

      <PageContainer>

        <Header />

        <PageTitle>Nuevo Contenido</PageTitle>

        <GlassCard>

          <div className="grid grid-cols-2 gap-4">

            <Input label="Título" name="title" value={form.title} onChange={handleChange} />

            <Input label="Fecha" type="date" name="scheduled_date" value={form.scheduled_date} onChange={handleChange} />

            <Textarea label="Descripción breve" name="short_description" value={form.short_description} onChange={handleChange} />

            <Select label="Tipo" name="content_type" value={form.content_type} onChange={handleChange}>
              <option value="">Selecciona</option>
              <option value="meme">Meme</option>
              <option value="infografia">Infografía</option>
              <option value="venta">Venta</option>
              <option value="flyer">Flyer</option>
              <option value="promocion">Promoción</option>
            </Select>

            <Select label="Objetivo" name="objective" value={form.objective} onChange={handleChange}>
              <option value="">Selecciona</option>
              <option value="awareness">Awareness</option>
              <option value="engagement">Engagement</option>
              <option value="ventas">Ventas</option>
            </Select>

            <Select label="Marca" name="brand_id" value={form.brand_id} onChange={handleChange}>
              <option value="">Selecciona marca</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>

          </div>

          <Textarea label="Copy" name="copy" value={form.copy} onChange={handleChange} className="mt-4" />

          {/* CHECK */}
          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" name="is_paid" checked={form.is_paid} onChange={handleChange} />
            <label>Contenido pagado</label>
          </div>

          {/* IMAGE */}
          <div className="mt-4">
            <input type="file" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          </div>

          <div className="mt-6">
            <Button onClick={handleSubmit}>
              Guardar contenido 🚀
            </Button>
          </div>

        </GlassCard>

      </PageContainer>
    </div>
  )
}

/* 🔥 COMPONENTES */

function Input({ label, ...props }: any) {
  return (
    <div>
      <label className="text-xs text-gray-400">{label}</label>
      <input {...props} className="w-full p-2 rounded bg-[#020617] border border-white/10 mt-1" />
    </div>
  )
}

function Textarea({ label, ...props }: any) {
  return (
    <div className="col-span-2">
      <label className="text-xs text-gray-400">{label}</label>
      <textarea {...props} className="w-full p-2 rounded bg-[#020617] border border-white/10 mt-1" />
    </div>
  )
}

function Select({ label, children, ...props }: any) {
  return (
    <div>
      <label className="text-xs text-gray-400">{label}</label>
      <select {...props} className="w-full p-2 rounded bg-[#020617] border border-white/10 mt-1">
        {children}
      </select>
    </div>
  )
}