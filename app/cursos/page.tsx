'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeftIcon, AcademicCapIcon, PlusIcon, 
  PencilIcon, CheckBadgeIcon, PhotoIcon, XMarkIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

interface Curso {
  id: string;
  nombre: string;
  ubicacion: string;
  fecha_curso: string;
}

interface Estudiante {
  id: string;
  nombre_completo: string;
  correo: string;
  password?: string;
  curso_id: string;
  pago_completado: boolean;
  progreso: number;
  evidencias: string[];
}

export default function AdminCursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState<'ninguno' | 'curso' | 'alumno' | 'progreso'>('ninguno');
  const [alumnoEditando, setAlumnoEditando] = useState<Estudiante | null>(null);
  const [uploading, setUploading] = useState(false);

  // Formularios
  const [formCurso, setFormCurso] = useState({ nombre: '', ubicacion: 'Pache 360 Studio', fecha_curso: '' });
  const [formAlumno, setFormAlumno] = useState({ nombre_completo: '', correo: '', password: '', curso_id: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: dataCursos } = await supabase.from('cursos').select('*').order('fecha_curso', { ascending: false });
    const { data: dataEstudiantes } = await supabase.from('estudiantes').select('*').order('nombre_completo', { ascending: true });
    
    if (dataCursos) setCursos(dataCursos);
    if (dataEstudiantes) setEstudiantes(dataEstudiantes);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Guardar Curso
  const handleGuardarCurso = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('cursos').insert([formCurso]);
    if (!error) {
      setModalVisible('ninguno');
      setFormCurso({ nombre: '', ubicacion: 'Pache 360 Studio', fecha_curso: '' });
      fetchData();
    } else alert(error.message);
  };

  // Guardar Alumno
  const handleGuardarAlumno = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('estudiantes').insert([{
      ...formAlumno,
      pago_completado: false,
      progreso: 0,
      evidencias: []
    }]);
    if (!error) {
      setModalVisible('ninguno');
      setFormAlumno({ nombre_completo: '', correo: '', password: '', curso_id: '' });
      fetchData();
    } else alert(error.message);
  };

  // Actualizar Progreso y Pago
  const handleActualizarProgreso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alumnoEditando) return;
    const { error } = await supabase.from('estudiantes').update({
      progreso: alumnoEditando.progreso,
      pago_completado: alumnoEditando.pago_completado
    }).eq('id', alumnoEditando.id);

    if (!error) {
      setModalVisible('ninguno');
      fetchData();
    } else alert(error.message);
  };

  // Subir Evidencia
  const handleUploadEvidencia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !alumnoEditando) return;
    try {
      setUploading(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `academia/${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;

      // Usamos el mismo bucket 'disenos' pero en una subcarpeta
      const { error: uploadError } = await supabase.storage.from('disenos').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('disenos').getPublicUrl(fileName);

      // Agregamos la URL al array de evidencias del alumno
      const nuevasEvidencias = [...(alumnoEditando.evidencias || []), publicUrl];
      
      const { error: updateError } = await supabase.from('estudiantes').update({ evidencias: nuevasEvidencias }).eq('id', alumnoEditando.id);
      if (updateError) throw updateError;

      setAlumnoEditando({ ...alumnoEditando, evidencias: nuevasEvidencias });
      fetchData();
      alert("¡Foto de evidencia subida con éxito!");
    } catch (error: unknown) {
      if (error instanceof Error) {
         alert("Error al subir imagen: " + error.message);
      } else {
         alert("Ocurrió un error inesperado al subir la imagen");
      }
    } finally {
      setUploading(false);
    }
  };

  const getNombreCurso = (id: string) => cursos.find(c => c.id === id)?.nombre || 'Curso Desconocido';

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 relative">
      <div className="mb-6 md:mb-8">
        <Link href="/" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-all w-fit text-[10px] md:text-xs font-bold uppercase tracking-widest">
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Volver al Dashboard</span>
        </Link>
      </div>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-cyan-600 p-2 md:p-3 rounded-2xl shadow-lg shadow-cyan-600/20">
            <AcademicCapIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">Academia / Cursos</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Gestión de Alumnos y Capacitación</p>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => setModalVisible('curso')} className="flex-1 md:flex-none bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-xl font-bold transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2">
            <PlusIcon className="h-4 w-4" /> Nuevo Curso
          </button>
          <button onClick={() => setModalVisible('alumno')} className="flex-1 md:flex-none bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-600/20 text-xs uppercase tracking-widest flex items-center justify-center gap-2">
            <PlusIcon className="h-4 w-4" /> Nuevo Alumno
          </button>
        </div>
      </header>

      {/* LISTA DE ALUMNOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {estudiantes.map(alumno => (
          <div key={alumno.id} className="bg-[#111] border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
            <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={() => { setAlumnoEditando(alumno); setModalVisible('progreso'); }}
                className="bg-black/60 p-2 rounded-xl border border-gray-700 hover:text-cyan-400 transition-colors"
                title="Gestionar Progreso y Fotos"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 pr-10">
              <h3 className="text-xl font-black uppercase italic truncate">{alumno.nombre_completo}</h3>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{alumno.correo}</p>
            </div>

            <div className="bg-black border border-gray-800 rounded-2xl p-4 mb-4">
              <p className="text-[9px] text-cyan-500 font-black uppercase tracking-widest mb-1">Curso Asignado</p>
              <p className="text-sm font-bold truncate">{getNombreCurso(alumno.curso_id)}</p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  <span>Progreso</span>
                  <span className={alumno.progreso === 100 ? 'text-green-400' : 'text-cyan-400'}>{alumno.progreso}%</span>
                </div>
                <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
                  <div className={`h-full ${alumno.progreso === 100 ? 'bg-green-500' : 'bg-cyan-500'}`} style={{ width: `${alumno.progreso}%` }}></div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-800/50 pt-4">
                <div className="flex items-center gap-2">
                  <CheckBadgeIcon className={`h-5 w-5 ${alumno.pago_completado ? 'text-green-500' : 'text-gray-700'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${alumno.pago_completado ? 'text-green-400' : 'text-gray-500'}`}>
                    {alumno.pago_completado ? 'Pagado' : 'Pendiente'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black text-gray-500">
                  <PhotoIcon className="h-4 w-4" /> {alumno.evidencias?.length || 0} Fotos
                </div>
              </div>
            </div>
          </div>
        ))}
        {estudiantes.length === 0 && !loading && (
          <div className="col-span-full text-center py-20 text-gray-600 font-black uppercase tracking-widest italic border border-dashed border-gray-800 rounded-3xl">
            Aún no hay alumnos registrados
          </div>
        )}
      </div>

      {/* MODALES REUTILIZABLES */}
      {modalVisible !== 'ninguno' && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-cyan-500/30 w-full max-w-lg rounded-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#161616]">
              <h2 className="text-lg font-black text-cyan-400 uppercase italic">
                {modalVisible === 'curso' ? 'Crear Nuevo Curso' : modalVisible === 'alumno' ? 'Registrar Alumno' : 'Gestionar Progreso'}
              </h2>
              <button onClick={() => setModalVisible('ninguno')}><XMarkIcon className="h-6 w-6 text-gray-500" /></button>
            </div>

            <div className="overflow-y-auto p-6 md:p-8">
              {/* MODAL: NUEVO CURSO */}
              {modalVisible === 'curso' && (
                <form onSubmit={handleGuardarCurso} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Nombre del Curso</label>
                    <input required value={formCurso.nombre} onChange={e => setFormCurso({...formCurso, nombre: e.target.value})} type="text" className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-cyan-500 outline-none" placeholder="Ej: Especialidad CNC Router" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Ubicación</label>
                    <input required value={formCurso.ubicacion} onChange={e => setFormCurso({...formCurso, ubicacion: e.target.value})} type="text" className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-cyan-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Fecha del Curso</label>
                    <input required value={formCurso.fecha_curso} onChange={e => setFormCurso({...formCurso, fecha_curso: e.target.value})} type="date" className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-cyan-500 outline-none" />
                  </div>
                  <button className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-xl text-white font-black uppercase text-xs tracking-widest mt-4">Guardar Curso</button>
                </form>
              )}

              {/* MODAL: NUEVO ALUMNO */}
              {modalVisible === 'alumno' && (
                <form onSubmit={handleGuardarAlumno} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Nombre Completo</label>
                    <input required value={formAlumno.nombre_completo} onChange={e => setFormAlumno({...formAlumno, nombre_completo: e.target.value})} type="text" className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-cyan-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Correo (Usuario de Acceso)</label>
                    <input required value={formAlumno.correo} onChange={e => setFormAlumno({...formAlumno, correo: e.target.value})} type="email" className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-cyan-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Contraseña</label>
                    <input required value={formAlumno.password} onChange={e => setFormAlumno({...formAlumno, password: e.target.value})} type="text" className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-cyan-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Asignar a Curso</label>
                    <select required value={formAlumno.curso_id} onChange={e => setFormAlumno({...formAlumno, curso_id: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-cyan-500 outline-none">
                      <option value="">Selecciona un curso...</option>
                      {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.fecha_curso})</option>)}
                    </select>
                  </div>
                  <button className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-xl text-white font-black uppercase text-xs tracking-widest mt-4">Registrar Alumno</button>
                </form>
              )}

              {/* MODAL: GESTIONAR PROGRESO */}
              {modalVisible === 'progreso' && alumnoEditando && (
                <form onSubmit={handleActualizarProgreso} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block mb-4">
                      Porcentaje de Progreso: {alumnoEditando.progreso}%
                    </label>
                    <input 
                      type="range" min="0" max="100" step="5"
                      value={alumnoEditando.progreso} 
                      onChange={e => setAlumnoEditando({...alumnoEditando, progreso: Number(e.target.value)})} 
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  <div className="flex items-center gap-4 bg-black border border-gray-800 p-4 rounded-2xl cursor-pointer" onClick={() => setAlumnoEditando({...alumnoEditando, pago_completado: !alumnoEditando.pago_completado})}>
                    <div className={`h-6 w-6 rounded-md border-2 flex items-center justify-center ${alumnoEditando.pago_completado ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>
                      {alumnoEditando.pago_completado && <CheckBadgeIcon className="h-4 w-4 text-black" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white uppercase italic">Pago Liquidado</p>
                      <p className="text-[9px] text-gray-500 tracking-widest uppercase">Habilita la descarga de la constancia</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-800 pt-6">
                    <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-4">Subir Evidencia (Fotos)</label>
                    <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-700 rounded-2xl p-6 text-center cursor-pointer hover:border-purple-500 transition-all ${uploading ? 'opacity-50' : ''}`}>
                      <PhotoIcon className="h-8 w-8 text-gray-500" />
                      <span className="text-[10px] font-black uppercase text-gray-400">{uploading ? 'SUBIENDO...' : 'CLICK PARA SUBIR FOTO'}</span>
                      <input type="file" accept="image/*" onChange={handleUploadEvidencia} disabled={uploading} className="hidden" />
                    </label>

                    {/* Mini galería de evidencias subidas */}
                    {alumnoEditando.evidencias && alumnoEditando.evidencias.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {alumnoEditando.evidencias.map((url, i) => (
                          <div key={i} className="aspect-square relative rounded-lg overflow-hidden bg-gray-900 border border-gray-800">
                            <Image src={url} alt="Evidencia" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-xl text-white font-black uppercase text-xs tracking-widest shadow-lg">Guardar Cambios</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}