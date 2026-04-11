'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeftIcon, 
  PlayIcon, 
  PencilSquareIcon, 
  VideoCameraIcon, 
  SparklesIcon,
  CheckBadgeIcon,
  TrashIcon,
  PencilIcon,
  PlusIcon,
  XMarkIcon,
  CalendarIcon,
  UserGroupIcon,
  LinkIcon,
  DocumentTextIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

interface DiaCalendario {
  nombre: string;
  fechaFull: string;
  soloDia: number;
}

export default function YouTubePage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isTeleprompterMode, setIsTeleprompterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    titulo: '',
    canal: '@terrorshadows',
    guion: '',
    guion_tecnico: '',
    fecha_grabacion: '',
    tiene_invitados: false,
    video_url: ''
  });

  const fases = [
    { nombre: 'Guion', icon: <PencilSquareIcon className="h-4 w-4" />, color: 'text-blue-400' },
    { nombre: 'Grabación', icon: <VideoCameraIcon className="h-4 w-4" />, color: 'text-orange-400' },
    { nombre: 'Edición', icon: <SparklesIcon className="h-4 w-4" />, color: 'text-purple-400' },
    { nombre: 'Publicado', icon: <CheckBadgeIcon className="h-4 w-4" />, color: 'text-green-400' }
  ];

  const formatYoutubeLink = (url: string) => {
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

  const fetchYoutubeVideos = async () => {
    const { data } = await supabase
      .from('proyectos')
      .select('*')
      .eq('categoria', 'YouTube')
      .order('created_at', { ascending: false });

    if (data) {
      setVideos(data.map(v => ({
        id: v.id,
        titulo: v.titulo,
        canal: v.cliente,
        estado: v.estado || 'Guion',
        fecha: v.fecha_tomas,
        guion: v.descripcion,
        guion_tecnico: v.ubicacion,
        invitados: v.prioridad === 'Alta',
        video_url: formatYoutubeLink(v.logo_url)
      })));
    }
  };

  useEffect(() => { fetchYoutubeVideos(); }, []);

  useEffect(() => {
    let interval: any;
    if (isTeleprompterMode && scrollRef.current) {
      interval = setInterval(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop += 1;
        }
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isTeleprompterMode]);

  const updateEstado = async (id: string, nuevoEstado: string) => {
    await supabase.from('proyectos').update({ estado: nuevoEstado }).eq('id', id);
    fetchYoutubeVideos();
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('proyectos').insert([{
      titulo: formData.titulo,
      cliente: formData.canal,
      categoria: 'YouTube',
      estado: 'Guion',
      descripcion: formData.guion,
      ubicacion: formData.guion_tecnico,
      fecha_tomas: formData.fecha_grabacion,
      prioridad: formData.tiene_invitados ? 'Alta' : 'Normal',
      logo_url: formData.video_url
    }]);

    if (!error) {
      setIsModalOpen(false);
      setFormData({ titulo: '', canal: '@terrorshadows', guion: '', guion_tecnico: '', fecha_grabacion: '', tiene_invitados: false, video_url: '' });
      fetchYoutubeVideos();
    }
    setLoading(false);
  };

  const deleteVideo = async (id: string) => {
    if (confirm('¿Eliminar idea de video?')) {
      await supabase.from('proyectos').delete().eq('id', id);
      fetchYoutubeVideos();
    }
  };

  const onDragStart = (e: any, id: string) => e.dataTransfer.setData("videoId", id);
  const onDragOver = (e: any) => e.preventDefault();
  const onDrop = (e: any, nuevoEstado: string) => {
    const id = e.dataTransfer.getData("videoId");
    updateEstado(id, nuevoEstado);
  };

  const getFechaColor = (fecha: string, estado: string) => {
    if (estado === 'Edición' || estado === 'Publicado') return 'text-green-400 border-green-400/30 bg-green-400/10';
    const hoy = new Date();
    const fechaGrab = new Date(fecha);
    const diff = fechaGrab.getTime() - hoy.getTime();
    const dias = diff / (1000 * 60 * 60 * 24);
    if (dias < 0) return 'text-gray-500 border-gray-800';
    if (dias <= 2) return 'text-red-400 border-red-400/30 bg-red-400/10 animate-pulse';
    return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      {/* NAVEGACIÓN Y BOTÓN NUEVO */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-all w-fit font-bold text-[10px] md:text-xs uppercase italic">
          <ArrowLeftIcon className="h-4 w-4" /> Volver al Dashboard
        </Link>
        <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto bg-red-600 hover:bg-red-500 px-6 py-3 rounded-xl font-black italic uppercase text-[10px] md:text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-600/20">
          <PlusIcon className="h-4 w-4" /> Nueva Idea
        </button>
      </div>

      <header className="flex items-center gap-4 mb-10">
        <div className="bg-red-600 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-lg shadow-red-600/20">
          <PlayIcon className="h-6 w-6 md:h-8 md:w-8 text-white" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter leading-none">YouTube Content Studio</h1>
          <p className="text-gray-500 text-[8px] md:text-[10px] tracking-[0.2em] font-bold uppercase mt-1">Gestión de Canales / Pache360</p>
        </div>
      </header>

      {/* TABLERO KANBAN RESPONSIVO: Scroll horizontal en móvil */}
      <div className="flex overflow-x-auto pb-6 gap-6 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible snap-x">
        {fases.map((fase) => (
          <div key={fase.nombre} 
               onDragOver={onDragOver} 
               onDrop={(e) => onDrop(e, fase.nombre)} 
               className="bg-[#111]/50 rounded-3xl p-5 border border-white/5 flex flex-col gap-4 min-w-[280px] md:min-w-0 snap-center">
            
            <div className={`flex items-center gap-2 px-2 pb-2 border-b border-white/5 ${fase.color}`}>
              {fase.icon}
              <h2 className="font-black uppercase italic tracking-widest text-[10px]">{fase.nombre}</h2>
              <span className="ml-auto bg-white/5 px-2 py-0.5 rounded-lg text-[9px] text-gray-400">{videos.filter(v => v.estado === fase.nombre).length}</span>
            </div>

            <div className="flex flex-col gap-4 min-h-[50vh] md:min-h-[60vh]">
              {videos.filter(v => v.estado === fase.nombre).map((video) => (
                <div key={video.id} draggable onDragStart={(e) => onDragStart(e, video.id)} className="bg-[#161616] border border-gray-800 rounded-2xl group relative hover:border-purple-500/40 transition-all cursor-grab active:cursor-grabbing overflow-hidden">
                  
                  {video.video_url && (
                    <div className="aspect-video w-full bg-black border-b border-gray-800">
                      <iframe className="w-full h-full pointer-events-none" src={video.video_url} title={video.titulo}></iframe>
                    </div>
                  )}

                  <div className="p-4">
                    {/* ACCIONES: Visibles siempre en móvil */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={() => { setSelectedVideo(video); setIsScriptModalOpen(true); }} className="p-1.5 bg-black/60 rounded-lg hover:text-cyan-400 text-gray-400">
                        <DocumentTextIcon className="h-3 w-3" />
                      </button>
                      <Link href={`/proyecto/${video.id}`} className="p-1.5 bg-black/60 rounded-lg hover:text-purple-400 text-gray-400">
                        <PencilIcon className="h-3 w-3" />
                      </Link>
                      <button onClick={() => deleteVideo(video.id)} className="p-1.5 bg-black/60 rounded-lg hover:text-red-500 text-gray-500">
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full border border-white/10 ${video.canal === '@terrorshadows' ? 'text-red-400 bg-red-400/5' : 'text-yellow-400 bg-yellow-400/5'}`}>{video.canal}</span>
                      {video.invitados && <UserGroupIcon className="h-3 w-3 text-cyan-400" />}
                    </div>

                    <h3 className="text-xs font-bold text-white leading-tight uppercase italic mb-4 pr-12">{video.titulo}</h3>

                    {video.fecha && (
                      <div className={`flex items-center gap-1.5 text-[8px] font-bold py-1.5 px-3 rounded-lg border mb-4 w-fit ${getFechaColor(video.fecha, video.estado)}`}>
                        <CalendarIcon className="h-3 w-3" /> {video.fecha}
                      </div>
                    )}

                    <button 
                      onClick={() => { setSelectedVideo(video); setIsScriptModalOpen(true); }} 
                      className="w-full mb-3 bg-white/5 hover:bg-white/10 border border-white/5 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all"
                    >
                      Ver Guiones
                    </button>

                    <select value={video.estado} onChange={(e) => updateEstado(video.id, e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-[9px] font-bold uppercase tracking-widest outline-none focus:border-purple-500 cursor-pointer">
                      {fases.map(f => <option key={f.nombre} value={f.nombre} className="bg-[#111]">{f.nombre}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL VISOR DE GUIONES Y TELEPROMPTER RESPONSIVO */}
      {isScriptModalOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col overflow-hidden">
          <div className="w-full flex flex-col h-full bg-[#111] md:max-w-4xl md:mx-auto md:my-8 md:rounded-[3rem] md:border md:border-white/10 shadow-2xl relative overflow-hidden">
            
            <div className="p-4 md:p-8 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#161616] gap-4">
              <div>
                <h2 className="text-lg md:text-2xl font-black text-white italic uppercase tracking-tighter leading-tight">{selectedVideo.titulo}</h2>
                <p className="text-purple-400 text-[8px] md:text-[10px] font-black tracking-widest uppercase mt-1">{selectedVideo.canal}</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => setIsTeleprompterMode(!isTeleprompterMode)}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] transition-all ${isTeleprompterMode ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}
                >
                  <BoltIcon className="h-4 w-4" /> {isTeleprompterMode ? 'Teleprompter ON' : 'Teleprompter OFF'}
                </button>
                <button onClick={() => {setIsScriptModalOpen(false); setIsTeleprompterMode(false);}} className="text-gray-500 hover:text-white p-2">
                  <XMarkIcon className="h-6 w-6 md:h-8 md:w-8" />
                </button>
              </div>
            </div>

            <div 
              ref={scrollRef}
              className={`flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar ${isTeleprompterMode ? 'bg-black' : ''}`}
            >
              {!isTeleprompterMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] border-b border-purple-500/20 pb-2">Guion Literario</h3>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">{selectedVideo.guion || "Sin guion."}</p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] border-b border-orange-500/20 pb-2">Guion Técnico</h3>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm italic">{selectedVideo.guion_tecnico || "Sin guion técnico."}</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto py-20 md:py-40">
                  <p className="text-white text-3xl md:text-5xl font-bold leading-tight text-center whitespace-pre-wrap select-none">
                    {selectedVideo.guion || "Carga un guion."}
                  </p>
                </div>
              )}
            </div>

            {isTeleprompterMode && (
              <div className="absolute top-1/2 left-0 w-full h-16 md:h-24 border-y border-cyan-500/20 pointer-events-none flex items-center justify-between px-2">
                <div className="w-3 h-3 md:w-4 md:h-4 bg-cyan-500 rotate-45 -ml-1.5"></div>
                <div className="w-3 h-3 md:w-4 md:h-4 bg-cyan-500 rotate-45 -mr-1.5"></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL NUEVA IDEA: Estilo Drawer en móvil */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-[#111] border border-red-500/30 w-full max-w-2xl rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#161616]">
              <h2 className="text-xs font-black text-red-500 uppercase italic tracking-widest">Producción de YouTube</h2>
              <button onClick={() => setIsModalOpen(false)}><XMarkIcon className="h-6 w-6 text-gray-500" /></button>
            </div>
            
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 overflow-y-auto custom-scrollbar">
              <div className="md:col-span-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Título del Video</label>
                <input type="text" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl md:rounded-2xl p-4 outline-none focus:border-red-500 font-bold italic text-white" />
              </div>

              <div><label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Canal</label>
                <select value={formData.canal} onChange={e => setFormData({...formData, canal: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 outline-none font-bold uppercase text-[10px] text-white">
                  <option value="@terrorshadows">@terrorshadows</option>
                  <option value="@mapachebiker">@mapachebiker</option>
                </select>
              </div>

              <div><label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Fecha</label>
                <input type="date" value={formData.fecha_grabacion} onChange={e => setFormData({...formData, fecha_grabacion: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 outline-none font-mono text-[10px] text-white" />
              </div>

              <div className="md:col-span-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Link YouTube</label>
                <div className="flex items-center bg-[#0a0a0a] border border-gray-800 rounded-xl px-4 focus-within:border-red-500 transition-all">
                  <LinkIcon className="h-4 w-4 text-gray-600" />
                  <input type="text" value={formData.video_url} onChange={e => setFormData({...formData, video_url: e.target.value})} placeholder="URL..." className="w-full bg-transparent border-none p-4 outline-none text-[10px] font-mono text-white" />
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center gap-3 bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                  <input type="checkbox" checked={formData.tiene_invitados} onChange={e => setFormData({...formData, tiene_invitados: e.target.checked})} className="w-4 h-4 accent-red-600 bg-black border-gray-800 rounded" />
                  <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">¿Invitados Especiales?</label>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Guion Literario</label>
                <textarea rows={4} value={formData.guion} onChange={e => setFormData({...formData, guion: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 outline-none font-medium text-sm focus:border-red-500 text-white" />
              </div>

              <div className="md:col-span-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Guion Técnico</label>
                <textarea rows={2} value={formData.guion_tecnico} onChange={e => setFormData({...formData, guion_tecnico: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 outline-none font-medium text-sm focus:border-red-500 text-white" />
              </div>

              <div className="md:col-span-2 pb-8 md:pb-0">
                <button onClick={handleSave} disabled={loading} className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-2xl font-black uppercase italic tracking-[0.2em] transition-all active:scale-95 text-[10px]">
                  {loading ? 'Sincronizando...' : 'Iniciar Producción'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}