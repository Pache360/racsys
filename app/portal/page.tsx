'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CalendarIcon, 
  ArrowRightOnRectangleIcon,
  RectangleGroupIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function PortalCliente() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [duenoNombre, setDuenoNombre] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const cookies = document.cookie.split('; ');
    const clienteIdCookie = cookies.find(row => row.startsWith('pache_cliente_id='));
    
    // Obtenemos el ID con el que el cliente se logueó
    const clienteId = clienteIdCookie ? decodeURIComponent(clienteIdCookie.split('=')[1]) : null;

    if (!clienteId) {
      router.push('/login');
      return;
    }

    setDuenoNombre(clienteId);

    const fetchContenidoVIP = async () => {
      setLoading(true);
      
      // 1. Buscamos todas las MARCAS vinculadas a este cliente.
      // Buscamos si el clienteId coincide con el nombre O con el dueno_id de la marca
      const { data: marcasAsociadas } = await supabase
        .from('clientes')
        .select('nombre, dueno_id')
        .or(`dueno_id.eq."${clienteId}",nombre.eq."${clienteId}"`);

      // Creamos una lista de búsqueda que incluya:
      // - El nombre del dueño (con el que se logueó)
      // - Los nombres de todas sus marcas encontradas
      const listaDeBusqueda = [clienteId];
      if (marcasAsociadas) {
        marcasAsociadas.forEach(m => {
          if (m.nombre) listaDeBusqueda.push(m.nombre);
        });
      }

      // Eliminamos duplicados por seguridad
      const nombresUnicos = [...new Set(listaDeBusqueda)];

      // 2. Traemos todos los proyectos que pertenezcan a cualquiera de esos nombres
      const { data: proyectos } = await supabase
        .from('proyectos')
        .select('*')
        .in('cliente', nombresUnicos)
        .order('fecha_entrega', { ascending: true });
      
      if (proyectos) setEventos(proyectos);
      setLoading(false);
    };

    fetchContenidoVIP();
  }, [router]);

  const handleLogout = () => {
    document.cookie = "pache_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict";
    document.cookie = "pache_cliente_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict";
    router.push('/login');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <header className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Portal <span className="text-purple-500">PACHE360</span></h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Bienvenido, {duenoNombre}</p>
        </div>
        <button onClick={handleLogout} className="bg-red-900/20 text-red-400 p-3 rounded-xl border border-red-500/20 hover:bg-red-900/40 transition-all">
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventos.length > 0 ? (
          eventos.map((item) => (
            <div key={item.id} className="bg-[#111] border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                  item.categoria === 'Fotografía' ? 'border-purple-500 text-purple-400 bg-purple-500/10' :
                  item.categoria === 'Video' ? 'border-orange-500 text-orange-400 bg-orange-500/10' :
                  'border-blue-500 text-blue-400 bg-blue-500/10'
                }`}>
                  {item.categoria}
                </span>
                <div className="flex items-center gap-1 text-gray-500 font-mono text-[10px]">
                  <CalendarIcon className="h-3 w-3" /> {item.fecha_entrega || "PRÓXIMAMENTE"}
                </div>
              </div>

              <h3 className="text-xl font-bold uppercase italic mb-1 truncate">{item.titulo}</h3>
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-4 flex items-center gap-1">
                <RectangleGroupIcon className="h-3 w-3" /> {item.cliente}
              </p>

              <div className="space-y-4">
                 <p className="text-gray-400 text-xs italic leading-relaxed line-clamp-2">{item.descripcion || "Producción en proceso..."}</p>
                 <div className="bg-black/40 border border-gray-800 rounded-2xl p-4 text-center">
                    <span className="text-[8px] font-black uppercase text-gray-600 block mb-1 tracking-[0.2em]">Estatus Actual</span>
                    <span className={`text-xs font-bold uppercase italic ${item.estado === 'Entregado' || item.estado === 'Publicado' ? 'text-green-400' : 'text-purple-400'}`}>
                      {item.estado}
                    </span>
                 </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-[#111]/50 rounded-[3rem] border border-dashed border-gray-800">
            <p className="text-gray-600 italic uppercase font-black text-sm tracking-widest px-4 text-center">
              No hay contenido programado para tus marcas.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}