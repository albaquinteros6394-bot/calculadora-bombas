'use client';
import { useState } from 'react';

export default function InputForm({ onAdd }:{onAdd:any}) {
  const [s,setS] = useState({ name:'Tramo', L:100, D:0.1, K:0, elevation:0, eps:4.6e-5 });
  return (
    <div>
      <h4 className="font-semibold">Agregar tramo</h4>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <input className="p-2 border rounded" value={s.name} onChange={e=>setS({...s,name:e.target.value})} />
        <input type="number" className="p-2 border rounded" value={s.L} onChange={e=>setS({...s,L:+e.target.value})} placeholder="Longitud (m)" />
        <input type="number" className="p-2 border rounded" value={s.D} onChange={e=>setS({...s,D:+e.target.value})} placeholder="Diámetro (m)" />
        <input type="number" className="p-2 border rounded" value={s.K} onChange={e=>setS({...s,K:+e.target.value})} placeholder="K local" />
        <input type="number" className="p-2 border rounded" value={s.elevation} onChange={e=>setS({...s,elevation:+e.target.value})} placeholder="Elevación (m)" />
        <div></div>
      </div>
      <button className="mt-3 bg-blue-600 text-white px-3 py-2 rounded" onClick={()=>{ onAdd(s); setS({ name:'Tramo', L:100, D:0.1, K:0, elevation:0, eps:4.6e-5 });}}>Agregar tramo</button>
    </div>
  );
}
