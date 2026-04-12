'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeftIcon, 
  VideoCameraIcon, 
  PlayIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  CalendarIcon // Nuevo icono para entrega
} from '@heroicons/react/24/outline';

export default function VideosPage() {
  const [proyectosVideo, setProyectosVideo] = useState<any[]>([]);
  const [filtroMarca, setFiltroMarca] = useState('');

  const listaEstados = ['Cotización', 'Autorización', 'Planeación', 'Tomas', 'Edición', 'Revisión', 'Cambios', 'Entregado'];

  const formatVideoUrl = (url: string) => {
    if (!url) return "";
    if (url.includes('youtube.com/embed/')) return url;
    
    let videoId = "";
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
    } else if (url.includes('v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const fetchVideos = async () => {
    // CAMBIO: Aseguramos traer todos los campos, incluyendo fechas
    const { data, error } = await supabase
      .from('proyectos')
      .select('*')
      .eq('categoria', 'Video')
      .order('created_at', { ascending: false });

    if (data) {
      const formateados = data.map(p => ({
        id: p.id,
        titulo: p.titulo,
        cliente: p.cliente,
        videoUrl: formatVideoUrl(p.logo_url || p.descripcion), 
        estado: p.estado || "Cotización",
        prioridad: p.prioridad || "Normal",
        // CAMBIO: Mapeamos las nuevas fechas
        fecha_tomas: p.fecha_tomas,
        fecha_entrega: p.fecha_entrega
      }));
      setProyectosVideo(formateados);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const updateEstado = async (id: string, nuevoEstado: string) => {
    const { error } = await supabase
      .from('proyectos')
      .update({ estado: nuevoEstado })
      .eq('id', id);
    
    if (!error) {
      setProyectosVideo(prev => prev.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p));
    } else {
      alert('Error al actualizar: ' + error.message);
    }
  };

  const deleteVideo = async (id: string) => {
    if (confirm('¿Deseas eliminar este proyecto de video?')) {
      const { error } = await supabase.from('proyectos').delete().eq('id', id);
      if (!error) fetchVideos();
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Cotización': return 'text-gray-400 border-gray-400';
      case 'Autorización': return 'text-blue-400 border-blue-400';
      case 'Planeación': return 'text-yellow-400 border-yellow-400';
      case 'Tomas': return 'text-orange-400 border-orange-400';
      case 'Edición': return 'text-purple-400 border-purple-400';
      case 'Revisión': return 'text-pink-400 border-pink-400';
      case 'Cambios': return 'text-red-400 border-red-400';
      case 'Entregado': return 'text-green-400 border-green-400';
      default: return 'text-white border-white';
    }
  };

  const getPrioridadEstilo = (prio: string) => {
    switch (prio) {
      case 'Alta': return 'border-red-500 text-red-400 bg-red-500/20';
      case 'Cliente Nuevo': return 'border-cyan-500 text-cyan-400 bg-cyan-500/20';
      default: return 'border-white/10 text-white bg-black/40';
    }
  };

  const proyectosFiltrados = proyectosVideo.filter(p => 
    p.cliente.toLowerCase().includes(filtroMarca.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      {/* NAVEGACIÓN Y FILTRO RESPONSIVO */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-all w-fit font-bold text-[10px] md:text-sm uppercase italic">
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Volver al Dashboard</span>
        </Link>

        <div className="relative group w-full sm:w-auto">
          <FunnelIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
          <input 
            type="text"
            placeholder="Filtrar por marca..."
            value={filtroMarca}
            onChange={(e) => setFiltroMarca(e.target.value)}
            className="bg-[#111] border border-gray-800 rounded-xl py-3 md:py-2 pl-10 pr-4 text-xs outline-none focus:border-purple-500 transition-all w-full sm:w-64 text-white"
          />
        </div>
      </div>

      <header className="flex items-center gap-4 mb-10">
        <div className="bg-purple-600 p-2 md:p-3 rounded-xl md:rounded-2xl">
          <VideoCameraIcon className="h-6 w-6 md:h-8 md:w-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold italic uppercase tracking-tighter leading-none">Producción de Video</h1>
          <p className="text-gray-500 text-[8px] md:text-sm tracking-[0.2em] font-black uppercase mt-1">PACHE360 STUDIO</p>
        </div>
      </header>

      {/* GRID DE VIDEOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {proyectosFiltrados.map((proy) => (
          <div key={proy.id} className="bg-[#111] rounded-3xl overflow-hidden border border-gray-800 hover:border-purple-500/50 transition-all group relative shadow-2xl">
            
            {/* ACCIONES SIEMPRE VISIBLES EN MÓVIL */}
            <div className="absolute top-4 left-4 z-20 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <Link href={`/proyecto/${proy.id}`} className="bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 hover:text-purple-400 transition-colors">
                <PencilIcon className="h-4 w-4 text-white" />
              </Link>
              <button onClick={() => deleteVideo(proy.id)} className="bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 hover:text-red-500 transition-colors">
                <TrashIcon className="h-4 w-4 text-white" />
              </button>
            </div>

            <div className="aspect-video bg-black flex items-center justify-center relative">
              <div className={`absolute top-4 right-4 z-10 backdrop-blur-md px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border ${getPrioridadEstilo(proy.prioridad)}`}>
                {proy.prioridad}
              </div>
              
              {proy.videoUrl ? (
                <iframe 
                  className="w-full h-full"
                  src={proy.videoUrl}
                  title={proy.titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="text-center">
                  <PlayIcon className="h-10 w-10 md:h-12 md:w-12 text-gray-800 mx-auto mb-2" />
                  <p className="text-gray-700 text-xs font-bold uppercase italic tracking-widest">Esperando material...</p>
                </div>
              )}
            </div>

            <div className="p-5 md:p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg md:text-xl font-bold mb-1 text-purple-100 uppercase italic group-hover:text-purple-400 transition-colors truncate max-w-62.5 md:max-w-none">{proy.titulo}</h3>
                  <p className="text-gray-500 text-xs md:text-sm italic font-medium uppercase">Cliente: {proy.cliente}</p>
                </div>
              </div>

              {/* --- CAMBIO: BLOQUE DE FECHAS --- */}
              <div className="grid grid-cols-2 gap-3 mb-6 pt-4 border-t border-gray-800/50">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-purple-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <VideoCameraIcon className="h-3 w-3" /> Producción
                  </span>
                  <span className="text-[9px] md:text-[10px] font-mono text-gray-300 bg-black/40 px-2 py-1 rounded-md border border-gray-800 text-center">
                    {proy.fecha_tomas ? proy.fecha_tomas : 'PENDIENTE'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-cyan-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" /> Entrega
                  </span>
                  <span className="text-[9px] md:text-[10px] font-mono text-gray-300 bg-black/40 px-2 py-1 rounded-md border border-gray-800 text-center">
                    {proy.fecha_entrega ? proy.fecha_entrega : 'SIN FECHA'}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <span className="text-[9px] md:text-[10px] uppercase text-gray-500 font-bold tracking-widest">Fase del Proyecto</span>
                
                <select 
                  value={proy.estado}
                  onChange={(e) => updateEstado(proy.id, e.target.value)}
                  className={`w-full text-center py-3 md:py-2.5 px-4 rounded-xl border font-bold text-[10px] md:text-xs uppercase tracking-widest ${getEstadoColor(proy.estado)} bg-transparent cursor-pointer outline-none appearance-none hover:bg-white/5 transition-colors shadow-inner`}
                >
                  {listaEstados.map(est => (
                    <option key={est} value={est} className="bg-[#0a0a0a] text-white">
                      {est}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {proyectosFiltrados.length === 0 && (
        <div className="text-center py-20 text-gray-600 italic uppercase font-black tracking-widest opacity-50 text-xs md:text-sm">
          No hay producciones de video bajo esa marca.
        </div>
      )}
    </main>
  );
}