'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  BuildingOfficeIcon, 
  ArrowRightOnRectangleIcon, 
  DocumentArrowDownIcon,
  CheckBadgeIcon,
  UserGroupIcon,
  ListBulletIcon,
  XMarkIcon,
  ClockIcon,
  PhotoIcon // IMPORTADO
} from '@heroicons/react/24/outline';
import Image from 'next/image'; // IMPORTADO

interface Tema {
  titulo: string;
  material_url: string;
}

interface Modulo {
  modulo: string;
  temas: (Tema | string)[];
}

interface EmpresaRH {
  id: string;
  nombre_empresa: string;
}

interface Estudiante {
  id: string;
  nombre_completo: string;
  curso_id: string;
  pago_completado: boolean;
  progreso: number;
  temas_completados: string[];
  evidencias: string[]; // NUEVO
}

interface Curso {
  id: string;
  nombre: string;
  ubicacion: string;
  fecha_curso: string;
  temario: Modulo[];
}

type JsPDFInstancia = {
  setFillColor: (r: number, g: number, b: number) => void;
  rect: (x: number, y: number, w: number, h: number, style: string) => void;
  setTextColor: (r: number, g: number, b: number) => void;
  setFontSize: (size: number) => void;
  text: (text: string, x: number, y: number, options?: Record<string, string>) => void;
  setFont: (fontName: string, fontStyle: string) => void;
  save: (filename: string) => void;
  addImage: (imageData: string | HTMLImageElement, format: string, x: number, y: number, w: number, h: number) => void;
};

interface CustomWindow extends Window {
  jspdf?: {
    jsPDF: new (options?: Record<string, unknown>) => JsPDFInstancia;
  };
}

export default function RHDashboard() {
  const [empresa, setEmpresa] = useState<EmpresaRH | null>(null);
  const [empleados, setEmpleados] = useState<Estudiante[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [generandoPDF, setGenerandoPDF] = useState<string | null>(null);
  const [empleadoDetalle, setEmpleadoDetalle] = useState<Estudiante | null>(null);
  const router = useRouter();

  const handleLogout = useCallback(() => {
    document.cookie = "pache_rh_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict";
    router.push('/academia/rh/login');
  }, [router]);

  const fetchDatosRH = useCallback(async () => {
    const cookies = document.cookie.split('; ');
    const rhIdCookie = cookies.find(row => row.startsWith('pache_rh_id='));
    const idSesion = rhIdCookie ? decodeURIComponent(rhIdCookie.split('=')[1]) : null;

    if (!idSesion) {
      router.push('/academia/rh/login');
      return;
    }

    try {
      const { data: empresaData } = await supabase
        .from('empresas_rh')
        .select('id, nombre_empresa')
        .eq('id', idSesion)
        .single();

      if (empresaData) {
        setEmpresa(empresaData);
        // NUEVO: Agregado 'evidencias' a la consulta
        const { data: estudiantesData } = await supabase
          .from('estudiantes')
          .select('id, nombre_completo, curso_id, pago_completado, progreso, temas_completados, evidencias')
          .eq('empresa_id', idSesion)
          .order('nombre_completo', { ascending: true });
        
        if (estudiantesData) setEmpleados(estudiantesData);
        const { data: cursosData } = await supabase.from('cursos').select('*');
        if (cursosData) setCursos(cursosData);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router, handleLogout]); 

  useEffect(() => {
    fetchDatosRH();
  }, [fetchDatosRH]);

  const generarCertificadoPDF = async (empleado: Estudiante) => {
    const cursoAsignado = cursos.find(c => c.id === empleado.curso_id);
    if (!cursoAsignado) return;
    setGenerandoPDF(empleado.id);
    try {
      const win = window as unknown as CustomWindow;
      if (!win.jspdf) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Error al cargar PDF"));
          document.head.appendChild(script);
        });
      }
      const loadedWin = window as unknown as CustomWindow;
      if (loadedWin.jspdf) {
        const jsPDF = loadedWin.jspdf.jsPDF;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1280, 720] });
        
        const cargarImagen = (url: string) => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new window.Image();
            img.src = url;
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
          });
        };

        try {
          const imgPlantilla = await cargarImagen('/plantilla_constancia.jpg');
          doc.addImage(imgPlantilla, 'JPEG', 0, 0, 1280, 720);
        } catch (imgError) {
          console.error("No se encontro la imagen", imgError);
          doc.setFillColor(15, 15, 15);
          doc.rect(0, 0, 1280, 720, 'F');
        }

        doc.setTextColor(255, 255, 255); 
        doc.setFont("helvetica", "bold");
        doc.setFontSize(60);
        doc.text(empleado.nombre_completo.toUpperCase(), 640, 350, { align: 'center' });
        
        doc.setTextColor(200, 150, 255); 
        doc.setFontSize(35);
        doc.text(`"${cursoAsignado.nombre}"`, 640, 470, { align: 'center' });
        
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(20);
        const fechaFormat = new Date(cursoAsignado.fecha_curso).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.text(`Impartido en ${cursoAsignado.ubicacion} el ${fechaFormat}`, 640, 520, { align: 'center' });
        
        doc.save(`Constancia_${empleado.nombre_completo.replace(/\s+/g, '_')}.pdf`);
      }
    } catch (error) { 
      console.error(error); 
      alert("Error generando constancia."); 
    } finally { 
      setGenerandoPDF(null); 
    }
  };

  const getNombreCurso = (id: string) => cursos.find(c => c.id === id)?.nombre || 'Curso Desconocido';
  const getTemarioEmpleado = (idCurso: string) => cursos.find(c => c.id === idCurso)?.temario || [];

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div></div>;
  if (!empresa) return null;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-white/5 pb-6 gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 p-3 rounded-2xl shadow-lg shadow-orange-600/20">
            <BuildingOfficeIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">PORTAL <span className="text-orange-500">SUPERVISOR RH</span></h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 italic">{empresa.nombre_empresa}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="bg-red-900/20 text-red-400 p-3 rounded-xl border border-red-500/20 hover:bg-red-900/40 transition-all active:scale-95 flex items-center gap-2 text-xs font-bold uppercase">
          <ArrowRightOnRectangleIcon className="h-5 w-5" /> Cerrar Sesión
        </button>
      </header>

      <div className="flex items-center gap-2 mb-6">
        <UserGroupIcon className="h-6 w-6 text-orange-500" />
        <h2 className="text-lg font-black uppercase tracking-tighter italic">Personal Capacitado ({empleados.length})</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {empleados.map(empleado => {
          const cursoTerminado = empleado.progreso >= 100;
          const puedeDescargar = cursoTerminado && empleado.pago_completado;

          return (
            <div key={empleado.id} className="bg-[#111] border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col h-full hover:border-orange-500/30 transition-all group">
              <h3 className="text-lg font-black uppercase italic truncate">{empleado.nombre_completo}</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-4 tracking-widest truncate">{getNombreCurso(empleado.curso_id)}</p>

              <div className="mb-6">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  <span>Avance General</span>
                  <span className={cursoTerminado ? 'text-green-400' : 'text-orange-400'}>{empleado.progreso}%</span>
                </div>
                <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-gray-800">
                  <div className={`h-full transition-all duration-1000 ${cursoTerminado ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${empleado.progreso}%` }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-6">
                <button 
                  onClick={() => setEmpleadoDetalle(empleado)}
                  className="bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  <ListBulletIcon className="h-4 w-4" /> Detalle Temas
                </button>
                <div className="bg-black border border-gray-800/50 flex items-center justify-center gap-2 rounded-xl px-2">
                  <CheckBadgeIcon className={`h-4 w-4 ${empleado.pago_completado ? 'text-green-500' : 'text-gray-600'}`} />
                  <span className={`text-[8px] font-black uppercase ${empleado.pago_completado ? 'text-green-400' : 'text-gray-500'}`}>
                    {empleado.pago_completado ? 'Liquidado' : 'Pendiente'}
                  </span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-800">
                <button 
                  onClick={() => generarCertificadoPDF(empleado)}
                  disabled={!puedeDescargar || generandoPDF === empleado.id}
                  className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    puedeDescargar 
                      ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20' 
                      : 'bg-black border border-gray-800 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  {generandoPDF === empleado.id ? 'PROCESANDO...' : 'Descargar Constancia'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {empleadoDetalle && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-orange-500/20 w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#141414]">
              <div>
                <h2 className="text-2xl font-black uppercase italic text-white leading-none mb-1">{empleadoDetalle.nombre_completo}</h2>
                <p className="text-orange-500 text-[10px] font-bold uppercase tracking-widest">Desglose de capacitación y evidencias</p>
              </div>
              <button 
                onClick={() => setEmpleadoDetalle(null)}
                className="bg-white/5 p-3 rounded-full hover:bg-white/10 transition-all"
              >
                <XMarkIcon className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* EVIDENCIA FOTOGRAFICA PARA RH */}
              <div className="bg-black/40 border border-gray-800/50 rounded-3xl p-6">
                <h4 className="text-xs font-black text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <PhotoIcon className="h-4 w-4" />
                  Evidencia Fotográfica ({empleadoDetalle.evidencias?.length || 0})
                </h4>
                {empleadoDetalle.evidencias && empleadoDetalle.evidencias.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {empleadoDetalle.evidencias.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square relative rounded-xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-orange-500 transition-colors block">
                         <Image src={url} alt={`Evidencia ${idx + 1}`} fill className="object-cover" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 italic uppercase font-bold text-center py-4">Aún no hay fotos subidas de este alumno.</p>
                )}
              </div>

              {/* TEMARIO */}
              {getTemarioEmpleado(empleadoDetalle.curso_id).map((mod, i) => (
                <div key={i} className="bg-black/40 border border-gray-800/50 rounded-3xl p-6">
                  <h4 className="text-xs font-black text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    {mod.modulo}
                  </h4>
                  <div className="space-y-3">
                    {mod.temas.map((temaRaw, j) => {
                      const titulo = typeof temaRaw === 'string' ? temaRaw : temaRaw.titulo;
                      const completado = empleadoDetalle.temas_completados?.includes(titulo);
                      
                      return (
                        <div key={j} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-transparent hover:border-gray-800 transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${completado ? 'bg-green-500/20 border-green-500' : 'border-gray-700'}`}>
                               {completado ? <CheckBadgeIcon className="h-3 w-3 text-green-400" /> : <ClockIcon className="h-3 w-3 text-gray-600" />}
                            </div>
                            <span className={`text-xs font-bold ${completado ? 'text-gray-300' : 'text-gray-500'}`}>{titulo}</span>
                          </div>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${completado ? 'text-green-500 bg-green-500/10' : 'text-gray-600 bg-gray-900'}`}>
                            {completado ? 'Terminado' : 'Pendiente'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {getTemarioEmpleado(empleadoDetalle.curso_id).length === 0 && (
                <div className="text-center py-10">
                    <p className="text-gray-500 italic uppercase font-bold text-xs">No hay temario registrado para este curso.</p>
                </div>
              )}
            </div>
            
            <div className="p-8 bg-[#141414] border-t border-white/5">
                <button 
                  onClick={() => setEmpleadoDetalle(null)}
                  className="w-full bg-orange-600 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-500 transition-all"
                >
                  Entendido, Volver
                </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}