'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Validación de tus credenciales
    if (user === 'admin' && pass === 'Locosa140295') {
      // Guardamos una marca en las cookies (dura 1 día)
      document.cookie = "pache_auth=true; path=/; max-age=86400; SameSite=Strict";
      router.push('/');
    } else {
      alert('Acceso Denegado: Credenciales incorrectas');
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="bg-[#111] border border-purple-500/30 p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black italic text-white uppercase">PACHE<span className="text-purple-500">360</span></h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2">Acceso Restringido</p>
        </div>
        
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="USUARIO" 
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="w-full bg-black border border-gray-800 rounded-2xl p-4 outline-none focus:border-purple-500 text-white font-bold"
          />
          <input 
            type="password" 
            placeholder="CONTRASEÑA" 
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="w-full bg-black border border-gray-800 rounded-2xl p-4 outline-none focus:border-purple-500 text-white font-bold"
          />
          <button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest shadow-lg shadow-purple-500/20">
            Entrar al Sistema
          </button>
        </div>
      </form>
    </main>
  );
}