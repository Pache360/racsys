'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CalendarIcon, PhotoIcon, VideoCameraIcon, ChatBubbleBottomCenterTextIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function PortalCliente() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [clienteName, setClienteName] = useState('');
  const router = useRouter();

  useEffect(() => {
    // 1. Leer de la cookie quién es el cliente
    const cookies = document.cookie.split('; ');
    const clienteIdCookie = cookies.find(row => row.startsWith('pache_cliente_id='));
    const clienteId = clienteIdCookie ? clienteIdCookie.split('=')[1] : null;

    if (!clienteId) {
      router.push('/login');
      return;
    }

    setClienteName(decodeURIComponent(clienteId));

    // 2. Traer solo sus proyectos
    const fetchData = async () => {
      const { data } = await supabase
        .from('proyectos')
        .select('*')
        .eq('cliente', decodeURIComponent(clienteId))
        .order('fecha_entrega', { ascending: true });
      
      if (data) setEventos(data);
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    document.cookie = "pache_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "pache_cliente_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <header className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Portal <span className="text-purple-500">PACHE360</span></h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">{clienteName}</p>
        </div>
        <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 p-2 transition-colors">
          <ArrowRightOnRectangleIcon className="h-6 w-6" />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventos.length > 0 ? eventos.map((item) => (
          <div key={item.id} className="bg-[#111] border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                item.categoria === 'Fotografía' ? 'border-purple-500 text-purple-400 bg-purple-500/10' :
                item.categoria === 'Video' ? 'border-orange-500 text-orange-400 bg-orange-500/10' :
                'border-blue-500 text-blue-400 bg-blue-500/10'
              }`}>
                {item.categoria}
              </span>
              <div className="flex items-center gap-1 text-gray-500 font-mono text-[10px]">
                <CalendarIcon className="h-3 w-3" /> {item.fecha_entrega || "PENDIENTE"}
              </div>
            </div>

            <h3 className="text-xl font-bold uppercase italic mb-4">{item.titulo}</h3>

            <div className="flex flex-col gap-2">
               <p className="text-gray-500 text-xs italic mb-2">{item.descripcion || "Sin descripción adicional."}</p>
               <div className="bg-black/40 border border-gray-800 rounded-xl p-3 text-center">
                  <span className="text-[9px] font-black uppercase text-gray-600 block mb-1">Estado de producción</span>
                  <span className="text-xs font-bold text-white uppercase italic">{item.estado}</span>
               </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-20 text-gray-600 italic">No hay proyectos activos registrados para tu marca.</div>
        )}
      </div>
    </main>
  );
}