'use client';
import { useState, useEffect } from 'react';
import InputForm from '../../components/InputForm';
import ResultsCard from '../../components/ResultsCard';
import dynamic from 'next/dynamic';

// Importar HQChart dinámicamente para evitar errores de SSR
const HQChart = dynamic(
  () => import('../../components/HQChart'),
  { 
    ssr: false,
    loading: () => <div className="p-4 bg-gray-100 rounded animate-pulse">Cargando gráfico...</div>
  }
);

// Función para interpolación lineal
function interpolate(x: number, points: Array<{Q: number, [key: string]: any}>, yKey: string = 'H') {
  if (!points || points.length === 0) return 0;
  if (points.length === 1) return points[0][yKey];
  
  const sortedPoints = [...points].sort((a, b) => a.Q - b.Q);
  if (x <= sortedPoints[0].Q) return sortedPoints[0][yKey];
  if (x >= sortedPoints[sortedPoints.length - 1].Q) return sortedPoints[sortedPoints.length - 1][yKey];
  
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    if (x >= sortedPoints[i].Q && x <= sortedPoints[i + 1].Q) {
      const x0 = sortedPoints[i].Q;
      const x1 = sortedPoints[i + 1].Q;
      const y0 = sortedPoints[i][yKey];
      const y1 = sortedPoints[i + 1][yKey];
      return y0 + (y1 - y0) * ((x - x0) / (x1 - x0));
    }
  }
  return sortedPoints[sortedPoints.length - 1][yKey];
}

export default function Calculadora() {
  const [stations, setStations] = useState<any[]>([]);
  const [Q, setQ] = useState<number>(50);
  const [mode, setMode] = useState<'basico'|'avanzado'>('basico');
  const [pumps, setPumps] = useState<any[]>([]);
  const [selectedPumpId, setSelectedPumpId] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const [basicHeight, setBasicHeight] = useState<number>(50);

  useEffect(() => {
    setIsClient(true);
    
    fetch('/pumps.json')
      .then(r => {
        if (!r.ok) throw new Error('Error cargando bombas');
        return r.json();
      })
      .then(data => {
        setPumps(data);
        if (data.length > 0) {
          setSelectedPumpId(data[0].id || '');
        }
      })
      .catch(error => {
        console.error('Error cargando bombas:', error);
        setPumps([
          {
            id: 'pompa-1',
            marca: 'MarcaA',
            modelo: 'PA-100',
            curva: [{ Q: 0, H: 120 }, { Q: 50, H: 110 }, { Q: 100, H: 80 }],
            efficiency: [{ Q: 50, eta: 0.75 }],
            NPSHr: 3.5
          }
        ]);
        setSelectedPumpId('pompa-1');
      });
  }, []);

  function addStation(s: any) { 
    setStations(prev => [...prev, s]); 
  }
  
  function removeStation(i: number) { 
    setStations(prev => prev.filter((_, idx) => idx !== i)); 
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando calculadora...</p>
        </div>
      </div>
    );
  }

  const selectedPump = pumps.find(p => p.id === selectedPumpId);
  const resultados = (() => {
    // ... (código de cálculos que te envié anteriormente)
    // Mantén todo el código de cálculos que ya tienes
    let Hreq = mode === 'basico' ? basicHeight : 50;
    
    if (mode === 'avanzado' && stations.length > 0) {
      Hreq = stations.reduce((sum, s) => sum + (s.elevation || 0), 0);
    }
    
    let pumpH = 50;
    let pumpEfficiency = 0.75;
    
    if (selectedPump && selectedPump.curva) {
      pumpH = interpolate(Q, selectedPump.curva, 'H');
      if (selectedPump.efficiency && selectedPump.efficiency.length > 0) {
        const efficiencyValue = interpolate(Q, selectedPump.efficiency, 'eta');
        pumpEfficiency = efficiencyValue > 0 ? efficiencyValue : 0.75;
      }
    }
    
    const bombas = Math.ceil(Hreq / pumpH);
    const Q_m3s = Q / 1000;
    const kW = (1000 * 9.81 * Q_m3s * Hreq) / (1000 * pumpEfficiency);
    
    return { 
      Hreq: parseFloat(Hreq.toFixed(2)), 
      kW: parseFloat(kW.toFixed(2)), 
      bombas, 
      details: [],
      eficiencia: parseFloat((pumpEfficiency * 100).toFixed(1)),
      pumpH: parseFloat(pumpH.toFixed(2)),
      NPSHr: selectedPump?.NPSHr || 'N/A',
      marca: selectedPump?.marca || 'N/A',
      modelo: selectedPump?.modelo || 'N/A'
    };
  })();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Calculadora de Bombas</h1>
          <p className="text-gray-600 mt-2">Calcula los parámetros necesarios para tu sistema de bombeo</p>
        </header>

        <div className="flex flex-wrap gap-3 mb-6">
          <button onClick={() => setMode('basico')} className={`px-4 py-2 rounded-lg transition-colors ${mode === 'basico' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}>
            Modo básico
          </button>
          <button onClick={() => setMode('avanzado')} className={`px-4 py-2 rounded-lg transition-colors ${mode === 'avanzado' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}>
            Modo avanzado
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Parámetros del sistema</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Caudal (L/s)</label>
                  <input type="range" min="0" max="100" step="1" value={Q} onChange={e => setQ(+e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between mt-1">
                    <span className="text-sm text-gray-500">0</span>
                    <span className="text-sm text-gray-500">50</span>
                    <span className="text-sm text-gray-500">100</span>
                  </div>
                  <div className="mt-4">
                    <input type="number" value={Q} onChange={e => setQ(Math.min(100, Math.max(0, +e.target.value)))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" min="0" max="100" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar bomba</label>
                  <select value={selectedPumpId} onChange={e => setSelectedPumpId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    {pumps.map(pump => (
                      <option key={pump.id} value={pump.id}>{pump.marca} - {pump.modelo}</option>
                    ))}
                  </select>
                </div>
              </div>
              {mode === 'basico' && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Altura requerida total (m)</label>
                  <input type="number" value={basicHeight} onChange={e => setBasicHeight(Math.max(0, +e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" min="0" step="0.1" />
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Curva Característica de la Bomba</h2>
              <HQChart selectedPump={selectedPump} currentQ={Q} currentH={resultados.Hreq} requiredPumps={resultados.bombas} />
            </div>
          </div>
          <div className="space-y-6">
            <ResultsCard resultados={resultados} />
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Especificaciones</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Marca:</span>
                  <span className="font-semibold">{resultados.marca}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Modelo:</span>
                  <span className="font-semibold">{resultados.modelo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Altura por bomba:</span>
                  <span className="font-semibold">{resultados.pumpH} m</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Eficiencia:</span>
                  <span className="font-semibold">{resultados.eficiencia}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
