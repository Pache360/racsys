'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeftIcon, AcademicCapIcon, PlusIcon, 
  PencilIcon, CheckBadgeIcon, PhotoIcon, XMarkIcon,
  UserGroupIcon, FolderOpenIcon,
  ListBulletIcon, TrashIcon, LinkIcon, BuildingOfficeIcon,
  DocumentPlusIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

interface Tema {
  titulo: string;
  material_url: string;
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

interface EmpresaRH {
  id: string;
  nombre_empresa: string;
  usuario: string;
  password?: string;
}

interface Estudiante {
  id: string;
  nombre_completo: string;
  usuario: string;
  password?: string;
  curso_id: string;
  empresa_id: string | null; 
  pago_completado: boolean;
  progreso: number;
  evidencias: string[];
  temas_completados: string[]; 
}

export default function AdminCursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaRH[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [vistaActiva, setVistaActiva] = useState<'Alumnos' | 'Cursos' | 'Empresas'>('Alumnos');

  const [modalVisible, setModalVisible] = useState<'ninguno' | 'curso' | 'alumno' | 'progreso' | 'empresa' | 'vincular'>('ninguno');
  const [alumnoEditando, setAlumnoEditando] = useState<Estudiante | null>(null);
  const [cursoEditandoId, setCursoEditandoId] = useState<string | null>(null); 
  const [uploading, setUploading] = useState(false);

  const [formCurso, setFormCurso] = useState<{ nombre: string, ubicacion: string, fecha_curso: string, temario: { modulo: string, temas: Tema[] }[] }>({ 
    nombre: '', ubicacion: 'Pache 360 Studio', fecha_curso: '', temario: [] 
  });
  const [formAlumno, setFormAlumno] = useState({ nombre_completo: '', usuario: '', password: '', curso_id: '', empresa_id: '' });
  const [formEmpresa, setFormEmpresa] = useState({ nombre_empresa: '', usuario: '', password: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: dataCursos } = await supabase.from('cursos').select('*').order('fecha_curso', { ascending: false });
    const { data: dataEstudiantes } = await supabase.from('estudiantes').select('*').order('nombre_completo', { ascending: true });
    const { data: dataEmpresas } = await supabase.from('empresas_rh').select('*').order('nombre_empresa', { ascending: true });
    
    if (dataCursos) setCursos(dataCursos || []);
    if (dataEstudiantes) setEstudiantes(dataEstudiantes || []);
    if (dataEmpresas) setEmpresas(dataEmpresas || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEliminarCurso = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este curso? Esta acción no se puede deshacer.')) {
      const { error } = await supabase.from('cursos').delete().eq('id', id);
      if (!error) fetchData();
      else alert(error.message);
    }
  };

  const handleEliminarAlumno = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar a este alumno?')) {
      const { error } = await supabase.from('estudiantes').delete().eq('id', id);
      if (!error) fetchData();
      else alert(error.message);
    }
  };

  const handleEliminarEmpresa = async (id: string) => {
    if (confirm('¿Eliminar empresa y desvincular alumnos? No se borrarán los alumnos, solo se quitarán de este grupo.')) {
      const { error } = await supabase.from('empresas_rh').delete().eq('id', id);
      if (!error) fetchData();
      else alert(error.message);
    }
  };

  const handleGuardarCurso = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      nombre: formCurso.nombre,
      ubicacion: formCurso.ubicacion,
      fecha_curso: formCurso.fecha_curso,
      temario: formCurso.temario 
    };

    if (cursoEditandoId) {
      const { error } = await supabase.from('cursos').update(payload).eq('id', cursoEditandoId);
      if (!error) {
        setModalVisible('ninguno');
        setFormCurso({ nombre: '', ubicacion: 'Pache 360 Studio', fecha_curso: '', temario: [] });
        setCursoEditandoId(null);
        fetchData();
      } else alert(error.message);
    } else {
      const { error } = await supabase.from('cursos').insert([payload]);
      if (!error) {
        setModalVisible('ninguno');
        setFormCurso({ nombre: '', ubicacion: 'Pache 360 Studio', fecha_curso: '', temario: [] });
        fetchData();
      } else alert(error.message);
    }
  };

  const handleGuardarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('empresas_rh').insert([formEmpresa]);
    if (!error) {
      setModalVisible('ninguno');
      setFormEmpresa({ nombre_empresa: '', usuario: '', password: '' });
      fetchData();
    } else alert(error.message);
  };

  const abrirEdicionCurso = (curso: Curso) => {
    setCursoEditandoId(curso.id);
    
    const temarioUI = (curso.temario || []).map(m => ({
      modulo: m.modulo,
      temas: m.temas.map((t: Tema | string) => typeof t === 'string' ? { titulo: t, material_url: '' } : t)
    }));

    setFormCurso({
      nombre: curso.nombre,
      ubicacion: curso.ubicacion,
      fecha_curso: curso.fecha_curso,
      temario: temarioUI
    });
    setModalVisible('curso');
  };

  const handleGuardarAlumno = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('estudiantes').insert([{
      ...formAlumno,
      empresa_id: formAlumno.empresa_id === '' ? null : formAlumno.empresa_id,
      pago_completado: false,
      progreso: 0,
      evidencias: [],
      temas_completados: [] 
    }]);
    if (!error) {
      setModalVisible('ninguno');
      setFormAlumno({ nombre_completo: '', usuario: '', password: '', curso_id: '', empresa_id: '' });
      setVistaActiva('Alumnos'); 
      fetchData();
    } else alert(error.message);
  };

  const handleVincularCurso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alumnoEditando) return;

    const { error } = await supabase.from('estudiantes').insert([{
      nombre_completo: alumnoEditando.nombre_completo,
      usuario: alumnoEditando.usuario,
      password: alumnoEditando.password,
      empresa_id: alumnoEditando.empresa_id,
      curso_id: formAlumno.curso_id,
      pago_completado: false,
      progreso: 0,
      evidencias: [],
      temas_completados: [] 
    }]);

    if (!error) {
      setModalVisible('ninguno');
      fetchData();
      alert(`¡${alumnoEditando.nombre_completo} fue inscrito al nuevo curso exitosamente!`);
    } else alert(error.message);
  };

  const handleToggleTema = (temaTitulo: string) => {
    if (!alumnoEditando) return;
    
    const cursoAsignado = cursos.find(c => c.id === alumnoEditando.curso_id);
    if (!cursoAsignado) return;

    let nuevosTemas = [...(alumnoEditando.temas_completados || [])];
    if (nuevosTemas.includes(temaTitulo)) {
      nuevosTemas = nuevosTemas.filter(t => t !== temaTitulo);
    } else {
      nuevosTemas.push(temaTitulo);
    }

    const totalTemas = cursoAsignado.temario.reduce((acc, mod) => acc + mod.temas.length, 0);
    const nuevoProgreso = totalTemas === 0 ? 0 : Math.round((nuevosTemas.length / totalTemas) * 100);

    setAlumnoEditando({ ...alumnoEditando, temas_completados: nuevosTemas, progreso: nuevoProgreso });
  };

  const handleActualizarProgreso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alumnoEditando) return;
    const { error } = await supabase.from('estudiantes').update({
      progreso: alumnoEditando.progreso,
      pago_completado: alumnoEditando.pago_completado,
      temas_completados: alumnoEditando.temas_completados 
    }).eq('id', alumnoEditando.id);

    if (!error) {
      setModalVisible('ninguno');
      fetchData();
      alert("Progreso del alumno guardado con éxito.");
    } else alert(error.message);
  };

  const handleUploadEvidencia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !alumnoEditando) return;
    try {
      setUploading(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `academia/${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('disenos').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('disenos').getPublicUrl(fileName);
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

  // NUEVO: Función para eliminar foto específica
  const handleEliminarEvidencia = async (urlAEliminar: string) => {
    if (!alumnoEditando || !confirm("¿Seguro que deseas eliminar esta foto?")) return;

    try {
      // Quitamos la URL de la lista
      const nuevasEvidencias = alumnoEditando.evidencias.filter(url => url !== urlAEliminar);

      // Actualizamos la base de datos
      const { error: updateError } = await supabase
        .from('estudiantes')
        .update({ evidencias: nuevasEvidencias })
        .eq('id', alumnoEditando.id);
      
      if (updateError) throw updateError;

      // Opcional: Borrar la imagen física del storage para ahorrar espacio
      try {
        const path = urlAEliminar.split('/public/disenos/')[1];
        if (path) {
          await supabase.storage.from('disenos').remove([path]);
        }
      } catch (storageError) {
        console.log("No se pudo borrar físicamente del storage, pero sí de la base de datos.", storageError);
      }

      setAlumnoEditando({ ...alumnoEditando, evidencias: nuevasEvidencias });
      fetchData();
    } catch (error: unknown) {
      if (error instanceof Error) {
         alert("Error al eliminar imagen: " + error.message);
      }
    }
  };

  const getNombreCurso = (id: string) => cursos.find(c => c.id === id)?.nombre || 'Curso Desconocido';
  const getCursoObj = (id: string) => cursos.find(c => c.id === id) || null;
  const getNombreEmpresa = (id: string | null) => id ? empresas.find(e => e.id === id)?.nombre_empresa : 'Particular';

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
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button onClick={() => { setFormEmpresa({ nombre_empresa: '', usuario: '', password: '' }); setModalVisible('empresa'); }} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-3 rounded-xl font-bold transition-all text-[10px] uppercase tracking-widest flex items-center gap-2">
            <BuildingOfficeIcon className="h-4 w-4" /> Nueva Empresa
          </button>
          <button onClick={() => { setCursoEditandoId(null); setFormCurso({ nombre: '', ubicacion: 'Pache 360 Studio', fecha_curso: '', temario: [] }); setModalVisible('curso'); }} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-xl font-bold transition-all text-[10px] uppercase tracking-widest flex items-center gap-2">
            <PlusIcon className="h-4 w-4" /> Nuevo Curso
          </button>
          <button onClick={() => setModalVisible('alumno')} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-600/20 text-[10px] uppercase tracking-widest flex items-center gap-2">
            <PlusIcon className="h-4 w-4" /> Nuevo Alumno
          </button>
        </div>
      </header>

      <div className="flex bg-[#111] p-1.5 rounded-2xl w-full max-w-xl mb-8 border border-gray-800/50">
        <button onClick={() => setVistaActiva('Alumnos')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${vistaActiva === 'Alumnos' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-gray-500 hover:text-gray-300'}`}>
          <UserGroupIcon className="h-4 w-4" /> Alumnos
        </button>
        <button onClick={() => setVistaActiva('Cursos')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${vistaActiva === 'Cursos' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-gray-500 hover:text-gray-300'}`}>
          <FolderOpenIcon className="h-4 w-4" /> Cursos
        </button>
        <button onClick={() => setVistaActiva('Empresas')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${vistaActiva === 'Empresas' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-gray-500 hover:text-gray-300'}`}>
          <BuildingOfficeIcon className="h-4 w-4" /> Empresas / RH
        </button>
      </div>

      {vistaActiva === 'Alumnos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {estudiantes.map(alumno => (
            <div key={alumno.id} className="bg-[#111] border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button 
                  onClick={() => { setAlumnoEditando(alumno); setFormAlumno({...formAlumno, curso_id: ''}); setModalVisible('vincular'); }}
                  className="bg-black p-2 rounded-xl border border-gray-700 hover:border-green-500 hover:text-green-400 transition-colors shadow-lg"
                  title="Inscribir a otro curso"
                >
                  <DocumentPlusIcon className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => { setAlumnoEditando(alumno); setModalVisible('progreso'); }}
                  className="bg-black p-2 rounded-xl border border-gray-700 hover:border-cyan-500 hover:text-cyan-400 transition-colors shadow-lg"
                  title="Gestionar Progreso"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleEliminarAlumno(alumno.id)}
                  className="bg-black p-2 rounded-xl border border-gray-700 hover:border-red-500 hover:text-red-400 transition-colors shadow-lg"
                  title="Eliminar Alumno"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-4 pr-24">
                <h3 className="text-xl font-black uppercase italic truncate">{alumno.nombre_completo}</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">User: {alumno.usuario}</p>
              </div>

              <div className="bg-black border border-gray-800 rounded-xl p-3 mb-4 flex justify-between items-center">
                <div>
                    <p className="text-[8px] text-cyan-500 font-black uppercase">Empresa</p>
                    <p className="text-[10px] font-bold truncate max-w-25">{getNombreEmpresa(alumno.empresa_id)}</p>
                </div>
                <div className="text-right">
                    <p className="text-[8px] text-purple-500 font-black uppercase">Curso</p>
                    <p className="text-[10px] font-bold truncate max-w-25">{getNombreCurso(alumno.curso_id)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    <span>Progreso General</span>
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
      )}

      {vistaActiva === 'Cursos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {cursos.map(curso => (
            <div key={curso.id} className="bg-[#111] border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-purple-500/40 transition-all flex flex-col">
              
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button 
                  onClick={() => abrirEdicionCurso(curso)}
                  className="bg-black p-2 rounded-xl border border-gray-700 hover:border-purple-500 hover:text-purple-400 transition-colors shadow-lg"
                  title="Editar Curso"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleEliminarCurso(curso.id)}
                  className="bg-black p-2 rounded-xl border border-gray-700 hover:border-red-500 hover:text-red-400 transition-colors shadow-lg"
                  title="Eliminar Curso"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-4 pr-20">
                <h3 className="text-xl font-black uppercase italic text-purple-400">{curso.nombre}</h3>
                <p className="text-[10px] text-gray-500 uppercase font-black mt-1">{curso.temario?.length || 0} Módulos Registrados</p>
              </div>

              <div className="mt-auto space-y-2 bg-black border border-gray-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-gray-500">Ubicación:</span>
                  <span className="text-gray-300">{curso.ubicacion}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-gray-500">Fecha:</span>
                  <span className="text-gray-300">{curso.fecha_curso}</span>
                </div>
              </div>
            </div>
          ))}
          {cursos.length === 0 && !loading && (
            <div className="col-span-full text-center py-20 text-gray-600 font-black uppercase tracking-widest italic border border-dashed border-gray-800 rounded-3xl">
              Aún no hay cursos creados
            </div>
          )}
        </div>
      )}

      {vistaActiva === 'Empresas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {empresas.map(emp => (
            <div key={emp.id} className="bg-[#111] border border-gray-800 rounded-3xl p-6 relative">
              <button 
                onClick={() => handleEliminarEmpresa(emp.id)} 
                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-colors"
                title="Eliminar Empresa"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <BuildingOfficeIcon className="h-8 w-8 text-orange-500" />
                <h3 className="text-xl font-black uppercase italic truncate">{emp.nombre_empresa}</h3>
              </div>
              <div className="bg-black p-4 rounded-2xl border border-gray-800 space-y-2">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-2 border-b border-gray-800 pb-1">Acceso Portal RH</p>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Usuario:</span>
                  <span className="font-mono text-orange-400 font-bold">{emp.usuario}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Alumnos Vinculados:</span>
                  <span className="font-bold text-white">{estudiantes.filter(e => e.empresa_id === emp.id).length}</span>
                </div>
              </div>
            </div>
          ))}
          {empresas.length === 0 && !loading && (
            <div className="col-span-full text-center py-20 text-gray-600 font-black uppercase tracking-widest italic border border-dashed border-gray-800 rounded-3xl">
              Aún no hay empresas registradas
            </div>
          )}
        </div>
      )}

      {modalVisible !== 'ninguno' && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#111] border border-cyan-500/30 w-full max-w-lg rounded-t-4xl sm:rounded-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#161616]">
              <h2 className="text-lg font-black text-cyan-400 uppercase italic">
                {modalVisible === 'curso' ? (cursoEditandoId ? 'Editar Curso' : 'Crear Nuevo Curso') 
                 : modalVisible === 'alumno' ? 'Registrar Alumno' 
                 : modalVisible === 'empresa' ? 'Nueva Empresa RH' 
                 : modalVisible === 'vincular' ? 'Inscribir a Curso'
                 : 'Gestionar Avance'}
              </h2>
              <button onClick={() => setModalVisible('ninguno')}><XMarkIcon className="h-6 w-6 text-gray-500" /></button>
            </div>

            <div className="overflow-y-auto p-6 md:p-8">
              
              {/* MODAL VINCULAR A NUEVO CURSO */}
              {modalVisible === 'vincular' && alumnoEditando && (
                <form onSubmit={handleVincularCurso} className="space-y-4">
                  <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-xl mb-4">
                    <p className="text-xs text-green-400 font-bold mb-1">Nueva Inscripción</p>
                    <p className="text-[10px] text-gray-400">Inscribirás a <span className="text-white font-bold">{alumnoEditando.nombre_completo}</span> en un nuevo curso. Su usuario y contraseña seguirán siendo los mismos para que pueda ver todos sus cursos en un solo panel.</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Selecciona el Nuevo Curso</label>
                    <select required value={formAlumno.curso_id} onChange={e => setFormAlumno({...formAlumno, curso_id: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-green-500 outline-none">
                      <option value="">Selecciona un curso...</option>
                      {cursos
                        .filter(c => !estudiantes.some(e => e.usuario === alumnoEditando.usuario && e.curso_id === c.id))
                        .map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.fecha_curso})</option>)
                      }
                    </select>
                  </div>
                  <button className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl text-white font-black uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95 mt-4">Inscribir Alumno</button>
                </form>
              )}

              {/* MODAL EMPRESA */}
              {modalVisible === 'empresa' && (
                <form onSubmit={handleGuardarEmpresa} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Nombre de la Empresa</label>
                    <input required value={formEmpresa.nombre_empresa} onChange={e => setFormEmpresa({...formEmpresa, nombre_empresa: e.target.value})} type="text" className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-orange-500 outline-none" placeholder="Ej: Constructora del Sur" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Usuario RH (Login)</label>
                    <input required value={formEmpresa.usuario} onChange={e => setFormEmpresa({...formEmpresa, usuario: e.target.value})} type="text" className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-orange-500 outline-none" placeholder="Ej: recursoshumanos" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Contraseña RH</label>
                    <input required value={formEmpresa.password} onChange={e => setFormEmpresa({...formEmpresa, password: e.target.value})} type="text" className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-orange-500 outline-none" placeholder="Contraseña segura" />
                  </div>
                  <button className="w-full bg-orange-600 hover:bg-orange-500 py-4 rounded-xl text-white font-black uppercase text-xs tracking-widest mt-4">Guardar Empresa</button>
                </form>
              )}

              {/* MODAL CURSO */}
              {modalVisible === 'curso' && (
                <form onSubmit={handleGuardarCurso} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
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
                  </div>

                  <div className="border-t border-gray-800 pt-4 mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                        Temario / Módulos
                      </label>
                      <button 
                        type="button" 
                        onClick={() => setFormCurso({...formCurso, temario: [...formCurso.temario, { modulo: '', temas: [{titulo: '', material_url: ''}] }]})}
                        className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-700 flex items-center gap-1 transition-all"
                      >
                        <PlusIcon className="h-3 w-3" /> Añadir Módulo
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {formCurso.temario.map((mod, modIndex) => (
                        <div key={modIndex} className="bg-black border border-gray-800 p-5 rounded-2xl relative">
                          <button 
                            type="button" 
                            onClick={() => {
                              const nuevoTemario = [...formCurso.temario];
                              nuevoTemario.splice(modIndex, 1);
                              setFormCurso({...formCurso, temario: nuevoTemario});
                            }}
                            className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-colors"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                          
                          <input 
                            required 
                            placeholder="Nombre del Módulo (Ej: Módulo 1)" 
                            value={mod.modulo}
                            onChange={(e) => {
                              const nuevoTemario = [...formCurso.temario];
                              nuevoTemario[modIndex].modulo = e.target.value;
                              setFormCurso({...formCurso, temario: nuevoTemario});
                            }}
                            className="w-11/12 bg-transparent border-b border-gray-800 mb-4 pb-2 outline-none text-sm font-bold text-cyan-400 focus:border-cyan-500" 
                          />

                          <div className="space-y-3 pl-4 border-l border-gray-800">
                            {mod.temas.map((tema, temaIndex) => (
                              <div key={temaIndex} className="flex flex-col gap-2 relative group bg-[#111] p-3 rounded-xl border border-gray-800">
                                <div className="flex gap-2">
                                  <input 
                                    required 
                                    placeholder="Nombre del Tema (Ej: Tipos de brocas)" 
                                    value={tema.titulo}
                                    onChange={(e) => {
                                      const nuevoTemario = [...formCurso.temario];
                                      nuevoTemario[modIndex].temas[temaIndex].titulo = e.target.value;
                                      setFormCurso({...formCurso, temario: nuevoTemario});
                                    }}
                                    className="flex-1 bg-transparent outline-none text-xs text-white" 
                                  />
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      const nuevoTemario = [...formCurso.temario];
                                      nuevoTemario[modIndex].temas.splice(temaIndex, 1);
                                      setFormCurso({...formCurso, temario: nuevoTemario});
                                    }}
                                    className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 border-t border-gray-800 pt-2">
                                  <LinkIcon className="h-3 w-3 text-gray-500" />
                                  <input 
                                    placeholder="URL Material de Apoyo (Video, PDF) - Opcional" 
                                    value={tema.material_url}
                                    onChange={(e) => {
                                      const nuevoTemario = [...formCurso.temario];
                                      nuevoTemario[modIndex].temas[temaIndex].material_url = e.target.value;
                                      setFormCurso({...formCurso, temario: nuevoTemario});
                                    }}
                                    className="flex-1 bg-transparent outline-none text-[10px] text-cyan-500" 
                                  />
                                </div>
                              </div>
                            ))}
                            
                            <button 
                              type="button" 
                              onClick={() => {
                                const nuevoTemario = [...formCurso.temario];
                                nuevoTemario[modIndex].temas.push({titulo: '', material_url: ''});
                                setFormCurso({...formCurso, temario: nuevoTemario});
                              }}
                              className="text-[10px] font-bold text-gray-500 hover:text-cyan-400 uppercase tracking-widest flex items-center gap-1 pt-2"
                            >
                              <PlusIcon className="h-3 w-3" /> Añadir Tema
                            </button>
                          </div>
                        </div>
                      ))}
                      {formCurso.temario.length === 0 && (
                        <p className="text-[10px] text-gray-600 italic text-center py-4">No has agregado módulos. Haz clic en &quot;Añadir Módulo&quot;.</p>
                      )}
                    </div>
                  </div>

                  <button className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-xl text-white font-black uppercase text-xs tracking-widest mt-6 shadow-lg active:scale-95 transition-all">Guardar Curso</button>
                </form>
              )}

              {/* MODAL ALUMNO */}
              {modalVisible === 'alumno' && (
                <form onSubmit={handleGuardarAlumno} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Nombre Completo</label>
                    <input required value={formAlumno.nombre_completo} onChange={e => setFormAlumno({...formAlumno, nombre_completo: e.target.value})} type="text" className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-cyan-500 outline-none" placeholder="Juan Pérez" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Nombre de Usuario (Login)</label>
                    <input required value={formAlumno.usuario} onChange={e => setFormAlumno({...formAlumno, usuario: e.target.value})} type="text" className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-cyan-500 outline-none" placeholder="Ej: juanperez" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Contraseña</label>
                    <input required value={formAlumno.password} onChange={e => setFormAlumno({...formAlumno, password: e.target.value})} type="text" className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-cyan-500 outline-none" placeholder="Secreta123" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Asignar a Curso</label>
                    <select required value={formAlumno.curso_id} onChange={e => setFormAlumno({...formAlumno, curso_id: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-cyan-500 outline-none">
                      <option value="">Selecciona un curso...</option>
                      {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.fecha_curso})</option>)}
                    </select>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-800 mt-2">
                    <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest block mb-2">¿Pertenece a alguna Empresa? (Opcional)</label>
                    <select value={formAlumno.empresa_id} onChange={e => setFormAlumno({...formAlumno, empresa_id: e.target.value})} className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-orange-500 outline-none">
                      <option value="">No, es alumno particular</option>
                      {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre_empresa}</option>)}
                    </select>
                  </div>

                  <button className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-xl text-white font-black uppercase text-xs tracking-widest mt-4">Registrar Alumno</button>
                </form>
              )}

              {/* MODAL PROGRESO */}
              {modalVisible === 'progreso' && alumnoEditando && (
                <form onSubmit={handleActualizarProgreso} className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Progreso Calculado</label>
                      <span className="text-lg font-black text-white">{alumnoEditando.progreso}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${alumnoEditando.progreso}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-black/50 p-4 rounded-2xl border border-gray-800 max-h-80 overflow-y-auto space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                      <ListBulletIcon className="h-4 w-4" /> Temario del Curso
                    </label>
                    
                    {getCursoObj(alumnoEditando.curso_id)?.temario?.map((mod, i) => (
                      <div key={i}>
                        <h4 className="text-xs font-bold text-cyan-500 uppercase italic mb-2">{mod.modulo}</h4>
                        <div className="space-y-2 pl-2">
                          {mod.temas.map((temaRaw: Tema | string, j: number) => {
                            const tituloTema = typeof temaRaw === 'string' ? temaRaw : temaRaw.titulo;
                            const isChecked = alumnoEditando.temas_completados?.includes(tituloTema);

                            return (
                              <label key={j} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isChecked ? 'bg-cyan-600 border-cyan-600' : 'border-gray-600 group-hover:border-cyan-500'}`}>
                                  {isChecked && <CheckBadgeIcon className="w-3 h-3 text-white" />}
                                </div>
                                <input 
                                  type="checkbox" 
                                  className="hidden" 
                                  checked={isChecked || false}
                                  onChange={() => handleToggleTema(tituloTema)}
                                />
                                <span className={`text-xs ${isChecked ? 'text-gray-300 line-through opacity-70' : 'text-gray-100'}`}>{tituloTema}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                    {!getCursoObj(alumnoEditando.curso_id)?.temario?.length && (
                      <p className="text-[10px] text-gray-600 italic">El curso asignado no tiene un temario registrado.</p>
                    )}
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

                    {/* FOTOS DE EVIDENCIA CON BOTON DE ELIMINAR */}
                    {alumnoEditando.evidencias && alumnoEditando.evidencias.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {alumnoEditando.evidencias.map((url, i) => (
                          <div key={i} className="aspect-square relative rounded-lg overflow-hidden bg-gray-900 border border-gray-800 group">
                            <Image src={url} alt="Evidencia" fill className="object-cover" />
                            <button
                              type="button" // IMPORTANTE PARA NO ENVIAR EL FORM
                              onClick={() => handleEliminarEvidencia(url)}
                              className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-500"
                              title="Eliminar foto"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-xl text-white font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Guardar Cambios</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}