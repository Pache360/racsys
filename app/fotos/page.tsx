'use client';
import { useState, useEffect } from 'react'; // Agregamos useEffect
import Link from 'next/link';
import { supabase } from '@/lib/supabase'; // Importamos la conexión
import { 
  ArrowLeftIcon, 
  CameraIcon, 
  PencilIcon, 
  TrashIcon,
  FunnelIcon // Importamos icono para el filtro
} from '@heroicons/react/24/outline';

export default function FotosPage() {
  // --- ESTADO PARA DATOS REALES ---
  const [proyectosFoto, setProyectosFoto] = useState<any[]>([]);
  const [filtroMarca, setFiltroMarca] = useState(''); // Estado para el filtro

  // --- LISTA DE ESTADOS PARA EL SELECTOR ---
  const listaEstados = ['Cotización', 'Autorización', 'Planeación', 'Agendado', 'Fotos crudas', 'RAW Revelado', 'Entregado'];

  // --- FUNCIÓN PARA LEER DE LA BASE DE DATOS ---
  const fetchFotos = async () => {
    // 1. Traemos los proyectos normales
    const { data: proyectos, error: errorP } = await supabase
      .from('proyectos')
      .select('*')
      .eq('categoria', 'Fotografía')
      .order('created_at', { ascending: false });

    // 2. Traemos los logos de los clientes por separado para no romper la consulta si no hay relación
    const { data: clientes } = await supabase.from('clientes').select('nombre, logo_url');

    if (proyectos) {
      const formateados = proyectos.map(p => {
        // Buscamos si el cliente de este proyecto tiene un logo registrado
        const clienteInfo = clientes?.find(c => c.nombre === p.cliente);
        
        return {
          id: p.id,
          titulo: p.titulo,
          cliente: p.cliente,
          // Si el cliente tiene logo lo usamos, si no, la imagen de cámara default
          imagen: clienteInfo?.logo_url || "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1000", 
          estado: p.estado || "Cotización",
          prioridad: p.prioridad || "Normal"
        };
      });
      setProyectosFoto(formateados);
    }
  };

  useEffect(() => {
    fetchFotos();
  }, []);

  // --- FUNCIÓN PARA ACTUALIZAR ESTATUS (NUEVA) ---
  const updateEstado = async (id: string, nuevoEstado: string) => {
    const { error } = await supabase
      .from('proyectos')
      .update({ estado: nuevoEstado })
      .eq('id', id);
    
    if (!error) {
      // Actualizamos localmente para que sea instantáneo
      setProyectosFoto(prev => prev.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p));
    } else {
      alert('Error al actualizar: ' + error.message);
    }
  };

  // --- FUNCIÓN PARA ELIMINAR ---
  const deleteFoto = async (id: string) => {
    if (confirm('¿Deseas eliminar este proyecto de fotografía?')) {
      const { error } = await supabase.from('proyectos').delete().eq('id', id);
      if (!error) fetchFotos();
    }
  };

  // Definición de colores por estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Cotización': return 'text-gray-400 border-gray-400';
      case 'Autorización': return 'text-blue-400 border-blue-400';
      case 'Planeación': return 'text-yellow-400 border-yellow-400';
      case 'Agendado': return 'text-purple-400 border-purple-400';
      case 'Fotos crudas': return 'text-orange-400 border-orange-400';
      case 'RAW Revelado': return 'text-cyan-400 border-cyan-400';
      case 'Entregado': return 'text-green-400 border-green-400';
      default: return 'text-white border-white';
    }
  };

  // Lógica de colores para la etiqueta de prioridad
  const getPrioridadEstilo = (prio: string) => {
    switch (prio) {
      case 'Alta': return 'border-red-500 text-red-400 bg-red-500/20';
      case 'Cliente Nuevo': return 'border-cyan-500 text-cyan-400 bg-cyan-500/20';
      default: return 'border-white/10 text-white bg-black/60';
    }
  };

  // Filtrar proyectos por marca
  const proyectosFiltrados = proyectosFoto.filter(p => 
    p.cliente.toLowerCase().includes(filtroMarca.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-8">
      {/* Navegación */}
      <div className="mb-8 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-all w-fit">
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Volver al Dashboard</span>
        </Link>

        {/* FILTRO POR MARCA (NUEVO) */}
        <div className="relative group">
          <FunnelIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
          <input 
            type="text"
            placeholder="Filtrar por marca..."
            value={filtroMarca}
            onChange={(e) => setFiltroMarca(e.target.value)}
            className="bg-[#111] border border-gray-800 rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:border-purple-500 transition-all w-64"
          />
        </div>
      </div>

      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="bg-purple-600 p-3 rounded-2xl">
            <CameraIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold italic uppercase tracking-tighter">Proyectos Fotografía</h1>
            <p className="text-gray-500 text-xs tracking-[0.2em] font-black">PACHE360 AGENCIA</p>
          </div>
        </div>
      </header>

      {/* Grid de Proyectos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {proyectosFiltrados.map((proy) => (
          <div key={proy.id} className="bg-[#111] rounded-3xl overflow-hidden border border-gray-800 hover:border-purple-500/50 transition-all group relative shadow-2xl">
            
            {/* MENÚ DE ACCIONES */}
            <div className="absolute top-4 left-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link href={`/proyecto/${proy.id}`} className="bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 hover:text-purple-400 transition-colors">
                <PencilIcon className="h-4 w-4" />
              </Link>
              <button onClick={() => deleteFoto(proy.id)} className="bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 hover:text-red-500 transition-colors">
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Imagen Alusiva: Centrada con fondo estético para logos */}
            <div className="h-48 overflow-hidden relative bg-[#0d0d0d] flex items-center justify-center p-8">
              <img 
                src={proy.imagen} 
                alt={proy.titulo} 
                className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500 z-10"
              />
              {/* Fondo decorativo con blur del mismo logo */}
              <img 
                src={proy.imagen} 
                className="absolute inset-0 w-full h-full object-cover opacity-10 blur-xl scale-150"
              />
              <div className={`absolute top-4 right-4 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors z-20 ${getPrioridadEstilo(proy.prioridad)}`}>
                {proy.prioridad}
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6">
              <h3 className="text-xl font-bold mb-1 text-purple-100 group-hover:text-purple-400 transition-colors uppercase italic">{proy.titulo}</h3>
              <p className="text-gray-500 text-sm mb-6 italic">Cliente: {proy.cliente}</p>
              
              <div className="flex flex-col gap-3">
                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Estado Actual</span>
                
                {/* SELECTOR DE ESTADO DINÁMICO */}
                <select 
                  value={proy.estado}
                  onChange={(e) => updateEstado(proy.id, e.target.value)}
                  className={`w-full text-center py-2 px-4 rounded-xl border font-bold text-xs uppercase tracking-widest ${getEstadoColor(proy.estado)} bg-transparent cursor-pointer outline-none appearance-none hover:bg-white/5 transition-colors`}
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
        <div className="text-center py-20 text-gray-600 italic">
          No se encontraron proyectos para esa marca.
        </div>
      )}
    </main>
  );
}