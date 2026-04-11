'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  CameraIcon, VideoCameraIcon, PlusIcon, PlayIcon, 
  ChatBubbleLeftRightIcon, CalendarIcon, XMarkIcon,
  UserGroupIcon 
} from '@heroicons/react/24/outline';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoria, setCategoria] = useState('Fotografía');
  const [loading, setLoading] = useState(false);

  const [proyectosDB, setProyectosDB] = useState<any[]>([]);
  const [listaClientesDB, setListaClientesDB] = useState<any[]>([]); 
  const [conteos, setConteos] = useState({ fotos: 0, videos: 0, youtube: 0, posts: 0 });

  const [formData, setFormData] = useState({
    titulo: '',
    cliente: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_entrega: '',
    fecha_tomas: '',
    ubicacion: '',
    prioridad: 'Normal',
    nuevoClienteNombre: '',
    nuevoClienteContacto: '',
    nuevoClienteCorreo: '',
    nuevoClienteLogo: ''
  });

  const fetchDatos = async () => {
    const { data: proyData } = await supabase
      .from('proyectos')
      .select('*')
      .order('fecha_entrega', { ascending: true });

    const { data: clientData } = await supabase
      .from('clientes')
      .select('nombre')
      .order('nombre', { ascending: true });

    if (proyData) {
      const formateados = proyData.map(p => ({
        id: p.id,
        nombre: p.titulo,
        cliente: p.cliente,
        tipo: p.categoria,
        entrega: p.fecha_entrega,
        prioridad: p.prioridad || 'Normal'
      }));
      setProyectosDB(formateados);

      setConteos({
        fotos: proyData.filter(p => p.categoria === 'Fotografía').length,
        videos: proyData.filter(p => p.categoria === 'Video').length,
        youtube: 0, 
        posts: proyData.filter(p => p.categoria === 'Posts').length,
      });
    }

    if (clientData) {
      setListaClientesDB(clientData);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, []);

  const getPrioridadColor = (prio: string) => {
    switch (prio) {
      case 'Alta': return 'border-red-500/50 text-red-400 bg-red-500/10';
      case 'Cliente Nuevo': return 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10';
      default: return 'border-gray-700 text-gray-500 bg-gray-800/30';
    }
  };

  const handleSave = async () => {
    setLoading(true);
    let nombreClienteFinal = formData.prioridad === 'Cliente Nuevo' ? formData.nuevoClienteNombre : formData.cliente;

    if (formData.prioridad === 'Cliente Nuevo') {
      await supabase.from('clientes').insert([
        { 
          nombre: formData.nuevoClienteNombre, 
          marca: formData.nuevoClienteNombre,
          contacto: formData.nuevoClienteContacto,
          correo: formData.nuevoClienteCorreo,
          logo_url: formData.nuevoClienteLogo
        }
      ]);
    }

    const { error } = await supabase.from('proyectos').insert([
      { 
        titulo: formData.titulo,
        cliente: nombreClienteFinal,
        categoria: categoria,
        descripcion: formData.descripcion,
        fecha_inicio: formData.fecha_inicio || null,
        fecha_entrega: formData.fecha_entrega || null,
        fecha_tomas: formData.fecha_tomas || null,
        ubicacion: formData.ubicacion,
        prioridad: formData.prioridad,
        estado: 'Cotización'
      }
    ]);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('¡Proyecto guardado con éxito!');
      setIsModalOpen(false);
      setFormData({
        titulo: '', cliente: '', descripcion: '', fecha_inicio: '', fecha_entrega: '', fecha_tomas: '', ubicacion: '', prioridad: 'Normal',
        nuevoClienteNombre: '', nuevoClienteContacto: '', nuevoClienteCorreo: '', nuevoClienteLogo: ''
      });
      await fetchDatos(); 
    }
    setLoading(false);
  };

  const proyectosOrdenados = [...proyectosDB].sort((a, b) => {
    if (!a.entrega) return 1;
    if (!b.entrega) return -1;
    return new Date(a.entrega).getTime() - new Date(b.entrega).getTime();
  });

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 relative">
      
      {/* HEADER RESPONSIVO: Se apila en móvil, se expande en PC */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 border-b border-purple-900/30 pb-6 gap-6 md:gap-0">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight italic">PACHE<span className="text-purple-500">360</span></h1>
          <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-bold">Panel de Control Creativo</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <Link 
            href="/clients" 
            className="flex items-center justify-center gap-2 bg-cyan-900/20 hover:bg-cyan-900/40 text-cyan-400 border border-cyan-500/30 px-6 py-3 rounded-xl font-bold transition-all active:scale-95 text-sm italic uppercase tracking-tight w-full sm:w-auto"
          >
            <UserGroupIcon className="h-5 w-5" /> Clientes
          </Link>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 active:scale-95 text-sm w-full sm:w-auto"
          >
            <PlusIcon className="h-5 w-5" /> NUEVO PROYECTO
          </button>
        </div>
      </header>

      {/* SECCIONES PRINCIPALES: 2 columnas en móvil, 4 en PC */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
        <Link href="/fotos" className="group bg-[#111] border border-purple-500/10 p-4 md:p-6 rounded-3xl hover:border-purple-500/60 transition-all shadow-xl">
          <CameraIcon className="h-6 w-6 md:h-8 md:w-8 text-purple-400 mb-2 md:mb-4" />
          <h3 className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Fotografía</h3>
          <p className="text-2xl md:text-4xl font-black mt-1 md:mt-2 group-hover:text-purple-300">{conteos.fotos}</p>
        </Link>
        <Link href="/videos" className="group bg-[#111] border border-purple-500/10 p-4 md:p-6 rounded-3xl hover:border-purple-500/60 transition-all shadow-xl">
          <VideoCameraIcon className="h-6 w-6 md:h-8 md:w-8 text-purple-400 mb-2 md:mb-4" />
          <h3 className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Video</h3>
          <p className="text-2xl md:text-4xl font-black mt-1 md:mt-2 group-hover:text-purple-300">{conteos.videos}</p>
        </Link>
        <Link href="/youtube" className="group bg-[#111] border border-purple-500/10 p-4 md:p-6 rounded-3xl hover:border-purple-500/60 transition-all shadow-xl">
          <PlayIcon className="h-6 w-6 md:h-8 md:w-8 text-purple-400 mb-2 md:mb-4" />
          <h3 className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">YouTube</h3>
          <p className="text-2xl md:text-4xl font-black mt-1 md:mt-2 group-hover:text-red-400">Canales</p>
        </Link>
        <Link href="/posts" className="group bg-[#111] border border-purple-500/10 p-4 md:p-6 rounded-3xl hover:border-purple-500/60 transition-all shadow-xl">
          <ChatBubbleLeftRightIcon className="h-6 w-6 md:h-8 md:w-8 text-purple-400 mb-2 md:mb-4" />
          <h3 className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Posts</h3>
          <p className="text-2xl md:text-4xl font-black mt-1 md:mt-2 group-hover:text-purple-300">{conteos.posts}</p>
        </Link>
      </section>
      
      {/* PRÓXIMAS ENTREGAS: Ajuste de padding para pantallas chicas */}
      <div className="bg-[#111] border border-gray-800 rounded-3xl p-4 md:p-8 shadow-2xl">
        <div className="flex items-center gap-2 mb-6 italic">
          <CalendarIcon className="h-6 w-6 text-purple-500" />
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-tighter">Próximas Entregas</h2>
        </div>
        <div className="space-y-4">
          {proyectosOrdenados.length > 0 ? proyectosOrdenados.map((proy) => (
            <Link href={`/proyecto/${proy.id}`} key={proy.id} className="block group">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-5 bg-[#1a1a1a] rounded-xl border-l-4 hover:bg-[#222] transition-all border border-gray-800 gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-white text-base md:text-lg group-hover:text-purple-300 transition-colors uppercase italic">{proy.nombre}</h4>
                    <span className={`text-[8px] px-2 py-0.5 rounded-full border font-black uppercase ${getPrioridadColor(proy.prioridad)}`}>{proy.prioridad}</span>
                  </div>
                  <p className="text-[10px] md:text-xs text-gray-500 font-medium uppercase">CLIENTE: {proy.cliente}</p>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-gray-800 pt-2 sm:pt-0">
                  <span className="block text-[10px] font-black text-purple-400 mb-1 uppercase tracking-widest">{proy.tipo}</span>
                  <span className="text-[10px] md:text-xs font-mono text-gray-400 bg-gray-800/50 px-2 py-1 rounded-md border border-gray-700">{proy.entrega ? `VENCE: ${proy.entrega}` : 'SIN FECHA'}</span>
                </div>
              </div>
            </Link>
          )) : <div className="text-center py-10 text-gray-600 italic">No hay proyectos pendientes.</div>}
        </div>
      </div>

      {/* MODAL NUEVO PROYECTO: Optimizado para scroll en móvil */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-[#111] border border-purple-500/30 w-full max-w-2xl rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#161616]">
              <h2 className="text-lg md:text-xl font-bold text-purple-400 uppercase italic">Nuevo Proyecto</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white p-2">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 overflow-y-auto">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Título del Proyecto</label>
                <input 
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  type="text" placeholder="Ej: Sesión Gastronómica Mayo" className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 focus:border-purple-500 outline-none transition-all text-sm" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cliente</label>
                <select 
                  value={formData.cliente}
                  onChange={(e) => setFormData({...formData, cliente: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 focus:border-purple-500 outline-none text-sm"
                  disabled={formData.prioridad === 'Cliente Nuevo'}
                >
                  <option value="">Seleccionar...</option>
                  {listaClientesDB.map((c, i) => <option key={i} value={c.nombre}>{c.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Categoría</label>
                <select 
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 focus:border-purple-500 outline-none text-sm"
                >
                  <option value="Fotografía">Fotografía</option>
                  <option value="Video">Video</option>
                  <option value="Posts">Posts</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Prioridad</label>
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  {['Alta', 'Normal', 'Cliente Nuevo'].map((prio) => (
                    <button
                      key={prio}
                      type="button"
                      onClick={() => setFormData({...formData, prioridad: prio})}
                      className={`py-2 px-1 md:px-4 rounded-xl border text-[8px] md:text-[10px] font-black uppercase transition-all ${formData.prioridad === prio ? 'border-purple-500 bg-purple-500/20 text-white' : 'border-gray-800 text-gray-500 hover:border-gray-700'}`}
                    >
                      {prio}
                    </button>
                  ))}
                </div>
              </div>

              {formData.prioridad === 'Cliente Nuevo' && (
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 bg-cyan-950/20 p-4 md:p-6 rounded-2xl border border-cyan-500/30">
                  <div className="md:col-span-2"><h3 className="text-cyan-400 text-xs font-black uppercase tracking-widest">Nueva Marca</h3></div>
                  <input type="text" value={formData.nuevoClienteNombre} onChange={(e) => setFormData({...formData, nuevoClienteNombre: e.target.value})} placeholder="Marca" className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 outline-none text-sm" />
                  <input type="text" value={formData.nuevoClienteContacto} onChange={(e) => setFormData({...formData, nuevoClienteContacto: e.target.value})} placeholder="WhatsApp" className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 outline-none text-sm" />
                  <input type="email" value={formData.nuevoClienteCorreo} onChange={(e) => setFormData({...formData, nuevoClienteCorreo: e.target.value})} placeholder="Email" className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 outline-none text-sm" />
                  <input type="text" value={formData.nuevoClienteLogo} onChange={(e) => setFormData({...formData, nuevoClienteLogo: e.target.value})} placeholder="URL Logo" className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 outline-none text-sm" />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Descripción</label>
                <textarea 
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  rows={2} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 focus:border-purple-500 outline-none text-sm" placeholder="Brief..."
                ></textarea>
              </div>

              <div className="md:col-span-2 bg-[#0a0a0a] p-4 rounded-2xl border border-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fecha Entrega</label>
                    <input 
                      type="date" 
                      value={formData.fecha_entrega} 
                      onChange={(e) => setFormData({...formData, fecha_entrega: e.target.value})} 
                      className="w-full bg-[#111] border border-gray-800 rounded-lg p-2 outline-none text-sm text-white" 
                    />
                  </div>
                  {(categoria !== 'Posts') && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fecha Tomas</label>
                      <input 
                        type="date" 
                        value={formData.fecha_tomas} 
                        onChange={(e) => setFormData({...formData, fecha_tomas: e.target.value})} 
                        className="w-full bg-[#111] border border-gray-800 rounded-lg p-2 outline-none text-sm text-white" 
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 pt-4 pb-8 md:pb-0">
                <button type="button" onClick={handleSave} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest disabled:opacity-50 text-sm">
                  {loading ? 'Guardando...' : 'Crear Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}