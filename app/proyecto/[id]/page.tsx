'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  XMarkIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditarProyectoPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [errorVisible, setErrorVisible] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [categoria, setCategoria] = useState('');

  const [formData, setFormData] = useState({
    titulo: '',
    cliente: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_entrega: '',
    fecha_tomas: '',
    ubicacion: '',
    prioridad: '',
    estado: '',
    logo_url: '' 
  });

  const listaEstados = ['Cotización', 'Autorización', 'Planeación', 'Agendado', 'Tomas', 'Edición', 'Revisión', 'Cambios', 'Entregado', 'Parrilla', 'Diseño', 'Programado', 'Publicado'];

  useEffect(() => {
    const fetchProyecto = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('proyectos')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          setCategoria(data.categoria);
          setFormData({
            titulo: data.titulo || '',
            cliente: data.cliente || '',
            descripcion: data.descripcion || '',
            fecha_inicio: data.fecha_inicio || '',
            fecha_entrega: data.fecha_entrega || '',
            fecha_tomas: data.fecha_tomas || '',
            ubicacion: data.ubicacion || '',
            prioridad: data.prioridad || 'Normal',
            estado: data.estado || 'Cotización',
            logo_url: data.logo_url || ''
          });
        }
      } catch (err: any) {
        setErrorVisible(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProyecto();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('proyectos')
        .update({ 
          titulo: formData.titulo,
          descripcion: formData.descripcion || null,
          fecha_entrega: formData.fecha_entrega || null,
          fecha_tomas: formData.fecha_tomas || null,
          ubicacion: formData.ubicacion,
          prioridad: formData.prioridad,
          estado: formData.estado,
          logo_url: formData.logo_url
        })
        .eq('id', id);

      if (error) throw error;
      
      router.back();
    } catch (err: any) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 font-black italic animate-pulse uppercase tracking-widest">Cargando Proyecto...</p>
    </div>
  );

  if (errorVisible) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
      <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">Error de Conexión</h2>
      <p className="text-gray-500 max-w-md mb-6">{errorVisible}</p>
      <button onClick={() => window.location.reload()} className="bg-white text-black px-8 py-3 rounded-full font-black uppercase italic text-xs tracking-widest">Reintentar</button>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-12 border-b border-white/5 pb-8">
        <div className="flex items-center gap-4">
          <div className="bg-purple-600 p-3 rounded-2xl rotate-3 shadow-lg shadow-purple-600/20">
            <PencilIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase">Editar Registro</h1>
            <p className="text-gray-500 text-[10px] tracking-[0.4em] font-bold uppercase">PACHE360 STUDIO / {categoria}</p>
          </div>
        </div>
        <button onClick={() => router.back()} className="hover:rotate-90 transition-transform duration-300">
          <XMarkIcon className="h-8 w-8 text-gray-500" />
        </button>
      </header>

      {/* AQUÍ ESTÁ EL FORM CORREGIDO */}
      <form onSubmit={handleSave} className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#111] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Título del Proyecto</label>
          <input required value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} className="w-full bg-[#0d0d0d] border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500 font-bold italic transition-all text-sm uppercase" />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Prioridad</label>
          <select value={formData.prioridad} onChange={e => setFormData({...formData, prioridad: e.target.value})} className="w-full bg-[#0d0d0d] border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500 font-bold uppercase text-[11px] tracking-widest cursor-pointer">
            {['Alta', 'Normal', 'Cliente Nuevo'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Estado del Proceso</label>
          <select value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} className="w-full bg-[#0d0d0d] border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500 font-bold uppercase text-[11px] tracking-widest cursor-pointer">
            {listaEstados.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Descripción / Notas</label>
          <textarea rows={3} value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full bg-[#0d0d0d] border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500 font-medium transition-all text-sm" />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">
            {categoria === 'Posts' ? 'Fecha Publicación' : 'Fecha Entrega'}
          </label>
          <input type="date" value={formData.fecha_entrega} onChange={e => setFormData({...formData, fecha_entrega: e.target.value})} className="w-full bg-[#0d0d0d] border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500 font-mono text-xs uppercase" />
        </div>

        {categoria !== 'Posts' && (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Fecha de Tomas</label>
            <input type="date" value={formData.fecha_tomas} onChange={e => setFormData({...formData, fecha_tomas: e.target.value})} className="w-full bg-[#0d0d0d] border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500 font-mono text-xs uppercase" />
          </div>
        )}

        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">
            {categoria === 'Posts' ? 'URL del Diseño (Imagen)' : 'Ubicación / Link Video'}
          </label>
          <input value={formData.logo_url} onChange={e => setFormData({...formData, logo_url: e.target.value})} placeholder="https://..." className="w-full bg-[#0d0d0d] border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500 text-xs font-mono" />
        </div>

        <div className="md:col-span-2 pt-6">
          <button disabled={isSaving} type="submit" className="w-full bg-purple-600 hover:bg-purple-500 py-5 rounded-2xl font-black uppercase italic tracking-[0.25em] transition-all shadow-xl shadow-purple-600/20 active:scale-95 disabled:opacity-50 text-xs">
            {isSaving ? 'GUARDANDO CAMBIOS...' : 'ACTUALIZAR PROYECTO'}
          </button>
        </div>
      </form>
    </main>
  );
}