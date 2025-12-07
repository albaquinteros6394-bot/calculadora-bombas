'use client';
import { useState } from 'react';

export default function InputForm({ onAdd }: { onAdd: (station: any) => void }) {
  const [name, setName] = useState('');
  const [L, setL] = useState<number>(100);
  const [D, setD] = useState<number>(150);
  const [elevation, setElevation] = useState<number>(10);
  const [K, setK] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (L <= 0) {
      alert("La longitud debe ser mayor a 0");
      return;
    }
    if (D <= 0) {
      alert("El diámetro debe ser mayor a 0");
      return;
    }
    
    const station = {
      name: name || `Tramo ${Date.now()}`,
      L: L,
      D: D,
      elevation: elevation,
      K: K,
    };
    
    onAdd(station);
    
    // Resetear solo el nombre
    setName('');
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Configuración de Tramos
        <span className="text-sm text-gray-500 font-normal ml-2">
          (Define cada sección de tu sistema de tuberías)
        </span>
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre del tramo */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            📝 Nombre del tramo (opcional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ej: Succión del pozo, Descarga principal, etc."
          />
        </div>

        {/* Longitud y Diámetro */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Longitud */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              📏 Longitud del tramo (L)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={L}
                onChange={(e) => setL(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                step="1"
                required
              />
              <span className="text-gray-500 whitespace-nowrap">metros</span>
            </div>
            <p className="text-xs text-gray-500">
              Distancia total de este tramo de tubería
            </p>
          </div>

          {/* Diámetro */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              ⚙️ Diámetro interno (D)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={D}
                onChange={(e) => setD(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="10"
                step="1"
                required
              />
              <span className="text-gray-500 whitespace-nowrap">milímetros (mm)</span>
            </div>
            <p className="text-xs text-gray-500">
              Ej: 50mm (2"), 100mm (4"), 150mm (6")
            </p>
          </div>
        </div>

        {/* Elevación y Coeficiente K */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Elevación */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              ⛰️ Diferencia de altura (Δz)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={elevation}
                onChange={(e) => setElevation(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                step="0.1"
                required
              />
              <span className="text-gray-500 whitespace-nowrap">metros</span>
            </div>
            <p className="text-xs text-gray-500">
              Positivo = subida, Negativo = bajada, Cero = tramo horizontal
            </p>
          </div>

          {/* Coeficiente K */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              🌀 Coeficiente de pérdidas (K)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={K}
                onChange={(e) => setK(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.1"
                required
              />
              <span className="text-gray-500 whitespace-nowrap">(sin unidades)</span>
            </div>
            <p className="text-xs text-gray-500">
              Suma de pérdidas por accesorios: K=0 (sin accesorios), K=2-3 (válvula + codos)
            </p>
          </div>
        </div>

        {/* Ejemplo práctico */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">📋 Ejemplo práctico:</h4>
          <div className="text-sm text-gray-600">
            <p><strong>Succión de pozo:</strong></p>
            <ul className="list-disc pl-5 mt-1">
              <li>Longitud: 20 metros</li>
              <li>Diámetro: 100 mm (4 pulgadas)</li>
              <li>Altura: +15 metros (sube)</li>
              <li>K: 2.5 (1 válvula + 2 codos)</li>
            </ul>
          </div>
        </div>

        {/* Botón de envío */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Agregar Tramo al Cálculo
        </button>
      </form>
    </div>
  );
}