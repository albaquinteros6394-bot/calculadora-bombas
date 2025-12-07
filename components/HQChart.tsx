'use client';
import { useState, useEffect } from 'react';

export default function HQChart({ 
  selectedPump, 
  currentQ, 
  currentH,
  requiredPumps = 1 
}: { 
  selectedPump: any; 
  currentQ: number; 
  currentH: number;
  requiredPumps?: number;
}) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <div className="p-4 bg-gray-100 rounded animate-pulse h-64 flex items-center justify-center">Cargando gráfico...</div>;
  }
  
  if (!selectedPump || !selectedPump.curva) {
    return <div className="p-4 border rounded bg-yellow-50">Selecciona una bomba para ver la curva</div>;
  }
  
  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="font-semibold mb-2">Curva de la bomba: {selectedPump.marca} {selectedPump.modelo}</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Caudal actual:</span>
            <span className="font-medium">{currentQ} L/s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Altura requerida:</span>
            <span className="font-medium">{currentH} m</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Puntos de la curva:</span>
            <span className="font-medium">{selectedPump.curva.length} puntos</span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <p className="text-sm text-blue-700">
            Gráfico simplificado - En una versión completa aquí iría un gráfico interactivo usando Chart.js o similar.
          </p>
        </div>
      </div>
      <div className="text-sm text-gray-500">
        <p>Para ver un gráfico completo, se necesitaría instalar una librería de gráficos como Chart.js o Recharts.</p>
      </div>
    </div>
  );
}
