'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  BuildingOfficeIcon, 
  ArrowRightOnRectangleIcon, 
  DocumentArrowDownIcon,
  CheckBadgeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

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
}

interface Curso {
  id: string;
  nombre: string;
  ubicacion: string;
  fecha_curso: string;
}

// Para usar jsPDF sin que TypeScript se queje
type JsPDFInstancia = {
  setFillColor: (r: number, g: number, b: number) => void;
  rect: (x: number, y: number, w: number, h: number, style: string) => void;
  setTextColor: (r: number, g: number, b: number) => void;
  setFontSize: (size: number) => void;
  text: (text: string, x: number, y: number, options?: Record<string, string>) => void;
  setFont: (fontName: string, fontStyle: string) => void;
  save: (filename: string) => void;
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
      // 1. Obtener datos de la empresa
      const { data: empresaData } = await supabase
        .from('empresas_rh')
        .select('id, nombre_empresa')
        .eq('id', idSesion)
        .single();

      if (empresaData) {
        setEmpresa(empresaData);

        // 2. Obtener solo los estudiantes vinculados a esta empresa
        const { data: estudiantesData } = await supabase
          .from('estudiantes')
          .select('id, nombre_completo, curso_id, pago_completado, progreso')
          .eq('empresa_id', idSesion)
          .order('nombre_completo', { ascending: true });
        
        if (estudiantesData) setEmpleados(estudiantesData);

        // 3. Obtener el catálogo de cursos
        const { data: cursosData } = await supabase.from('cursos').select('id, nombre, ubicacion, fecha_curso');
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

        doc.setFillColor(15, 15, 15);
        doc.rect(0, 0, 1280, 720, 'F');
        
        doc.setTextColor(0, 255, 255); 
        doc.setFontSize(50);
        doc.text("CERTIFICADO DE CAPACITACIÓN", 640, 200, { align: 'center' });

        doc.setTextColor(255, 255, 255); 
        doc.setFont("helvetica", "bold");
        doc.setFontSize(60);
        doc.text(empleado.nombre_completo.toUpperCase(), 640, 350, { align: 'center' });

        doc.setTextColor(150, 150, 150); 
        doc.setFontSize(24);
        doc.text(`Por haber concluido satisfactoriamente el curso:`, 640, 420, { align: 'center' });
        
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
      alert("Hubo un problema al generar la constancia.");
    } finally {
      setGenerandoPDF(null);
    }
  };

  const getNombreCurso = (id: string) => cursos.find(c => c.id === id)?.nombre || 'Curso Desconocido';

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
          const isGenerando = generandoPDF === empleado.id;

          return (
            <div key={empleado.id} className="bg-[#111] border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col h-full">
              <h3 className="text-lg font-black uppercase italic truncate">{empleado.nombre_completo}</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-4 tracking-widest truncate">{getNombreCurso(empleado.curso_id)}</p>

              <div className="mb-6">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  <span>Progreso Técnico</span>
                  <span className={cursoTerminado ? 'text-green-400' : 'text-orange-400'}>{empleado.progreso}%</span>
                </div>
                <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-gray-800">
                  <div className={`h-full ${cursoTerminado ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${empleado.progreso}%` }}></div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6 bg-black p-3 rounded-xl border border-gray-800/50">
                <CheckBadgeIcon className={`h-5 w-5 ${empleado.pago_completado ? 'text-green-500' : 'text-gray-600'}`} />
                <span className={`text-[9px] font-black uppercase tracking-widest ${empleado.pago_completado ? 'text-green-400' : 'text-gray-500'}`}>
                  {empleado.pago_completado ? 'Liquidado' : 'Pago Pendiente'}
                </span>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-800">
                <button 
                  onClick={() => generarCertificadoPDF(empleado)}
                  disabled={!puedeDescargar || isGenerando}
                  className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    puedeDescargar 
                      ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20' 
                      : 'bg-black border border-gray-800 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  {isGenerando ? 'GENERANDO...' : 'Descargar Constancia'}
                </button>
              </div>
            </div>
          );
        })}

        {empleados.length === 0 && !loading && (
          <div className="col-span-full text-center py-20 text-gray-600 font-black uppercase tracking-widest italic border border-dashed border-gray-800 rounded-3xl">
            No hay empleados vinculados a esta cuenta.
          </div>
        )}
      </div>
    </main>
  );
}