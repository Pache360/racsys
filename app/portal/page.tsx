'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CalendarIcon, 
  ArrowRightOnRectangleIcon,
  RectangleGroupIcon,
  Squares2X2Icon,
  XMarkIcon,
  CheckCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon // Importado para el historial
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function PortalCliente() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [misMarcas, setMisMarcas] = useState<string[]>([]);
  const [filtroMarca, setFiltroMarca] = useState('Todas');
  const [vista, setVista] = useState<'Cuadrícula' | 'Calendario'>('Cuadrícula');
  const [duenoNombre, setDuenoNombre] = useState('');
  const [loading, setLoading] = useState(true);
  
  // NUEVO: Estado para alternar entre proyectos activos e historial
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<any>(null);
  const [mostrarCambios, setMostrarCambios] = useState(false);
  const [textoCambios, setTextoCambios] = useState('');
  const [zoomImagen, setZoomImagen] = useState(false);

  const router = useRouter();

  const fetchContenidoVIP = async () => {
    const cookies = document.cookie.split('; ');
    const clienteIdCookie = cookies.find(row => row.startsWith('pache_cliente_id='));
    const idSesion = clienteIdCookie ? decodeURIComponent(clienteIdCookie.split('=')[1]) : null;

    if (!idSesion) {
      router.push('/login');
      return;
    }

    setDuenoNombre(idSesion);
    setLoading(true);

    try {
      const { data: clienteDB } = await supabase
        .from('clientes')
        .select('*')
        .eq('nombre', idSesion)
        .single();

      const { data: marcasAsociadas } = await supabase
        .from('clientes')
        .select('nombre')
        .or(`dueno_id.eq."${idSesion}",dueno_id.eq."${clienteDB?.acceso_pass || 'N/A'}",nombre.eq."${idSesion}"`);

      const listaNombres = marcasAsociadas ? marcasAsociadas.map(m => m.nombre) : [idSesion];
      const soloMarcas = listaNombres.filter(n => n.toLowerCase() !== idSesion.toLowerCase());
      setMisMarcas(soloMarcas);

      const { data: todosLosProyectos } = await supabase.from('proyectos').select('*');

      if (todosLosProyectos) {
        const filtrados = todosLosProyectos.filter(proy => {
          const pCliente = proy.cliente?.toLowerCase() || "";
          return listaNombres.some(n => 
            pCliente.includes(n.toLowerCase()) || n.toLowerCase().includes(pCliente)
          );
        });
        setEventos(filtrados);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContenidoVIP();
  }, [router]);

  const handleLogout = () => {
    document.cookie = "pache_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict";
    document.cookie = "pache_cliente_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict";
    router.push('/login');
  };

  const handleAutorizar = async (id: string) => {
    const { error } = await supabase.from('proyectos').update({ estado: 'Autorizado' }).eq('id', id);
    if (!error) {
      setProyectoSeleccionado(null);
      fetchContenidoVIP();
      alert("¡Proyecto Autorizado! Pache 360 procederá con la entrega/publicación.");
    }
  };

  const handleEnviarCambios = async (id: string) => {
    if (!textoCambios.trim()) return;
    
    const { error } = await supabase.from('proyectos').update({ 
      estado: 'Cambios',
      notas_cliente: textoCambios 
    }).eq('id', id);
    
    if (!error) {
      setProyectoSeleccionado(null);
      setTextoCambios('');
      setMostrarCambios(false);
      fetchContenidoVIP();
      alert("Solicitud enviada. El equipo de Pache 360 revisará tus ajustes.");
    } else {
      alert("Error al enviar cambios: " + error.message);
    }
  };

  // ACTUALIZADO: Lógica de filtrado para ocultar autorizados por defecto y filtrar por marca
  const eventosAMostrar = eventos.filter(e => {
    const cumpleMarca = filtroMarca === 'Todas' || e.cliente === filtroMarca;
    const esFinalizado = ['Autorizado', 'Publicado', 'Finalizado', 'Entregado'].includes(e.estado);
    
    // Si mostrarHistorial es true, solo vemos los finalizados. Si es false, solo los activos.
    return cumpleMarca && (mostrarHistorial ? esFinalizado : !esFinalizado);
  });

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-white/5 pb-6 gap-6">
        <div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">PORTAL <span className="text-purple-500">PACHE360</span></h1>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 italic">Bienvenido, {duenoNombre}</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* GRUPO DE BOTONES DE VISTA Y FILTRO DE HISTORIAL */}
          <div className="flex bg-[#111] p-1 rounded-xl border border-gray-800">
            <button 
              onClick={() => setVista('Cuadrícula')} 
              className={`p-2 rounded-lg transition-all ${vista === 'Cuadrícula' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}
              title="Vista Cuadrícula"
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setVista('Calendario')} 
              className={`p-2 rounded-lg transition-all ${vista === 'Calendario' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}
              title="Vista Calendario"
            >
              <CalendarIcon className="h-5 w-5" />
            </button>
            
            {/* NUEVO BOTÓN: Posts Anteriores / Historial */}
            <div className="w-[1px] bg-gray-800 mx-1 my-1"></div>
            <button 
              onClick={() => setMostrarHistorial(!mostrarHistorial)} 
              className={`p-2 rounded-lg transition-all flex items-center gap-2 ${mostrarHistorial ? 'bg-orange-600 text-white' : 'text-gray-500 hover:text-orange-400'}`}
              title={mostrarHistorial ? "Ver Proyectos Activos" : "Ver Historial de Autorizados"}
            >
              <ClockIcon className="h-5 w-5" />
              <span className="hidden md:block text-[9px] font-black uppercase tracking-widest">
                {mostrarHistorial ? "Activos" : "Anteriores"}
              </span>
            </button>
          </div>
          
          <button onClick={handleLogout} className="bg-red-900/20 text-red-400 p-2.5 rounded-xl border border-red-500/20 hover:bg-red-900/40 transition-all active:scale-95 ml-auto"><ArrowRightOnRectangleIcon className="h-5 w-5" /></button>
        </div>
      </header>

      {/* TÍTULO DINÁMICO DE SECCIÓN */}
      <div className="mb-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${mostrarHistorial ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
          {mostrarHistorial ? "Historial de Proyectos Autorizados" : "Proyectos Pendientes de Revisión"}
        </h2>
      </div>

      {misMarcas.length > 1 && (
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 snap-x">
          <button onClick={() => setFiltroMarca('Todas')} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all snap-start border ${filtroMarca === 'Todas' ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-gray-800'}`}>Todas</button>
          {misMarcas.map(m => (
            <button key={m} onClick={() => setFiltroMarca(m)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all snap-start border whitespace-nowrap ${filtroMarca === m ? 'bg-purple-600 text-white border-purple-500' : 'bg-transparent text-gray-500 border-gray-800'}`}>{m}</button>
          ))}
        </div>
      )}

      {/* CONTENIDO (se mantiene igual, usando eventosAMostrar filtrado) */}
      {eventosAMostrar.length === 0 ? (
        <NoContent />
      ) : vista === 'Cuadrícula' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventosAMostrar.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setProyectoSeleccionado(item)}
              className="bg-[#111] border border-gray-800 rounded-3xl shadow-xl relative overflow-hidden group hover:border-purple-500/40 transition-all cursor-pointer flex flex-col"
            >
              <div className="h-48 w-full overflow-hidden bg-black border-b border-gray-800">
                <img 
                  src={item.logo_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000"} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-70 group-hover:opacity-100"
                  alt={item.titulo}
                />
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    item.categoria === 'Fotografía' ? 'border-purple-500 text-purple-400 bg-purple-500/10' :
                    item.categoria === 'Video' ? 'border-orange-500 text-orange-400 bg-orange-500/10' :
                    'border-blue-500 text-blue-400 bg-blue-500/10'
                  }`}>{item.categoria}</span>
                  <div className="flex items-center gap-1 text-gray-500 font-mono text-[10px]"><CalendarIcon className="h-3 w-3" /> {item.fecha_entrega || "PROX."}</div>
                </div>
                <h3 className="text-xl font-bold uppercase italic mb-1 text-white">{item.titulo}</h3>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-1"><RectangleGroupIcon className="h-3 w-3 text-purple-500" /> {item.cliente}</p>
                <div className="bg-black border border-gray-800 rounded-2xl p-4 text-center">
                  <span className="text-[8px] font-black uppercase text-gray-600 block mb-1 tracking-[0.2em]">Estatus Actual</span>
                  <span className={`text-xs font-bold uppercase italic ${['Entregado', 'Publicado', 'Autorizado', 'Finalizado'].includes(item.estado) ? 'text-green-400' : 'text-purple-400'}`}>
                    {item.estado}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#111] border border-gray-800 rounded-[2.5rem] p-6 md:p-10 shadow-2xl">
          <div className="space-y-6">
            {eventosAMostrar.sort((a,b) => new Date(a.fecha_entrega).getTime() - new Date(b.fecha_entrega).getTime()).map(item => (
              <div key={item.id} onClick={() => setProyectoSeleccionado(item)} className="flex gap-4 items-center border-b border-gray-800/50 pb-6 last:border-0 cursor-pointer hover:bg-white/5 p-2 rounded-2xl transition-all">
                <div className="text-center min-w-15">
                  <span className="block text-[10px] font-black text-purple-500 uppercase">{new Date(item.fecha_entrega).toLocaleString('es-MX', {month: 'short'})}</span>
                  <span className="block text-2xl font-black text-white">{new Date(item.fecha_entrega).getDate() + 1}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black uppercase italic text-white leading-none">{item.titulo}</h4>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">{item.cliente} • {item.categoria}</span>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase border ${['Entregado', 'Autorizado', 'Finalizado', 'Publicado'].includes(item.estado) ? 'border-green-500 text-green-400' : 'border-purple-500 text-purple-400'}`}>
                  {item.estado}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE (se mantiene igual) */}
      {proyectoSeleccionado && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 md:p-8 backdrop-blur-md">
          <div className="bg-[#0f0f0f] border border-gray-800 w-full max-w-4xl max-h-[90vh] rounded-4xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#141414]">
              <div>
                <h2 className="text-2xl font-black uppercase italic text-white">{proyectoSeleccionado.titulo}</h2>
                <p className="text-purple-500 text-[10px] font-bold uppercase tracking-widest">{proyectoSeleccionado.cliente} • {proyectoSeleccionado.categoria}</p>
              </div>
              <button onClick={() => {setProyectoSeleccionado(null); setMostrarCambios(false);}} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
              <div className="relative group text-center">
                <img 
                  src={proyectoSeleccionado.logo_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000"} 
                  className={`mx-auto w-full ${zoomImagen ? 'h-auto' : 'max-h-100'} object-contain rounded-3xl border border-white/10 shadow-2xl cursor-zoom-in transition-all`}
                  alt="Diseño Pache 360"
                  onClick={() => setZoomImagen(!zoomImagen)}
                />
                {!zoomImagen && <p className="text-center text-gray-600 text-[9px] uppercase font-black mt-2 tracking-widest">Haz clic en la imagen para ampliar</p>}
              </div>

              <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Descripción del Proyecto</h4>
                <p className="text-sm text-gray-300 leading-relaxed font-medium italic">"{proyectoSeleccionado.descripcion || "Sin descripción disponible."}"</p>
              </div>

              {proyectoSeleccionado.notas_cliente && (
                <div className="bg-orange-500/10 p-6 rounded-3xl border border-orange-500/20">
                  <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 italic">Ajustes solicitados actualmente:</h4>
                  <p className="text-sm text-orange-100 font-medium">"{proyectoSeleccionado.notas_cliente}"</p>
                </div>
              )}

              {/* ACCIONES: Solo visibles si no está autorizado aún */}
              {!['Autorizado', 'Publicado', 'Finalizado'].includes(proyectoSeleccionado.estado) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setMostrarCambios(!mostrarCambios)}
                    className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-orange-500/10 hover:border-orange-500/50 transition-all group"
                  >
                    <ChatBubbleLeftEllipsisIcon className="h-6 w-6 text-orange-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Solicitar Cambios</span>
                  </button>

                  <button 
                    onClick={() => handleAutorizar(proyectoSeleccionado.id)}
                    className="flex items-center justify-center gap-3 bg-purple-600 p-5 rounded-2xl hover:bg-purple-500 shadow-lg shadow-purple-600/20 transition-all group"
                  >
                    <CheckCircleIcon className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Autorizar para Publicar</span>
                  </button>
                </div>
              )}

              {mostrarCambios && (
                <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-orange-500/30 animate-in slide-in-from-bottom-4 duration-300">
                  <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-4 block underline">Escribe los cambios detallados:</label>
                  <textarea 
                    value={textoCambios}
                    onChange={(e) => setTextoCambios(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-orange-500 outline-none min-h-30"
                    placeholder="Ej: El logo se ve muy pequeño, por favor cambiar el color del fondo a blanco..."
                  />
                  <button 
                    onClick={() => handleEnviarCambios(proyectoSeleccionado.id)}
                    className="mt-4 w-full bg-orange-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all"
                  >
                    Enviar Solicitud de Cambio
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function NoContent() {
  return (
    <div className="col-span-full text-center py-24 bg-[#111]/30 rounded-[3rem] border border-dashed border-gray-800">
      <p className="text-gray-600 italic uppercase font-black text-sm tracking-widest">No hay contenido en esta sección</p>
    </div>
  );
}