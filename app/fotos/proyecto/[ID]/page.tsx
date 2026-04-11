'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon, CalendarIcon, MapPinIcon, 
  UserIcon, DocumentTextIcon, TagIcon 
} from '@heroicons/react/24/outline';

export default function DetalleProyecto() {
  const params = useParams();
  const id = params.id;

  // Datos simulados (esto es lo que vendrá de la base de datos después)
  const proyecto = {
    id: id,
    titulo: "Sesión de comida El Sagrario",
    cliente: "Restaurante El Sagrario",
    descripcion: "Fotografía gastronómica para el nuevo menú de temporada. Se requiere enfoque en texturas y colores cálidos. Incluye 15 platos y tomas de ambiente.",
    categoria: "Fotografía",
    fechaInicio: "2026-04-05",
    fechaTomas: "2026-04-12",
    ubicacion: "Calle Alcalá #102, Centro Histórico, Oaxaca",
    estado: "Planeación"
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-12">
      {/* Botón Volver */}
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-all w-fit group">
          <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">Dashboard</span>
        </Link>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Cabezal de la Ficha */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-purple-500 mb-2">
              <TagIcon className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-[0.3em]">{proyecto.categoria}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black italic leading-none">{proyecto.titulo}</h1>
          </div>
          <div className="bg-purple-600/10 border border-purple-500/30 px-6 py-3 rounded-2xl">
             <span className="text-[10px] text-purple-400 block font-bold uppercase mb-1">Estado Actual</span>
             <span className="text-xl font-bold text-white">{proyecto.estado}</span>
          </div>
        </div>

        {/* Cuerpo de la Información */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Principal (Descripción) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#111] border border-gray-800 p-8 rounded-3xl">
              <div className="flex items-center gap-2 mb-4 text-gray-400">
                <DocumentTextIcon className="h-5 w-5" />
                <h2 className="font-bold uppercase text-sm tracking-widest">Descripción del Proyecto</h2>
              </div>
              <p className="text-gray-300 leading-relaxed text-lg">
                {proyecto.descripcion}
              </p>
            </div>

            {/* Mapa o Espacio para Ubicación */}
            <div className="bg-[#111] border border-gray-800 p-8 rounded-3xl flex items-start gap-4">
              <div className="bg-purple-900/20 p-3 rounded-xl">
                <MapPinIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h2 className="font-bold uppercase text-xs text-gray-500 tracking-widest mb-1">Ubicación de las Tomas</h2>
                <p className="text-white font-medium">{proyecto.ubicacion}</p>
                <button className="mt-4 text-xs text-purple-400 hover:underline font-bold">Ver en Google Maps →</button>
              </div>
            </div>
          </div>

          {/* Columna Lateral (Datos Rápidos) */}
          <div className="space-y-4">
            <div className="bg-[#111] border border-gray-800 p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gray-800 p-2 rounded-lg"><UserIcon className="h-5 w-5 text-gray-400" /></div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Cliente</p>
                  <p className="font-bold">{proyecto.cliente}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Inicio / Cotización</p>
                    <p className="text-sm font-mono">{proyecto.fechaInicio}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Fecha de Tomas</p>
                    <p className="text-sm font-mono">{proyecto.fechaTomas}</p>
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-gray-200 transition-all uppercase text-xs tracking-widest">
              Editar Proyecto
            </button>
            <button className="w-full border border-red-900/30 text-red-500 font-bold py-4 rounded-2xl hover:bg-red-900/10 transition-all uppercase text-[10px] tracking-widest">
              Eliminar de la Agencia
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}