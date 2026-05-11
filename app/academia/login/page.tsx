'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

export default function AcademiaLogin() {
  const [usuario, setUsuario] = useState(''); // <-- CAMBIADO A USUARIO
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('usuario', usuario) // <-- BUSCAMOS POR EL NUEVO CAMPO
        .eq('password', password)
        .single();

      if (error || !data) {
        alert('Usuario o contraseña incorrectos.');
      } else {
        document.cookie = `pache_alumno_id=${encodeURIComponent(data.id)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
        router.push('/academia/dashboard');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111] border border-cyan-500/30 rounded-4xl p-8 shadow-2xl shadow-cyan-900/20">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-cyan-600 p-4 rounded-2xl mb-4 shadow-lg shadow-cyan-600/20">
            <AcademicCapIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black italic text-white tracking-tighter">ACADEMIA</h1>
          <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Pache 360 Studio</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2 block mb-1">Usuario de Acceso</label>
            <input 
              type="text" 
              required
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-cyan-500 outline-none transition-all"
              placeholder="Ej: juanperez"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2 block mb-1">Contraseña</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-cyan-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-xl text-white font-black uppercase text-xs tracking-widest mt-4 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Ingresar al Curso'}
          </button>
        </form>
      </div>
    </main>
  );
}