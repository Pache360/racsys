'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CalendarIcon, 
  PhotoIcon, 
  VideoCameraIcon, 
  ChatBubbleBottomCenterTextIcon, 
  ArrowRightOnRectangleIcon,
  RectangleGroupIcon 
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function PortalCliente() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [clienteName, setClienteName] = useState('');
  const [marcasAsociadas, setMarcasAsociadas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const cookies = document.cookie.split('; ');
    const clienteIdCookie = cookies.find(row => row.startsWith('pache_cliente_id='));
    const clienteId = clienteIdCookie ? decodeURIComponent(clienteIdCookie.split('=')[1]) : null;

    if (!clienteId) {
      router.push('/login');
      return;
    }

    setClienteName(clienteId);

    const fetchData = async () => {
      setLoading(true);
      
      // 1. Buscamos todas las marcas que le pertenecen a este dueño
      // Buscamos donde dueno_id sea igual al ID del cliente logueado
      const { data: marcas } = await supabase
        .from('clientes')
        .select('nombre')
        .eq('dueno_id', clienteId);

      // Creamos un array con los nombres de las marcas + el nombre del dueño por si acaso
      const nombresParaFiltrar = marcas ? marcas.map(m => m.nombre) : [];
      nombresParaFiltrar.push(clienteId); 
      
      setMarcasAsociadas(nombresParaFiltrar);

      // 2. Traer todos los proyectos donde el 'cliente' sea cualquiera de esas marcas
      const { data: proyectos, error } = await supabase
        .from('proyectos')
        .select('*')
        .in('cliente', nombresParaFiltrar) // Filtro maestro: trae todo lo de sus marcas
        .order('fecha_entrega', { ascending: true });
      
      if (proyectos) {
        setEventos(proyectos);
      }
      setLoading(false);
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    document.cookie = "pache_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "pache_cliente_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <header className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Portal <span className="text-purple-500">PACHE360</span></h1>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Bienvenido, {clienteName}
          </p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 bg-red-900/10 hover:bg-red-900/30 text-red-500 px-4 py-2 rounded-xl border border-red-500/20 transition-all text-xs font-bold uppercase">
          <ArrowRightOnRectangleIcon className="h-5 w-5" /> Salir
        </button>
      </header>

      {/* Resumen de marcas vinculadas */}
      <div className="mb-8 flex flex-wrap gap-2">
        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest w-full mb-1">Marcas bajo tu gestión:</span>
        {marcasAsociadas.filter(m => m !== clienteName).map(marca => (
          <div key={marca} className="bg-[#111] border border-gray-800 px-3 py-1 rounded-lg flex items-center gap-2">
            <RectangleGroupIcon className="h-3 w-3 text-cyan-500" />
            <span className="text-[10px] font-bold text-gray-300">{marca}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventos.length > 0 ? eventos.map((item) => (
          <div key={item.id} className="bg-[#111] border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
            
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                item.categoria === 'Fotografía' ? 'border-purple-500 text-purple-400 bg-purple-500/10' :
                item.categoria === 'Video' ? 'border-orange-500 text-orange-400 bg-orange-500/10' :
                'border-blue-500 text-blue-400 bg-blue-500/10'
              }`}>
                {item.categoria}
              </span>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-gray-500 font-mono text-[10px]">
                  <CalendarIcon className="h-3 w-3 text-purple-500" /> {item.fecha_entrega || "PROXIMAMENTE"}
                </div>
                <span className="text-[8px] text-gray-600 font-bold uppercase mt-1">{item.cliente}</span>
              </div>
            </div>

            <h3 className="text-xl font-bold uppercase italic mb-4 leading-tight group-hover:text-purple-300 transition-colors">
              {item.titulo}
            </h3>

            <div className="flex flex-col gap-3">
               <p className="text-gray-400 text-xs italic line-clamp-2 hover:line-clamp-none transition-all cursor-default">
                 {item.descripcion || "Proyecto en proceso de producción para tu marca."}
               </p>
               
               <div className="bg-black/40 border border-gray-800/50 rounded-2xl p-4 mt-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black uppercase text-gray-600 tracking-tighter">Progreso actual</span>
                    <span className={`text-[10px] font-black uppercase italic ${item.estado === 'Entregado' ? 'text-green-400' : 'text-purple-400'}`}>
                      {item.estado}
                    </span>
                  </div>
                  {/* Barra de progreso visual según el estado */}
                  <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${item.estado === 'Entregado' ? 'bg-green-500 w-full' : 'bg-purple-600 w-1/2'}`}
                    ></div>
                  </div>
               </div>
            </div>

            {/* Decoración visual de fondo */}
            <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
               {item.categoria === 'Fotografía' && <PhotoIcon className="h-24 w-24" />}
               {item.categoria === 'Video' && <VideoCameraIcon className="h-24 w-24" />}
               {item.categoria === 'Posts' && <ChatBubbleBottomCenterTextIcon className="h-24 w-24" />}
            </div>
          </div>
        )) : (
          <div className="col-span-full bg-[#111] border border-dashed border-gray-800 rounded-3xl py-20 text-center">
            <div className="bg-gray-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <RectangleGroupIcon className="h-8 w-8 text-gray-700" />
            </div>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">No hay contenido programado aún</p>
            <p className="text-gray-700 text-[10px] mt-2 italic">Estamos trabajando en las próximas producciones de tus marcas.</p>
          </div>
        )}
      </div>
    </main>
  );
}