'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  AcademicCapIcon, 
  ArrowRightOnRectangleIcon, 
  DocumentArrowDownIcon,
  PhotoIcon,
  CheckBadgeIcon,
  BookOpenIcon,
  LinkIcon 
} from '@heroicons/react/24/outline';
import Image from 'next/image';

interface Tema {
  titulo: string;
  material_url?: string;
}

interface Modulo {
  modulo: string;
  temas: (Tema | string)[];
}

interface Curso {
  id: string;
  nombre: string;
  ubicacion: string;
  fecha_curso: string;
  temario: Modulo[]; 
}

interface Alumno {
  id: string;
  nombre_completo: string;
  usuario: string; 
  curso_id: string;
  pago_completado: boolean;
  progreso: number;
  evidencias: string[];
  temas_completados: string[];
}

export default function AcademiaDashboard() {
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [curso, setCurso] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleLogout = useCallback(() => {
    document.cookie = "pache_alumno_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict";
    router.push('/academia/login');
  }, [router]);

  const fetchDatosAlumno = useCallback(async () => {
    const cookies = document.cookie.split('; ');
    const alumnoIdCookie = cookies.find(row => row.startsWith('pache_alumno_id='));
    const idSesion = alumnoIdCookie ? decodeURIComponent(alumnoIdCookie.split('=')[1]) : null;

    if (!idSesion) {
      router.push('/academia/login');
      return;
    }

    try {
      const { data: estudianteData } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('id', idSesion)
        .single();

      if (estudianteData) {
        setAlumno(estudianteData);
        if (estudianteData.curso_id) {
          const { data: cursoData } = await supabase
            .from('cursos')
            .select('*')
            .eq('id', estudianteData.curso_id)
            .single();
          setCurso(cursoData);
        }
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
    fetchDatosAlumno();
  }, [fetchDatosAlumno]);

  // CORRECCIÓN PARA VERCEL: Importación dinámica de jsPDF
  const generarCertificadoPDF = async () => {
    if (!alumno || !curso) return;

    // Solo carga la librería cuando el alumno hace clic
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1280, 720] });

    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, 1280, 720, 'F');
    
    doc.setTextColor(0, 255, 255); 
    doc.setFontSize(50);
    doc.text("CERTIFICADO DE CAPACITACIÓN", 640, 200, { align: 'center' });

    doc.setTextColor(255, 255, 255); 
    doc.setFont("helvetica", "bold");
    doc.setFontSize(60);
    doc.text(alumno.nombre_completo.toUpperCase(), 640, 350, { align: 'center' });

    doc.setTextColor(150, 150, 150); 
    doc.setFontSize(24);
    doc.text(`Por haber concluido satisfactoriamente el curso:`, 640, 420, { align: 'center' });
    
    doc.setTextColor(200, 150, 255); 
    doc.setFontSize(35);
    doc.text(`"${curso.nombre}"`, 640, 470, { align: 'center' });

    doc.setTextColor(150, 150, 150);
    doc.setFontSize(20);
    const fechaFormat = new Date(curso.fecha_curso).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Impartido en ${curso.ubicacion} el ${fechaFormat}`, 640, 520, { align: 'center' });

    doc.save(`Constancia_${alumno.nombre_completo.replace(/\s+/g, '_')}.pdf`);
  };

  const getModuloActual = () => {
    if (!curso || !curso.temario) return null;
    const completados = alumno?.temas_completados || [];

    for (const mod of curso.temario) {
      const todosTerminados = mod.temas.every((t: Tema | string) => {
        const titulo = typeof t === 'string' ? t : t.titulo;
        return completados.includes(titulo);
      });
      if (!todosTerminados) return mod;
    }
    
    return curso.temario[curso.temario.length - 1] || null;
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-500"></div></div>;
  if (!alumno) return null;

  const progreso = alumno.progreso || 0;
  const cursoTerminado = progreso >= 100;
  const puedeDescargar = cursoTerminado && alumno.pago_completado;
  const moduloActual = getModuloActual();

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-white/5 pb-6 gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-cyan-600 p-3 rounded-2xl shadow-lg shadow-cyan-600/20">
            <AcademicCapIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">PORTAL DEL <span className="text-cyan-500">ALUMNO</span></h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 italic">Hola, {alumno.nombre_completo}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="bg-red-900/20 text-red-400 p-3 rounded-xl border border-red-500/20 hover:bg-red-900/40 transition-all active:scale-95 flex items-center gap-2 text-xs font-bold uppercase">
          <ArrowRightOnRectangleIcon className="h-5 w-5" /> Salir
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#111] border border-gray-800 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Curso Actual</h2>
            <h3 className="text-xl font-bold italic text-cyan-400 mb-4">{curso?.nombre || 'Cargando curso...'}</h3>
            
            <div className="mb-6">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                <span>Progreso Técnico</span>
                <span className={cursoTerminado ? 'text-green-400' : 'text-cyan-400'}>{progreso}%</span>
              </div>
              <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-gray-800">
                <div className={`h-full transition-all duration-1000 ${cursoTerminado ? 'bg-green-500' : 'bg-cyan-500'}`} style={{ width: `${progreso}%` }}></div>
              </div>
            </div>

            {/* MÓDULO ACTUAL CON LINKS DE MATERIALES */}
            {moduloActual && (
              <div className="mb-6 bg-black border border-gray-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-3 border-b border-gray-800 pb-2">
                  <BookOpenIcon className="h-4 w-4" /> Estudiando: {moduloActual.modulo}
                </div>
                <ul className="space-y-4">
                  {moduloActual.temas.map((temaRaw: Tema | string, i: number) => {
                    const titulo = typeof temaRaw === 'string' ? temaRaw : temaRaw.titulo;
                    const material = typeof temaRaw === 'string' ? '' : temaRaw.material_url;
                    const completado = alumno.temas_completados?.includes(titulo);
                    
                    return (
                      <li key={i} className="flex flex-col gap-1.5">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${completado ? 'bg-green-500 border-green-500' : 'border-gray-700'}`}>
                            {completado && <CheckBadgeIcon className="w-3 h-3 text-black" />}
                          </div>
                          <span className={`text-xs ${completado ? 'text-gray-500 line-through' : 'text-white font-medium'}`}>{titulo}</span>
                        </div>
                        {/* BOTÓN DE MATERIAL DE APOYO */}
                        {material && !completado && (
                          <a 
                            href={material} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-7 inline-flex items-center gap-1.5 bg-cyan-900/30 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest w-fit hover:bg-cyan-500 hover:text-white transition-all"
                          >
                            <LinkIcon className="h-3 w-3" /> Ver Material
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {cursoTerminado && (
                  <p className="text-[10px] text-green-400 font-bold uppercase mt-4 text-center">¡Haz finalizado todos los temas!</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 bg-black/50 p-4 rounded-2xl border border-gray-800">
              <div className={`p-2 rounded-full ${alumno.pago_completado ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                <CheckBadgeIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Estado de Cuenta</p>
                <p className={`text-sm font-bold uppercase italic ${alumno.pago_completado ? 'text-green-400' : 'text-orange-400'}`}>
                  {alumno.pago_completado ? 'Liquidado' : 'Pago Pendiente'}
                </p>
              </div>
            </div>
          </div>

          <div className={`border rounded-3xl p-6 shadow-2xl transition-all ${puedeDescargar ? 'bg-[#111] border-cyan-500/50' : 'bg-black border-gray-800 opacity-70'}`}>
            <div className="flex flex-col items-center text-center gap-4">
              <DocumentArrowDownIcon className={`h-12 w-12 ${puedeDescargar ? 'text-cyan-400' : 'text-gray-600'}`} />
              <div>
                <h3 className="text-lg font-black uppercase italic mb-1 text-white">Constancia Digital</h3>
                <p className="text-[10px] text-gray-400 tracking-wider">
                  {puedeDescargar ? 'Tu certificado oficial está listo para descargar en PDF.' : 'Completa el 100% del curso y liquida tu saldo para habilitar tu constancia.'}
                </p>
              </div>
              <button 
                onClick={generarCertificadoPDF}
                disabled={!puedeDescargar}
                className="w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20 mt-2"
              >
                Descargar PDF
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-[#111] border border-gray-800 rounded-3xl p-6 shadow-2xl h-full">
            <div className="flex items-center gap-2 mb-6">
              <PhotoIcon className="h-6 w-6 text-purple-500" />
              <h2 className="text-lg font-black uppercase tracking-tighter italic">Evidencia Fotográfica</h2>
            </div>

            {alumno.evidencias && alumno.evidencias.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {alumno.evidencias.map((url: string, index: number) => (
                  <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-800 bg-black group">
                    <Image src={url} alt={`Evidencia ${index + 1}`} fill className="object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-600 border-2 border-dashed border-gray-800 rounded-2xl bg-black/50">
                <PhotoIcon className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-[10px] font-black uppercase tracking-widest">Aún no hay fotos de tus prácticas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}