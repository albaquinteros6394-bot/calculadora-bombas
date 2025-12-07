'use client';
import { useState, useEffect } from 'react';
import InputForm from '../../components/InputForm';
import ResultsCard from '../../components/ResultsCard';
import HQChart from '../../components/HQChart';

export default function Calculadora() {
  const [stations, setStations] = useState<any[]>([]);
  const [Q, setQ] = useState<number>(50); // L/s
  const [mode, setMode] = useState<'basico'|'avanzado'>('basico');
  const [pumps, setPumps] = useState<any[]>([]);
  const [selectedPumpId, setSelectedPumpId] = useState<string>('');

  useEffect(() => {
    fetch('/pumps.json')
      .then(r => r.json())
      .then(data => {
        setPumps(data);
        setSelectedPumpId(data[0]?.id || '');
      });
  }, []);

  function addStation(s: any) { setStations(prev => [...prev, s]); }
  function removeStation(i: number) { setStations(prev => prev.filter((_, idx) => idx !== i)); }

  // Cálculos simplificados, ahora solo en cliente
  const resultados = (() => {
    if(mode === 'basico') {
      const pump = pumps.find(p => p.id === selectedPumpId);
      const Hreq = 50; // valor por defecto para presentación
      const bombas = pump ? Math.ceil(Hreq / (pump.curva?.[0]?.H || 50)) : Math.ceil(Hreq / 50);
      const kW = (1000 * 9.81 * (Q / 1000) * Hreq) / 1000;
      return { Hreq, kW, bombas, details: [] };
    } else {
      let totalLoss = 0; let details: any[] = [];
      stations.forEach(s => {
        const hf = (s.elevation || 0) + (s.K || 0); // simplificación
        totalLoss += hf;
        details.push({ ...s, hf });
      });
      const Hreq = totalLoss || 50;
      const kW = (1000 * 9.81 * (Q / 1000) * Hreq) / 1000;
      const pump = pumps.find(p => p.id === selectedPumpId);
      const bombas = Math.ceil(Hreq / (pump?.curva?.[0]?.H || 50));
      return { Hreq, kW, bombas, details };
    }
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setMode('basico')} className={`px-3 py-2 rounded ${mode==='basico'?'bg-blue-600 text-white':'border'}`}>Modo básico</button>
        <button onClick={() => setMode('avanzado')} className={`px-3 py-2 rounded ${mode==='avanzado'?'bg-blue-600 text-white':'border'}`}>Modo avanzado</button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded shadow">
            <label className="block">Caudal (L/s)</label>
            <input type="number" value={Q} onChange={e => setQ(+e.target.value)} className="border p-2 rounded w-full" />
            {mode==='basico' && (
              <>
                <label className="mt-3 block">Altura requerida (m)</label>
                <input type="number" defaultValue={50} className="border p-2 rounded w-full" />
              </>
            )}
            {mode==='avanzado' && (
              <>
                <InputForm onAdd={addStation} />
                <div className="mt-3">
                  <h4 className="font-semibold">Tramos añadidos</h4>
                  <ul>
                    {stations.map((s, i) => (
                      <li key={i} className="flex justify-between items-center border p-2 rounded mt-2">
                        <div><strong>{s.name}</strong> L={s.L}m D={s.D}m</div>
                        <div><button className="text-sm text-red-600" onClick={() => removeStation(i)}>Eliminar</button></div>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          <div className="bg-white p-4 rounded shadow">
            <label>Seleccionar bomba</label>
            <select className="border p

