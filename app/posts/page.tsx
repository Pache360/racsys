'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeftIcon, 
  ChatBubbleLeftRightIcon, 
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  XMarkIcon,
  PhotoIcon,
  PlusIcon,
  ChevronLeftIcon, // Nuevo icono
  ChevronRightIcon // Nuevo icono
} from '@heroicons/react/24/outline';

export default function PostsPage() {
  const diasNombres = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const estados = ['Parrilla', 'Diseño', 'Cambios', 'Programado', 'Publicado'];

  const [posts, setPosts] = useState<any[]>([]);
  const [filtroMarca, setFiltroMarca] = useState('');
  const [listaClientes, setListaClientes] = useState<any[]>([]);
  
  // NUEVO: Estado para controlar la fecha base de la semana
  const [fechaBase, setFechaBase] = useState(new Date());
  const [diasSemanaActual, setDiasSemanaActual] = useState<{ nombre: string, fechaFull: string, soloDia: number }[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState<{ nombre: string, fechaFull: string, soloDia: number } | null>(null);
  const [nuevoPost, setNuevoPost] = useState({ titulo: '', cliente: '', url_diseno: '' });

  const generarSemana = () => {
    // Calculamos el domingo de la semana correspondiente a fechaBase
    const domingo = new Date(fechaBase);
    domingo.setDate(fechaBase.getDate() - fechaBase.getDay());

    const semana = diasNombres.map((nombre, index) => {
      const fecha = new Date(domingo);
      fecha.setDate(domingo.getDate() + index);
      return {
        nombre,
        fechaFull: fecha.toISOString().split('T')[0],
        soloDia: fecha.getDate()
      };
    });
    setDiasSemanaActual(semana);
  };

  // NUEVO: Funciones para navegar
  const semanaSiguiente = () => {
    const nuevaFecha = new Date(fechaBase);
    nuevaFecha.setDate(fechaBase.getDate() + 7);
    setFechaBase(nuevaFecha);
  };

  const semanaAnterior = () => {
    const nuevaFecha = new Date(fechaBase);
    nuevaFecha.setDate(fechaBase.getDate() - 7);
    setFechaBase(nuevaFecha);
  };

  const fetchPosts = async () => {
    const { data } = await supabase.from('proyectos').select('*').eq('categoria', 'Posts');
    const { data: clientes } = await supabase.from('clientes').select('nombre');
    
    if (clientes) setListaClientes(clientes);
    if (data) {
      const formateados = data.map(p => ({
        id: p.id,
        titulo: p.titulo,
        cliente: p.cliente,
        fecha_entrega: p.fecha_entrega,
        estado: p.estado || 'Parrilla',
        prioridad: p.prioridad || 'Normal',
        imagen: p.logo_url 
      }));
      setPosts(formateados);
    }
  };

  useEffect(() => { 
    generarSemana();
    fetchPosts(); 
  }, [fechaBase]); // Escucha cambios en fechaBase

  const handlePostRapido = async () => {
    if (!nuevoPost.cliente || !nuevoPost.titulo || !diaSeleccionado) return alert("Selecciona marca, título y fecha");
    
    const { error } = await supabase.from('proyectos').insert([{
      titulo: nuevoPost.titulo,
      cliente: nuevoPost.cliente,
      categoria: 'Posts',
      estado: 'Parrilla',
      fecha_entrega: diaSeleccionado.fechaFull,
      logo_url: nuevoPost.url_diseno,
      prioridad: 'Normal'
    }]);

    if (!error) {
      setIsModalOpen(false);
      setNuevoPost({ titulo: '', cliente: '', url_diseno: '' });
      await fetchPosts();
    } else {
      alert("Error: " + error.message);
    }
  };

  const deletePost = async (id: string) => {
    if (confirm('¿Eliminar post?')) {
      await supabase.from('proyectos').delete().eq('id', id);
      fetchPosts();
    }
  };

  const updateEstado = async (id: string, nuevoEstado: string) => {
    await supabase.from('proyectos').update({ estado: nuevoEstado }).eq('id', id);
    fetchPosts();
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Parrilla': return 'bg-gray-800 text-gray-400 border-gray-700';
      case 'Diseño': return 'bg-blue-900/20 text-blue-400 border-blue-500/30';
      case 'Cambios': return 'bg-red-900/20 text-red-400 border-red-500/30';
      case 'Programado': return 'bg-purple-900/20 text-purple-400 border-purple-500/30';
      case 'Publicado': return 'bg-green-900/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-800';
    }
  };

  const postsFiltrados = posts.filter(p => p.cliente.toLowerCase().includes(filtroMarca.toLowerCase()));

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4">
      {/* NAVEGACIÓN Y FILTRO */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-all text-[10px] font-bold uppercase tracking-widest">
          <ArrowLeftIcon className="h-3 w-3" /> Volver al Dashboard
        </Link>
        <div className="relative w-full sm:w-auto">
          <FunnelIcon className="h-3 w-3 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input 
            type="text" 
            placeholder="FILTRAR POR MARCA..." 
            value={filtroMarca} 
            onChange={(e) => setFiltroMarca(e.target.value)} 
            className="bg-[#111] border border-gray-800 rounded-xl py-2 pl-9 pr-3 text-[10px] outline-none w-full sm:w-48 font-bold uppercase focus:border-purple-500 transition-all" 
          />
        </div>
      </div>

      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-purple-600 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-lg shadow-purple-600/20">
            <ChatBubbleLeftRightIcon className="h-6 w-6 md:h-7 md:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold italic uppercase tracking-tighter leading-none">Calendario Semanal</h1>
            <p className="text-gray-500 text-[8px] md:text-[10px] tracking-[0.2em] font-black uppercase mt-1">Planificación / PACHE360 STUDIO</p>
          </div>
        </div>

        {/* NUEVOS BOTONES DE NAVEGACIÓN */}
        <div className="flex items-center gap-2 bg-[#111] border border-gray-800 p-1.5 rounded-2xl w-fit">
          <button 
            onClick={semanaAnterior}
            className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-purple-400"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <span className="text-[9px] font-black uppercase tracking-widest px-2 text-gray-400">
            Navegar Semanas
          </span>
          <button 
            onClick={semanaSiguiente}
            className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-purple-400"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* CALENDARIO */}
      <div className="flex overflow-x-auto pb-6 gap-3 md:grid md:grid-cols-7 md:gap-2 w-full snap-x scrollbar-hide">
        {diasSemanaActual.map((dia) => (
          <div key={dia.fechaFull} className="bg-[#111]/40 border border-gray-800/40 rounded-2xl p-3 flex flex-col gap-3 min-w-65 md:min-w-0 snap-center">
            <div className="text-center border-b border-gray-800/50 pb-2">
                <h3 className="font-black text-gray-600 uppercase tracking-widest text-[9px]">{dia.nombre}</h3>
                <span className="text-[16px] font-mono text-purple-500 font-bold">{dia.soloDia}</span>
            </div>
            
            <div className="flex flex-col gap-3 min-h-[60vh] md:min-h-[70vh]">
              {postsFiltrados.filter(p => p.fecha_entrega === dia.fechaFull).map((post) => (
                <div key={post.id} className="bg-[#161616] border border-gray-800 rounded-xl hover:border-purple-500/50 transition-all relative group overflow-hidden shadow-lg">
                  {post.imagen && (
                    <div className="h-28 w-full overflow-hidden border-b border-gray-800">
                      <img src={post.imagen} alt="diseño" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                  
                  <div className="p-3">
                    <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                      <Link href={`/proyecto/${post.id}`} className="p-1.5 bg-black/60 rounded-lg hover:text-purple-400 text-gray-400">
                        <PencilIcon className="h-3 w-3" />
                      </Link>
                      <button onClick={() => deletePost(post.id)} className="p-1.5 bg-black/60 rounded-lg hover:text-red-500 text-gray-400">
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </div>

                    <h4 className="text-[10px] font-bold text-purple-100 mb-1 leading-tight uppercase italic pr-8">{post.titulo}</h4>
                    <p className="text-[8px] text-gray-500 font-bold uppercase mb-3">{post.cliente}</p>
                    
                    <select 
                      value={post.estado} 
                      className={`w-full text-[8px] font-black py-2 rounded-lg border border-opacity-20 outline-none appearance-none text-center cursor-pointer ${getEstadoColor(post.estado)}`} 
                      onChange={(e) => updateEstado(post.id, e.target.value)}
                    >
                      {estados.map(est => <option key={est} value={est} className="bg-[#0a0a0a]">{est}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => { setDiaSeleccionado(dia); setIsModalOpen(true); }} 
                className="mt-auto py-3 border border-dashed border-gray-800/50 rounded-xl text-gray-700 hover:text-purple-400 hover:border-purple-400/30 transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <PlusIcon className="h-3 w-3" /> Nuevo Post
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CREAR POST */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-[#111] border border-purple-500/30 w-full max-w-md rounded-t-4xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#161616]">
              <h2 className="text-xs md:text-sm font-bold text-purple-400 uppercase italic">
                {diaSeleccionado?.nombre} {diaSeleccionado?.soloDia} • Crear Post
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2"><XMarkIcon className="h-6 w-6 text-gray-500" /></button>
            </div>
            <div className="p-6 md:p-8 space-y-5 pb-10 md:pb-8">
              <div>
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Marca del Cliente</label>
                <select value={nuevoPost.cliente} onChange={e => setNuevoPost({...nuevoPost, cliente: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 text-xs outline-none focus:border-purple-500 font-bold uppercase text-white">
                  <option value="">Selecciona Marca...</option>
                  {listaClientes.map(c => <option key={c.nombre} value={c.nombre}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Título del Post</label>
                <input type="text" value={nuevoPost.titulo} onChange={e => setNuevoPost({...nuevoPost, titulo: e.target.value})} placeholder="Ej: Reel Detrás de Cámaras" className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 text-xs outline-none focus:border-purple-500 font-bold text-white" />
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 block">URL de la Imagen (Opcional)</label>
                <input type="text" value={nuevoPost.url_diseno} onChange={e => setNuevoPost({...nuevoPost, url_diseno: e.target.value})} placeholder="https://..." className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 text-xs outline-none focus:border-purple-500 font-mono text-white" />
              </div>
              <button onClick={handlePostRapido} className="w-full bg-purple-600 hover:bg-purple-500 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-lg shadow-purple-600/20 active:scale-95 text-white">
                Confirmar Parrilla
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}