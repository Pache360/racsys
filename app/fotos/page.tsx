'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeftIcon, 
  CameraIcon, 
  PencilIcon, 
  TrashIcon,
  FunnelIcon 
} from '@heroicons/react/24/outline';

export default function FotosPage() {
  const [proyectosFoto, setProyectosFoto] = useState<any[]>([]);
  const [filtroMarca, setFiltroMarca] = useState('');

  const listaEstados = ['Cotización', 'Autorización', 'Planeación', 'Agendado', 'Fotos crudas', 'RAW Revelado', 'Entregado'];

  const fetchFotos = async () => {
    const { data: proyectos, error: errorP } = await supabase
      .from('proyectos')
      .select('*')
      .eq('categoria', 'Fotografía')
      .order('created_at', { ascending: false });

    const { data: clientes } = await supabase.from('clientes').select('nombre, logo_url');

    if (proyectos) {
      const formateados = proyectos.map(p => {
        const clienteInfo = clientes?.find(c => c.nombre === p.cliente);
        
        return {
          id: p.id,
          titulo: p.titulo,
          cliente: p.cliente,
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

  const updateEstado = async (id: string, nuevoEstado: string) => {
    const { error } = await supabase
      .from('proyectos')
      .update({ estado: nuevoEstado })
      .eq('id', id);
    
    if (!error) {
      setProyectosFoto(prev => prev.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p));
    } else {
      alert('Error al actualizar: ' + error.message);
    }
  };

  const deleteFoto = async (id: string) => {
    if (confirm('¿Deseas eliminar este proyecto de fotografía?')) {
      const { error } = await supabase.from('proyectos').delete().eq('id', id);
      if (!error) fetchFotos();
    }
  };

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

  const getPrioridadEstilo = (prio: string) => {
    switch (prio) {
      case 'Alta': return 'border-red-500 text-red-400 bg-red-500/20';
      case 'Cliente Nuevo': return 'border-cyan-500 text-cyan-400 bg-cyan-500/20';
      default: return 'border-white/10 text-white bg-black/60';
    }
  };

  const proyectosFiltrados = proyectosFoto.filter(p => 
    p.cliente.toLowerCase().includes(filtroMarca.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      {/* Navegación y Filtro Responsivo */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-all w-fit text-xs font-bold uppercase tracking-widest">
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
            className="bg-[#111] border border-gray-800 rounded-xl py-3 md:py-2 pl-10 pr-4 text-xs outline-none focus:border-purple-500 transition-all w-full sm:w-64"
          />
        </div>
      </div>

      <header className="flex items-center gap-4 mb-10">
        <div className="bg-purple-600 p-2 md:p-3 rounded-xl md:rounded-2xl">
          <CameraIcon className="h-6 w-6 md:h-8 md:w-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold italic uppercase tracking-tighter">Proyectos Fotografía</h1>
          <p className="text-gray-500 text-[8px] md:text-xs tracking-[0.2em] font-black uppercase">PACHE360 AGENCIA</p>
        </div>
      </header>

      {/* Grid de Proyectos: 1 col móvil, 2 tablet, 3 PC */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {proyectosFiltrados.map((proy) => (
          <div key={proy.id} className="bg-[#111] rounded-3xl overflow-hidden border border-gray-800 hover:border-purple-500/50 transition-all group relative shadow-2xl">
            
            {/* MENÚ DE ACCIONES: Siempre visible en móvil para usabilidad */}
            <div className="absolute top-4 left-4 z-20 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <Link href={`/proyecto/${proy.id}`} className="bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 hover:text-purple-400 transition-colors">
                <PencilIcon className="h-4 w-4" />
              </Link>
              <button onClick={() => deleteFoto(proy.id)} className="bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 hover:text-red-500 transition-colors">
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="h-40 md:h-48 overflow-hidden relative bg-[#0d0d0d] flex items-center justify-center p-6 md:p-8">
              <img 
                src={proy.imagen} 
                alt={proy.titulo} 
                className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500 z-10"
              />
              <img 
                src={proy.imagen} 
                className="absolute inset-0 w-full h-full object-cover opacity-10 blur-xl scale-150"
                alt="background-blur"
              />
              <div className={`absolute top-4 right-4 backdrop-blur-md px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border transition-colors z-20 ${getPrioridadEstilo(proy.prioridad)}`}>
                {proy.prioridad}
              </div>
            </div>

            <div className="p-5 md:p-6">
              <h3 className="text-lg md:text-xl font-bold mb-1 text-purple-100 group-hover:text-purple-400 transition-colors uppercase italic truncate">{proy.titulo}</h3>
              <p className="text-gray-500 text-xs md:text-sm mb-6 italic">Cliente: {proy.cliente}</p>
              
              <div className="flex flex-col gap-3">
                <span className="text-[9px] md:text-[10px] uppercase text-gray-500 font-bold tracking-widest">Estado Actual</span>
                
                <select 
                  value={proy.estado}
                  onChange={(e) => updateEstado(proy.id, e.target.value)}
                  className={`w-full text-center py-3 md:py-2 px-4 rounded-xl border font-bold text-[10px] md:text-xs uppercase tracking-widest ${getEstadoColor(proy.estado)} bg-transparent cursor-pointer outline-none appearance-none hover:bg-white/5 transition-colors`}
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
        <div className="text-center py-20 text-gray-600 italic text-sm">
          No se encontraron proyectos para esa marca.
        </div>
      )}
    </main>
  );
}