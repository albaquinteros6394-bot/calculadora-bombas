// components/ReporteAnalisis.tsx
'use client';
import { useState, useEffect } from 'react';

interface Props {
  modo: 'basico' | 'avanzado';
  caudal: number;
  alturaManual?: number;
  bombaSeleccionada: any;
  tramos: any[];
  resultados: any;
}

export default function ReporteAnalisis({ modo, caudal, alturaManual, bombaSeleccionada, tramos, resultados }: Props) {
  const [fecha, setFecha] = useState('');
  const [recomendaciones, setRecomendaciones] = useState<string[]>([]);
  const [analisis, setAnalisis] = useState<string[]>([]);

  useEffect(() => {
    // Fecha actual formateada
    const now = new Date();
    setFecha(now.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }));

    // Generar recomendaciones
    const recs = [];
    const analisisList = [];

    // 1. Análisis de número de bombas
    if (resultados.bombas === 1) {
      recs.push("✓ Una sola bomba es suficiente para el sistema");
      analisisList.push(`La bomba ${bombaSeleccionada?.marca} ${bombaSeleccionada?.modelo} puede proporcionar ${resultados.pumpH}m, suficiente para los ${resultados.Hreq}m requeridos.`);
    } else {
      recs.push(`⚠ Se requieren ${resultados.bombas} bombas en serie`);
      analisisList.push(`Cada bomba proporciona ${resultados.pumpH}m, por lo que necesitamos ${resultados.bombas} en serie para alcanzar ${resultados.Hreq}m.`);
    }

    // 2. Análisis de potencia
    if (resultados.kW < 10) {
      recs.push("✓ Potencia baja: Consumo eléctrico económico");
      analisisList.push(`Con ${resultados.kW} kW (${(resultados.kW * 0.746).toFixed(1)} HP), el consumo será bajo.`);
    } else if (resultados.kW < 30) {
      recs.push("⚡ Potencia media: Consumo moderado");
      analisisList.push(`Potencia de ${resultados.kW} kW (${(resultados.kW * 0.746).toFixed(1)} HP) está dentro del rango comercial estándar.`);
    } else {
      recs.push("⚠ Alta potencia: Considerar tarifa industrial");
      analisisList.push(`Potencia de ${resultados.kW} kW (${(resultados.kW * 0.746).toFixed(1)} HP) puede requerir conexión trifásica y tarifa industrial.`);
    }

    // 3. Análisis de eficiencia
    if (resultados.eficiencia >= 75) {
      recs.push("🏆 Alta eficiencia: Excelente rendimiento energético");
      analisisList.push(`Eficiencia del ${resultados.eficiencia}% indica buena selección de bomba.`);
    } else if (resultados.eficiencia >= 65) {
      recs.push("✓ Eficiencia aceptable: Rendimiento normal");
      analisisList.push(`Eficiencia del ${resultados.eficiencia}% está dentro de lo esperado.`);
    } else {
      recs.push("⚠ Eficiencia baja: Considerar otra bomba");
      analisisList.push(`Eficiencia del ${resultados.eficiencia}% sugiere que la bomba no trabaja en su punto óptimo.`);
    }

    // 4. Análisis del punto de operación
    if (resultados.Hreq < resultados.pumpH * 0.8) {
      recs.push("ℹ Bomba sobredimensionada: Puede regularse");
      analisisList.push(`La bomba trabaja al ${((resultados.Hreq / resultados.pumpH) * 100).toFixed(0)}% de su capacidad, puede regularse con válvula.`);
    } else if (resultados.Hreq > resultados.pumpH * 0.95) {
      recs.push("⚠ Punto límite: Considerar margen de seguridad");
      analisisList.push(`La bomba trabaja cerca del límite (${((resultados.Hreq / resultados.pumpH) * 100).toFixed(0)}%).`);
    } else {
      recs.push("✓ Punto óptimo de operación");
      analisisList.push(`La bomba trabaja al ${((resultados.Hreq / resultados.pumpH) * 100).toFixed(0)}% de su capacidad, punto eficiente.`);
    }

    // 5. Recomendaciones según modo
    if (modo === 'basico') {
      recs.push("📈 Usa modo avanzado para mayor precisión");
    }

    if (tramos.length > 0) {
      recs.push(`📊 Sistema con ${tramos.length} tramo(s) analizado(s)`);
    }

    setRecomendaciones(recs);
    setAnalisis(analisisList);
  }, [resultados, bombaSeleccionada, modo, tramos.length]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const reporte = `
INFORME TÉCNICO - CALCULADORA DE BOMBAS
Fecha: ${fecha}

DATOS DE ENTRADA:
- Modo: ${modo === 'basico' ? 'Básico' : 'Avanzado'}
- Caudal: ${caudal} L/s
- Altura manual: ${alturaManual || 'N/A'} m
- Bomba: ${bombaSeleccionada?.marca} ${bombaSeleccionada?.modelo}
- Tramo(s): ${tramos.length}

RESULTADOS:
- Altura requerida: ${resultados.Hreq} m
- Potencia requerida: ${resultados.kW} kW (${(resultados.kW * 0.746).toFixed(1)} HP)
- Número de bombas: ${resultados.bombas}
- Eficiencia: ${resultados.eficiencia}%
- Altura por bomba: ${resultados.pumpH} m

RECOMENDACIONES:
${recomendaciones.map(r => `• ${r}`).join('\n')}

ANÁLISIS:
${analisis.map(a => `• ${a}`).join('\n')}

OBSERVACIONES:
• Los cálculos son estimados y deben validarse con un ingeniero especializado.
• Considere un factor de seguridad del 10-15% en la altura.
• Verifique el NPSH disponible vs requerido (${resultados.NPSHr} m).
    `;

    const blob = new Blob([reporte], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_bomba_${fecha.replace(/[/:\\]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mt-8 print:shadow-none print:border">
      <div className="flex justify-between items-start mb-6 print:mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 print:text-xl">📋 INFORME TÉCNICO - ANÁLISIS DE SISTEMA</h2>
          <p className="text-gray-600 mt-1 print:text-sm">Generado el {fecha}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors print:hidden"
          >
            🖨️ Imprimir
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors print:hidden"
          >
            📥 Exportar TXT
          </button>
        </div>
      </div>

      {/* Resumen ejecutivo */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r print:mb-4">
        <h3 className="font-bold text-blue-800 text-lg mb-2">📊 RESUMEN EJECUTIVO</h3>
        <p className="text-blue-700">
          El sistema requiere {resultados.Hreq}m de altura con un caudal de {caudal}L/s. 
          La bomba {bombaSeleccionada?.marca} {bombaSeleccionada?.modelo} necesita {resultados.bombas} unidad(es) 
          y consumirá aproximadamente {resultados.kW} kW de potencia.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 print:grid-cols-2">
        {/* Columna izquierda: Datos y Resultados */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4 print:text-lg border-b pb-2">📝 DATOS DE ENTRADA</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Modo de cálculo:</span>
              <span className="font-semibold">{modo === 'basico' ? 'Básico' : 'Avanzado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Caudal del sistema:</span>
              <span className="font-semibold">{caudal} L/s ({caudal/1000} m³/s)</span>
            </div>
            {modo === 'basico' && alturaManual && (
              <div className="flex justify-between">
                <span className="text-gray-600">Altura manual:</span>
                <span className="font-semibold">{alturaManual} m</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Bomba seleccionada:</span>
              <span className="font-semibold">{bombaSeleccionada?.marca} {bombaSeleccionada?.modelo}</span>
            </div>
            {modo === 'avanzado' && (
              <div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tramos configurados:</span>
                  <span className="font-semibold">{tramos.length}</span>
                </div>
                {tramos.length > 0 && (
                  <div className="mt-2 pl-4 border-l-2 border-gray-300">
                    {tramos.map((tramo, idx) => (
                      <div key={idx} className="text-sm text-gray-600">
                        <span className="font-medium">{tramo.name || `Tramo ${idx+1}`}:</span> 
                        L={tramo.L}m, D={tramo.D}mm, Δz={tramo.elevation}m, K={tramo.K}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4 print:text-lg border-b pb-2">📊 RESULTADOS DEL CÁLCULO</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Altura total requerida:</span>
              <span className="font-bold text-blue-600">{resultados.Hreq} m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Potencia requerida:</span>
              <span className="font-bold text-green-600">{resultados.kW} kW ({(resultados.kW * 0.746).toFixed(1)} HP)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Número de bombas:</span>
              <span className="font-bold text-purple-600">{resultados.bombas} unidad(es)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Eficiencia del sistema:</span>
              <span className="font-semibold">{resultados.eficiencia}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Altura por bomba:</span>
              <span className="font-semibold">{resultados.pumpH} m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">NPSH requerido:</span>
              <span className="font-semibold">{resultados.NPSHr} m</span>
            </div>
          </div>
        </div>

        {/* Columna derecha: Análisis y Recomendaciones */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4 print:text-lg border-b pb-2">🔍 ANÁLISIS TÉCNICO</h3>
          <div className="space-y-4">
            {analisis.map((item, idx) => (
              <div key={idx} className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">•</span>
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4 print:text-lg border-b pb-2">✅ RECOMENDACIONES</h3>
          <div className="space-y-3">
            {recomendaciones.map((rec, idx) => {
              let icon = "✓";
              let color = "text-green-600 bg-green-50";
              if (rec.includes("⚠")) { icon = "⚠"; color = "text-yellow-600 bg-yellow-50"; }
              if (rec.includes("ℹ")) { icon = "ℹ"; color = "text-blue-600 bg-blue-50"; }
              if (rec.includes("📈")) { icon = "📈"; color = "text-purple-600 bg-purple-50"; }
              if (rec.includes("🏆")) { icon = "🏆"; color = "text-emerald-600 bg-emerald-50"; }
              if (rec.includes("⚡")) { icon = "⚡"; color = "text-orange-600 bg-orange-50"; }
              if (rec.includes("📊")) { icon = "📊"; color = "text-indigo-600 bg-indigo-50"; }
              
              return (
                <div key={idx} className={`p-3 rounded-lg ${color} border border-opacity-30`}>
                  <div className="flex items-center">
                    <span className="mr-2">{icon}</span>
                    <span>{rec.replace(/[✓⚠ℹ📈🏆⚡📊]/g, '').trim()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Justificación de selección */}
      <div className="mt-8 pt-6 border-t print:mt-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-3 print:text-lg">🤔 ¿POR QUÉ ESTOS RESULTADOS SON ADECUADOS?</h3>
        <div className="bg-gray-50 p-4 rounded-lg border">
          <p className="text-gray-700">
            1. <strong>Cálculos basados en fórmulas estándar</strong>: Usamos la ecuación fundamental de potencia hidráulica y interpolación lineal de curvas del fabricante.
          </p>
          <p className="text-gray-700 mt-2">
            2. <strong>Margen de seguridad incluido</strong>: Los resultados consideran eficiencias realistas (75% base) y factores de conversión estándar.
          </p>
          <p className="text-gray-700 mt-2">
            3. <strong>Validación por curva característica</strong>: El punto de operación se verifica contra la curva real de la bomba seleccionada.
          </p>
          <p className="text-gray-700 mt-2">
            4. <strong>Recomendaciones prácticas</strong>: Basadas en experiencia en sistemas de bombeo y normas de eficiencia energética.
          </p>
        </div>
      </div>

      {/* Notas finales */}
      <div className="mt-6 pt-4 border-t text-sm text-gray-500 print:mt-4">
        <p><strong>Nota:</strong> Este informe es una herramienta de dimensionamiento preliminar. Para proyectos reales, consulte con un ingeniero especializado y verifique las especificaciones exactas del fabricante.</p>
        <p className="mt-1">Cálculos basados en: P = (ρ × g × Q × H) / (η × 1000) donde ρ=1000 kg/m³, g=9.81 m/s²</p>
      </div>
    </div>
  );
}