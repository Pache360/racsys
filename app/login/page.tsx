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

    // 1. VALIDACIÓN ADMIN
    if (user.toLowerCase() === 'admin' && pass === 'Locosa140295') {
      document.cookie = "pache_auth=admin; path=/; max-age=86400; SameSite=Strict";
      router.push('/');
      return;
    }

    // 2. VALIDACIÓN CLIENTE ESTRICTA
    // Buscamos que el nombre coincida Y la contraseña también
    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('nombre, acceso_pass, dueno_id')
      .eq('nombre', user) // El usuario DEBE escribir su nombre/marca
      .eq('acceso_pass', pass)
      .single();

    if (cliente) {
      // Si es una marca, usamos su propio nombre. Si es un dueño, usamos su nombre.
      const idParaCookie = cliente.nombre;
      
      document.cookie = "pache_auth=cliente; path=/; max-age=86400; SameSite=Strict";
      document.cookie = `pache_cliente_id=${encodeURIComponent(idParaCookie)}; path=/; max-age=86400; SameSite=Strict`;
      
      router.push('/portal');
    } else {
      alert('Error: Usuario o Contraseña incorrectos. Verifica que escribiste tu nombre tal cual aparece en el sistema.');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="bg-[#111] border border-purple-500/30 p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">PACHE<span className="text-purple-500">360</span></h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-2">Portal de Clientes</p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-600 uppercase ml-2 tracking-widest">Nombre de Usuario / Marca</label>
            <input 
              required
              type="text" 
              placeholder="Escribe tu nombre o marca" 
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-2xl p-4 outline-none focus:border-purple-500 text-white font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-600 uppercase ml-2 tracking-widest">Contraseña de Acceso</label>
            <input 
              required
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
            {loading ? 'Iniciando Sesión...' : 'Entrar al Portal'}
          </button>
        </div>
      </form>
    </main>
  );
}