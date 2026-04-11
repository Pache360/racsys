'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. VALIDACIÓN PARA TI (ADMIN)
    if (user === 'admin' && pass === 'Locosa140295') {
      document.cookie = "pache_auth=admin; path=/; max-age=86400; SameSite=Strict";
      router.push('/');
      return;
    }

    // 2. VALIDACIÓN PARA CLIENTES (NUEVA)
    // Buscamos en la tabla clientes si el 'user' coincide con el nombre y 'pass' con acceso_pass
    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('nombre, acceso_pass, dueno_id')
      .eq('acceso_pass', pass)
      .limit(1)
      .single();

    if (cliente) {
      // Guardamos en la cookie el nombre del dueño o de la marca para filtrar después
      const identifier = cliente.dueno_id || cliente.nombre;
      document.cookie = `pache_auth=cliente; path=/; max-age=86400; SameSite=Strict`;
      document.cookie = `pache_cliente_id=${identifier}; path=/; max-age=86400; SameSite=Strict`;
      
      router.push('/portal'); // Ruta nueva para clientes
    } else {
      alert('Acceso Denegado: Credenciales incorrectas');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="bg-[#111] border border-purple-500/30 p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">PACHE<span className="text-purple-500">360</span></h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2">Acceso al Sistema</p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-600 uppercase ml-2 tracking-widest">Usuario / Marca</label>
            <input 
              type="text" 
              placeholder="Ej: admin o nombre de marca" 
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-2xl p-4 outline-none focus:border-purple-500 text-white font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-600 uppercase ml-2 tracking-widest">Código de Acceso</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-2xl p-4 outline-none focus:border-purple-500 text-white font-bold"
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </div>
      </form>
    </main>
  );
}