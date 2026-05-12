'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

export default function AcademiaRHLogin() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // BUSCAMOS EN LA TABLA DE EMPRESAS, NO EN LA DE ESTUDIANTES
      const { data, error } = await supabase
        .from('empresas_rh')
        .select('*')
        .eq('usuario', usuario)
        .eq('password', password)
        .single();

      if (error || !data) {
        alert('Usuario o contraseña incorrectos. Verifica tus credenciales de Empresa.');
      } else {
        // Guardamos una cookie especial para RH
        document.cookie = `pache_rh_id=${encodeURIComponent(data.id)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
        router.push('/academia/rh/dashboard');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-900/20 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-[#111] border border-orange-500/30 rounded-4xl p-8 shadow-2xl shadow-orange-900/20 z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-orange-600 p-4 rounded-2xl mb-4 shadow-lg shadow-orange-600/20">
            <BuildingOfficeIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black italic text-white tracking-tighter">PORTAL RH</h1>
          <p className="text-orange-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Supervisión Empresarial</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2 block mb-1">Usuario RH</label>
            <input 
              type="text" 
              required
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-orange-500 outline-none transition-all"
              placeholder="Ej: rh_empresa"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2 block mb-1">Contraseña</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-orange-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 py-4 rounded-xl text-white font-black uppercase text-xs tracking-widest mt-4 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Acceder al Panel'}
          </button>
        </form>
      </div>
    </main>
  );
}