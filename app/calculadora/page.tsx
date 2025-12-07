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
  const [Q, setQ] = useState<number>(50); // L/s
  const [mode, setMode] = useState<'basico'|'avanzado'>('basico');
  const [pumps, setPumps] = useState<any[]>([]);
  const [selectedPumpId, setSelectedPumpId] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const [basicHeight, setBasicHeight] = useState<number>(50); // Altura para modo básico

  // Verificar que estamos en el cliente
  useEffect(() => {
    setIsClient(true);
    
    // Cargar datos de bombas
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
        // Datos de ejemplo en caso de error
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

  // Cálculos COMPLETOS con interpolación de la curva de la bomba
  const resultados = (() => {
    let Hreq = 0;
    let details: any[] = [];
    
    if (mode === 'basico') {
      Hreq = basicHeight;
    } else {
      // Calcular pérdidas en cada tramo (fórmula simplificada de Darcy-Weisbach)
      stations.forEach(s => {
        // Convertir caudal a m³/s para cálculos
        const Q_m3s = Q / 1000;
        // Diámetro en metros
        const D_m = s.D / 1000;
        // Área de la tubería en m²
        const area = Math.PI * Math.pow(D_m, 2) / 4;
        // Velocidad en m/s
        const velocity = Q_m3s / area;
        // Factor de fricción estimado (para tuberías de PVC/plástico)
        const f = 0.02;
        // Pérdidas por fricción (Darcy-Weisbach)
        const hf_friction = f * (s.L / D_m) * Math.pow(velocity, 2) / (2 * 9.81);
        // Pérdidas menores
        const hf_minor = (s.K || 0) * Math.pow(velocity, 2) / (2 * 9.81);
        // Altura total del tramo
        const hf_total = (s.elevation || 0) + hf_friction + hf_minor;
        
        Hreq += hf_total;
        details.push({ 
          ...s, 
          hf: parseFloat(hf_total.toFixed(2)),
          velocity: parseFloat(velocity.toFixed(2)),
          frictionLoss: parseFloat(hf_friction.toFixed(2)),
          minorLoss: parseFloat(hf_minor.toFixed(2))
        });
      });
      
      Hreq = Hreq || 50;
    }
    
    // Interpolar valores de la bomba seleccionada
    let pumpH = 0;
    let pumpEfficiency = 0.75; // Valor por defecto
    
    const selectedPump = pumps.find(p => p.id === selectedPumpId);
    if (selectedPump && selectedPump.curva) {
      // Altura de la bomba para el caudal Q
      pumpH = interpolate(Q, selectedPump.curva, 'H');
      
      // Eficiencia de la bomba para el caudal Q
      if (selectedPump.efficiency && selectedPump.efficiency.length > 0) {
        const efficiencyValue = interpolate(Q, selectedPump.efficiency, 'eta');
        pumpEfficiency = efficiencyValue > 0 ? efficiencyValue : 0.75;
      }
    } else {
      // Valores por defecto si no hay bomba seleccionada
      pumpH = 50;
      pumpEfficiency = 0.75;
    }
    
    // Número de bombas en serie necesarias
    const bombas = Math.ceil(Hreq / pumpH);
    
    // Cálculo de potencia (kW)
    const Q_m3s = Q / 1000; // Convertir L/s a m³/s
    const kW = (1000 * 9.81 * Q_m3s * Hreq) / (1000 * pumpEfficiency);
    
    return { 
      Hreq: parseFloat(Hreq.toFixed(2)), 
      kW: parseFloat(kW.toFixed(2)), 
      bombas, 
      details,
      eficiencia: parseFloat((pumpEfficiency * 100).toFixed(1)),
      pumpH: parseFloat(pumpH.toFixed(2)),
      NPSHr: selectedPump?.NPSHr || 'N/A',
      marca: selectedPump?.marca || 'N/A',
      modelo: selectedPump?.modelo || 'N/A'
    };
  })();

  // Mostrar loader mientras se verifica el cliente
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Calculadora de Bombas</h1>
          <p className="text-gray-600 mt-2">
            Calcula los parámetros necesarios para tu sistema de bombeo
          </p>
        </header>

        <div className="flex flex-wrap gap-3 mb-6">
          <button 
            onClick={() => setMode('basico')} 
            className={`px-4 py-2 rounded-lg transition-colors ${mode === 'basico' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
          >
            Modo básico
          </button>
          <button 
            onClick={() => setMode('avanzado')} 
            className={`px-4 py-2 rounded-lg transition-colors ${mode === 'avanzado' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
          >
            Modo avanzado
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Parámetros */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Parámetros del sistema</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Caudal (L/s)
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="1"
                    value={Q} 
                    onChange={e => setQ(+e.target.value)} 
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-sm text-gray-500">0</span>
                    <span className="text-sm text-gray-500">50</span>
                    <span className="text-sm text-gray-500">100</span>
                  </div>
                  <div className="mt-4">
                    <input 
                      type="number" 
                      value={Q} 
                      onChange={e => {
                        const val = Math.min(100, Math.max(0, +e.target.value));
                        setQ(val);
                      }} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar bomba
                  </label>
                  <select 
                    value={selectedPumpId}
                    onChange={e => setSelectedPumpId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {pumps.map(pump => (
                      <option key={pump.id} value={pump.id}>
                        {pump.marca} - {pump.modelo}
                      </option>
                    ))}
                  </select>
                  {selectedPumpId && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>{pumps.find(p => p.id === selectedPumpId)?.marca} {pumps.find(p => p.id === selectedPumpId)?.modelo}</strong>
                        <br />
                        Altura máx: {pumps.find(p => p.id === selectedPumpId)?.curva[0]?.H || 0}m 
                        • NPSHr: {pumps.find(p => p.id === selectedPumpId)?.NPSHr || 'N/A'}m
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {mode === 'basico' && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Altura requerida total (m)
                  </label>
                  <input 
                    type="number" 
                    value={basicHeight} 
                    onChange={e => setBasicHeight(Math.max(0, +e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.1"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Incluye altura geométrica más pérdidas por fricción
                  </p>
                </div>
              )}
              
              {mode === 'avanzado' && (
                <div className="mt-6">
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Configuración de tramos</h3>
                    <InputForm onAdd={addStation} />
                    
                    {stations.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-gray-700 mb-3">Tramos añadidos ({stations.length})</h4>
                        <div className="space-y-3">
                          {stations.map((s, i) => (
                            <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                              <div>
                                <span className="font-medium text-gray-800">{s.name || `Tramo ${i+1}`}</span>
                                <span className="text-sm text-gray-600 ml-3">
                                  L={s.L}m • D={s.D}mm • Δz={s.elevation}m • K={s.K || 0}
                                </span>
                                {s.hf && (
                                  <span className="text-sm text-blue-600 ml-3">
                                    Pérdidas: {s.hf}m
                                  </span>
                                )}
                              </div>
                              <button 
                                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                onClick={() => removeStation(i)}
                              >
                                Eliminar
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Gráfico HQ */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Curva Característica de la Bomba
              </h2>
              <HQChart 
                selectedPump={pumps.find(p => p.id === selectedPumpId)}
                currentQ={Q}
                currentH={resultados.Hreq}
                requiredPumps={resultados.bombas}
              />
            </div>
          </div>

          {/* Columna derecha - Resultados */}
          <div className="space-y-6">
            <ResultsCard resultados={resultados} />
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Especificaciones de la Bomba</h3>
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
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">NPSH requerido:</span>
                  <span className="font-semibold">{resultados.NPSHr} m</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recomendaciones</h3>
              <ul className="space-y-3">
                {resultados.bombas === 1 ? (
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-sm">Una bomba es suficiente para este sistema</span>
                  </li>
                ) : (
                  <li className="flex items-start">
                    <span className="text-yellow-500 mr-2">⚠</span>
                    <span className="text-sm">
                      Se requieren <strong>{resultados.bombas} bombas en serie</strong> para alcanzar {resultados.Hreq}m
                    </span>
                  </li>
                )}
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">ℹ</span>
                  <span className="text-sm">
                    Potencia requerida: <strong>{resultados.kW} kW</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">⚡</span>
                  <span className="text-sm">
                    Consumo estimado: <strong>{(resultados.kW * 0.746).toFixed(1)} HP</strong>
                  </span>
                </li>
                {mode === 'basico' && (
                  <li className="flex items-start">
                    <span className="text-gray-500 mr-2">•</span>
                    <span className="text-sm">
                      Usa el modo avanzado para calcular pérdidas detalladas por tramo
                    </span>
                  </li>
                )}
              </ul>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Información Técnica</h3>
              <p className="text-sm text-blue-700 mb-3">
                Los cálculos utilizan interpolación lineal de las curvas de la bomba.
                Para proyectos reales, consulte las especificaciones del fabricante.
              </p>
              <div className="text-xs text-blue-600 space-y-1">
                <p>• Altura requerida: {resultados.Hreq} m</p>
                <p>• Caudal: {Q} L/s ({Q/1000} m³/s)</p>
                <p>• Densidad del agua: 1000 kg/m³</p>
                <p>• Gravedad: 9.81 m/s²</p>
                <p>• Factor de fricción estimado: 0.02</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
