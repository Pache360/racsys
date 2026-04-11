'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeftIcon, UserGroupIcon, PencilIcon, 
  TrashIcon, PhoneIcon, PlusIcon, XMarkIcon,
  BanknotesIcon, TagIcon
} from '@heroicons/react/24/outline';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // NUEVO: Estado para diferenciar si creamos Dueño o Marca
  const [tipoRegistro, setTipoRegistro] = useState<'Dueño' | 'Marca'>('Dueño');

  const [clientForm, setClientForm] = useState({
    nombre: '',
    contacto: '',
    presupuesto_total: 0,
    monto_pagado: 0,
    logo_url: '',
    acceso_pass: '', // Para el login del cliente
    dueno_id: ''     // Para vincular marcas a un dueño
  });

  const fetchClientes = async () => {
    const { data } = await supabase.from('clientes').select('*').order('nombre', { ascending: true });
    if (data) setClientes(data);
  };

  useEffect(() => { fetchClientes(); }, []);

  const handleOpenModal = (cliente?: any) => {
    if (cliente) {
      setEditId(cliente.id);
      setClientForm({
        nombre: cliente.nombre,
        contacto: cliente.contacto || '',
        presupuesto_total: cliente.presupuesto_total || 0,
        monto_pagado: cliente.monto_pagado || 0,
        logo_url: cliente.logo_url || '',
        acceso_pass: cliente.acceso_pass || '',
        dueno_id: cliente.dueno_id || ''
      });
    } else {
      setEditId(null);
      setClientForm({ nombre: '', contacto: '', presupuesto_total: 0, monto_pagado: 0, logo_url: '', acceso_pass: '', dueno_id: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = { 
      nombre: clientForm.nombre,
      marca: clientForm.nombre,
      contacto: clientForm.contacto,
      presupuesto_total: clientForm.presupuesto_total,
      monto_pagado: clientForm.monto_pagado,
      logo_url: clientForm.logo_url,
      acceso_pass: clientForm.acceso_pass,
      dueno_id: clientForm.dueno_id
    };

    const { error } = editId 
      ? await supabase.from('clientes').update(payload).eq('id', editId)
      : await supabase.from('clientes').insert([payload]);

    if (!error) {
      setIsModalOpen(false);
      fetchClientes();
    } else {
      alert("Error: " + error.message);
    }
    setIsSaving(false);
  };

  const deleteCliente = async (id: string) => {
    if (confirm('¿Eliminar registro?')) {
      await supabase.from('clientes').delete().eq('id', id);
      fetchClientes();
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      {/* NAVEGACIÓN */}
      <div className="mb-6 md:mb-8">
        <Link href="/" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-all w-fit text-[10px] md:text-xs font-bold uppercase tracking-widest">
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Volver al Dashboard</span>
        </Link>
      </div>

      {/* HEADER RESPONSIVO */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-cyan-600 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-lg shadow-cyan-600/20 italic">
            <UserGroupIcon className="h-6 w-6 md:h-8 md:w-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold italic uppercase tracking-tighter">Clientes y Marcas</h1>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-xs md:text-sm italic shadow-lg shadow-cyan-600/20"
        >
          <PlusIcon className="h-5 w-5" /> NUEVO REGISTRO
        </button>
      </header>

      {/* GRID DE CLIENTES / MARCAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {clientes.map((c) => {
          const restan = c.presupuesto_total - c.monto_pagado;
          const porcPago = c.presupuesto_total > 0 ? (c.monto_pagado / c.presupuesto_total) * 100 : 0;
          const esDueno = !c.dueno_id || c.dueno_id === '';
          
          return (
            <div key={c.id} className={`bg-[#111] border ${esDueno ? 'border-purple-500/20' : 'border-gray-800'} rounded-3xl p-5 md:p-6 hover:border-cyan-500/40 transition-all group relative shadow-2xl`}>
              {/* ACCIONES */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                <button onClick={() => handleOpenModal(c)} className="p-2 bg-gray-900 rounded-xl hover:text-cyan-400 border border-gray-800 transition-colors">
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button onClick={() => deleteCliente(c.id)} className="p-2 bg-gray-900 rounded-xl hover:text-red-500 border border-gray-800 transition-colors">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden font-black italic text-gray-500 shadow-inner shrink-0">
                  {c.logo_url ? <img src={c.logo_url} className="w-full h-full object-cover" /> : c.nombre[0]}
                </div>
                <div className="pr-12 sm:pr-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg md:text-xl uppercase italic leading-none truncate max-w-[120px]">{c.nombre}</h3>
                    <span className={`text-[7px] px-1.5 py-0.5 rounded-md border font-black ${esDueno ? 'border-purple-500 text-purple-400 bg-purple-500/10' : 'border-gray-600 text-gray-500'}`}>
                      {esDueno ? 'DUEÑO' : 'MARCA'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 mt-2">
                    <PhoneIcon className="h-3 w-3 text-cyan-500" />
                    <span className="text-[10px] md:text-[11px] font-bold tracking-widest">{c.contacto || 'SIN CONTACTO'}</span>
                  </div>
                </div>
              </div>

              {!esDueno && (
                <div className="mb-4 flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-gray-800">
                  <TagIcon className="h-3 w-3 text-purple-500" />
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Pertenece a ID: {c.dueno_id}</span>
                </div>
              )}

              <div className="pt-4 border-t border-gray-800/50 space-y-4">
                <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500">
                  <span>Balance de Pagos</span>
                  <span className={restan <= 0 ? "text-green-400" : "text-red-400"}>
                    {restan <= 0 ? "PAGADO" : `RESTAN: $${restan}`}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                  <div className="h-full bg-cyan-500 transition-all duration-1000" style={{ width: `${Math.min(porcPago, 100)}%` }}></div>
                </div>
                <div className="flex justify-between font-mono text-[10px] md:text-xs">
                  <span className="text-gray-500">ABONADO: ${c.monto_pagado}</span>
                  <span className="text-cyan-400 font-bold">TOTAL: ${c.presupuesto_total}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE EDICIÓN / AGREGAR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#111] border border-cyan-500/30 w-full max-w-md rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border-t-4 border-t-cyan-500 max-h-[95vh] flex flex-col">
            <div className="p-6 md:p-8 flex flex-col gap-4 bg-[#161616]">
              <div className="flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-black text-cyan-400 uppercase italic tracking-tighter">
                  {editId ? 'Editar Registro' : 'Nuevo Registro'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <XMarkIcon className="h-6 w-6 md:h-7 md:w-7 text-gray-500" />
                </button>
              </div>
              
              {/* SELECTOR DE TIPO */}
              <div className="flex gap-2 bg-black p-1 rounded-xl">
                {['Dueño', 'Marca'].map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setTipoRegistro(tipo as any)}
                    className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${tipoRegistro === tipo ? 'bg-cyan-600 text-white' : 'text-gray-500'}`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSave} className="px-6 md:px-8 pb-8 space-y-4 md:space-y-5 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[9px] md:text-[10px] font-black text-gray-600 uppercase ml-2 tracking-widest">Nombre del {tipoRegistro}</label>
                <input required placeholder={tipoRegistro === 'Dueño' ? "Ej: Juan Pérez" : "Ej: Terra Constructora"} type="text" value={clientForm.nombre} onChange={e => setClientForm({...clientForm, nombre: e.target.value})} className="w-full bg-[#0d0d0d] border border-gray-800 rounded-2xl p-4 outline-none focus:border-cyan-500 transition-all text-sm font-bold text-white" />
              </div>

              {tipoRegistro === 'Dueño' ? (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[9px] md:text-[10px] font-black text-purple-500 uppercase ml-2 tracking-widest">Contraseña para el Portal</label>
                  <input placeholder="Ej: Juan2026" type="text" value={clientForm.acceso_pass} onChange={e => setClientForm({...clientForm, acceso_pass: e.target.value})} className="w-full bg-[#0d0d0d] border border-purple-900/30 rounded-2xl p-4 outline-none focus:border-purple-500 text-sm text-white" />
                </div>
              ) : (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[9px] md:text-[10px] font-black text-orange-500 uppercase ml-2 tracking-widest">ID del Dueño (Para vincular)</label>
                  <select 
                    value={clientForm.dueno_id} 
                    onChange={e => setClientForm({...clientForm, dueno_id: e.target.value})}
                    className="w-full bg-[#0d0d0d] border border-orange-900/30 rounded-2xl p-4 outline-none focus:border-orange-500 text-sm text-white"
                  >
                    <option value="">Selecciona al Dueño...</option>
                    {clientes.filter(c => !c.dueno_id).map(d => (
                      <option key={d.id} value={d.acceso_pass}>{d.nombre} (Pass: {d.acceso_pass})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] md:text-[10px] font-black text-gray-600 uppercase ml-2 tracking-widest">Contacto / WhatsApp</label>
                <input placeholder="Ej: 951 123 4567" type="text" value={clientForm.contacto} onChange={e => setClientForm({...clientForm, contacto: e.target.value})} className="w-full bg-[#0d0d0d] border border-gray-800 rounded-2xl p-4 outline-none focus:border-cyan-500 transition-all text-sm text-white" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] md:text-[10px] font-black text-cyan-500 uppercase ml-2 tracking-widest">Precio</label>
                  <input type="number" value={clientForm.presupuesto_total} onChange={e => setClientForm({...clientForm, presupuesto_total: Number(e.target.value)})} className="w-full bg-[#0d0d0d] border border-cyan-900/30 rounded-2xl p-4 outline-none focus:border-cyan-500 text-sm font-mono text-cyan-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] md:text-[10px] font-black text-green-500 uppercase ml-2 tracking-widest">Abono</label>
                  <input type="number" value={clientForm.monto_pagado} onChange={e => setClientForm({...clientForm, monto_pagado: Number(e.target.value)})} className="w-full bg-[#0d0d0d] border border-green-900/30 rounded-2xl p-4 outline-none focus:border-green-500 text-sm font-mono text-green-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] md:text-[10px] font-black text-gray-600 uppercase ml-2 tracking-widest">URL Logo / Imagen</label>
                <input placeholder="https://..." type="text" value={clientForm.logo_url} onChange={e => setClientForm({...clientForm, logo_url: e.target.value})} className="w-full bg-[#0d0d0d] border border-gray-800 rounded-2xl p-4 outline-none focus:border-cyan-500 text-sm text-white" />
              </div>
              
              <button disabled={isSaving} className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 md:py-5 rounded-2xl sm:rounded-[3xl] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-cyan-900/20 active:scale-95 text-xs md:text-sm text-white">
                {isSaving ? 'GUARDANDO...' : (editId ? 'ACTUALIZAR' : 'REGISTRAR')}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}