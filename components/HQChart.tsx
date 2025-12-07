'use client';
import { useEffect, useRef, useState } from 'react';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (!isClient || !selectedPump || !selectedPump.curva || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dimensiones
    const padding = { top: 50, right: 60, bottom: 60, left: 60 };
    const graphWidth = canvas.width - padding.left - padding.right;
    const graphHeight = canvas.height - padding.top - padding.bottom;
    
    // Encontrar valores máximos
    const maxQ = Math.max(...selectedPump.curva.map((p: any) => p.Q), currentQ) * 1.1;
    const maxH = Math.max(...selectedPump.curva.map((p: any) => p.H), currentH) * 1.1;
    
    // Si hay datos de eficiencia, calcular máximos
    let maxEfficiency = 0;
    if (selectedPump.eficiencia && selectedPump.eficiencia.length > 0) {
      maxEfficiency = Math.max(...selectedPump.eficiencia.map((e: any) => e.eta * 100)) * 1.1;
    } else {
      maxEfficiency = 80; // Valor por defecto
    }
    
    // Escalas
    const scaleX = graphWidth / maxQ;
    const scaleY_H = graphHeight / maxH;
    const scaleY_Efficiency = graphHeight / maxEfficiency;
    
    // Función para convertir coordenadas
    const toCanvasX = (q: number) => padding.left + q * scaleX;
    const toCanvasY_H = (h: number) => canvas.height - padding.bottom - h * scaleY_H;
    const toCanvasY_Efficiency = (eff: number) => canvas.height - padding.bottom - (eff * 100) * scaleY_Efficiency;
    
    // Dibujar fondo de la zona de alta eficiencia (opcional)
    if (selectedPump.eficiencia && selectedPump.eficiencia.length > 0) {
      // Encontrar el rango de alta eficiencia (por encima del 70% de la máxima)
      const maxEffValue = Math.max(...selectedPump.eficiencia.map((e: any) => e.eta));
      const highEfficiencyThreshold = maxEffValue * 0.7;
      
      // Encontrar Q mínimo y máximo para alta eficiencia
      let minHighEffQ = Infinity;
      let maxHighEffQ = -Infinity;
      
      selectedPump.eficiencia.forEach((point: any) => {
        if (point.eta >= highEfficiencyThreshold) {
          minHighEffQ = Math.min(minHighEffQ, point.Q);
          maxHighEffQ = Math.max(maxHighEffQ, point.Q);
        }
      });
      
      if (minHighEffQ < Infinity && maxHighEffQ > -Infinity) {
        ctx.fillStyle = 'rgba(144, 238, 144, 0.3)'; // Verde claro transparente
        ctx.fillRect(
          toCanvasX(minHighEffQ),
          padding.top,
          (maxHighEffQ - minHighEffQ) * scaleX,
          graphHeight
        );
        
        // Etiqueta de zona de alta eficiencia
        ctx.fillStyle = 'rgba(0, 100, 0, 0.7)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          'Zona de alta eficiencia',
          toCanvasX((minHighEffQ + maxHighEffQ) / 2),
          padding.top + 15
        );
      }
    }
    
    // Dibujar ejes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    
    // Eje X (Q) - principal
    ctx.beginPath();
    ctx.moveTo(padding.left, canvas.height - padding.bottom);
    ctx.lineTo(canvas.width - padding.right, canvas.height - padding.bottom);
    ctx.stroke();
    
    // Eje Y izquierdo (H)
    ctx.beginPath();
    ctx.moveTo(padding.left, canvas.height - padding.bottom);
    ctx.lineTo(padding.left, padding.top);
    ctx.stroke();
    
    // Eje Y derecho (Eficiencia) - si hay datos
    if (selectedPump.eficiencia && selectedPump.eficiencia.length > 0) {
      ctx.strokeStyle = '#888';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(canvas.width - padding.right, canvas.height - padding.bottom);
      ctx.lineTo(canvas.width - padding.right, padding.top);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Etiquetas de ejes
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Caudal (L/s)', canvas.width / 2, canvas.height - 10);
    
    // Eje Y izquierdo (H)
    ctx.save();
    ctx.translate(15, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Altura (m)', 0, 0);
    ctx.restore();
    
    // Eje Y derecho (Eficiencia) - si hay datos
    if (selectedPump.eficiencia && selectedPump.eficiencia.length > 0) {
      ctx.save();
      ctx.translate(canvas.width - 15, canvas.height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#2e7d32';
      ctx.fillText('Eficiencia (%)', 0, 0);
      ctx.restore();
    }
    
    // Dibujar curva de altura (H-Q) - AZUL
    if (selectedPump.curva.length > 0) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      selectedPump.curva.forEach((point: any, i: number) => {
        const x = toCanvasX(point.Q);
        const y = toCanvasY_H(point.H);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Puntos en la curva de altura
      selectedPump.curva.forEach((point: any) => {
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(toCanvasX(point.Q), toCanvasY_H(point.H), 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // Dibujar curva de eficiencia (η-Q) - VERDE - si hay datos
    if (selectedPump.eficiencia && selectedPump.eficiencia.length > 0) {
      ctx.strokeStyle = '#2e7d32';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      
      selectedPump.eficiencia.forEach((point: any, i: number) => {
        const x = toCanvasX(point.Q);
        const y = toCanvasY_Efficiency(point.eta);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Puntos en la curva de eficiencia
      selectedPump.eficiencia.forEach((point: any) => {
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(toCanvasX(point.Q), toCanvasY_Efficiency(point.eta), 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // Dibujar punto de operación actual
    if (currentQ > 0 && currentH > 0) {
      const opX = toCanvasX(currentQ);
      const opY = toCanvasY_H(currentH);
      
      // Líneas punteadas al punto
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      // Línea vertical
      ctx.beginPath();
      ctx.moveTo(opX, canvas.height - padding.bottom);
      ctx.lineTo(opX, opY);
      ctx.stroke();
      
      // Línea horizontal
      ctx.beginPath();
      ctx.moveTo(padding.left, opY);
      ctx.lineTo(opX, opY);
      ctx.stroke();
      
      ctx.setLineDash([]);
      
      // Punto de operación
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(opX, opY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(opX, opY, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Calcular eficiencia en el punto de operación
      let currentEfficiency = 0;
      if (selectedPump.eficiencia && selectedPump.eficiencia.length > 0) {
        currentEfficiency = interpolate(currentQ, selectedPump.eficiencia, 'eta');
      }
      
      // Etiqueta del punto
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(
        `Q=${currentQ} L/s, H=${currentH}m${currentEfficiency > 0 ? `, η=${(currentEfficiency * 100).toFixed(1)}%` : ''}`,
        opX + 10,
        opY - 10
      );
      
      // Mostrar recomendación de eficiencia
      if (currentEfficiency > 0) {
        let efficiencyMessage = '';
        let efficiencyColor = '#000';
        
        if (currentEfficiency > 0.75) {
          efficiencyMessage = 'Excelente eficiencia';
          efficiencyColor = '#2e7d32';
        } else if (currentEfficiency > 0.65) {
          efficiencyMessage = 'Buena eficiencia';
          efficiencyColor = '#f59e0b';
        } else {
          efficiencyMessage = 'Eficiencia mejorable';
          efficiencyColor = '#ef4444';
        }
        
        ctx.fillStyle = efficiencyColor;
        ctx.font = '11px Arial';
        ctx.fillText(efficiencyMessage, opX + 10, opY + 15);
      }
    }
    
    // Leyenda
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Bomba: ${selectedPump.marca} ${selectedPump.modelo}`, padding.left, 20);
    
    if (requiredPumps > 1) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(`Requiere ${requiredPumps} bombas en serie`, padding.left, 40);
    }
    
    // Leyenda de curvas
    const legendY = 60;
    
    // Curva H-Q
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(padding.left, legendY, 15, 10);
    ctx.fillStyle = '#333';
    ctx.fillText('Altura (H)', padding.left + 20, legendY + 9);
    
    // Curva de eficiencia
    if (selectedPump.eficiencia && selectedPump.eficiencia.length > 0) {
      ctx.fillStyle = '#2e7d32';
      ctx.fillRect(padding.left + 100, legendY, 15, 10);
      ctx.fillStyle = '#333';
      ctx.fillText('Eficiencia (η)', padding.left + 120, legendY + 9);
    }
    
    // Punto de operación
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(padding.left + 200, legendY + 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.fillText('Punto de operación', padding.left + 210, legendY + 9);
    
  }, [isClient, selectedPump, currentQ, currentH, requiredPumps]);
  
  if (!isClient) {
    return <div className="p-4 bg-gray-100 rounded animate-pulse h-64 flex items-center justify-center">Cargando gráfico...</div>;
  }
  
  if (!selectedPump) {
    return (
      <div className="p-6 border rounded-lg bg-yellow-50">
        <p className="text-yellow-700">Selecciona una bomba para ver su curva característica</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={500}
          className="w-full h-auto bg-white"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="text-sm text-gray-600">
          <h4 className="font-semibold mb-2">Información de la bomba:</h4>
          <ul className="space-y-1">
            <li><strong>Marca:</strong> {selectedPump.marca}</li>
            <li><strong>Modelo:</strong> {selectedPump.modelo}</li>
            <li><strong>Potencia nominal:</strong> {selectedPump.potencia_nominal || 'N/A'} HP</li>
            <li><strong>RPM:</strong> {selectedPump.rpm || 'N/A'}</li>
            <li><strong>NPSH requerido:</strong> {selectedPump.NPSHr || 'N/A'} m</li>
            {selectedPump.precio_estimado && (
              <li><strong>Precio estimado:</strong> ${selectedPump.precio_estimado.toLocaleString()}</li>
            )}
          </ul>
        </div>
        
        <div className="text-sm text-gray-600">
          <h4 className="font-semibold mb-2">Leyenda del gráfico:</h4>
          <ul className="space-y-1">
            <li className="flex items-center">
              <span className="inline-block w-3 h-3 bg-blue-500 mr-2"></span>
              <span>Curva Altura-Caudal (H-Q)</span>
            </li>
            {selectedPump.eficiencia && selectedPump.eficiencia.length > 0 && (
              <li className="flex items-center">
                <span className="inline-block w-3 h-3 bg-green-700 mr-2"></span>
                <span>Curva de Eficiencia (η-Q)</span>
              </li>
            )}
            <li className="flex items-center">
              <span className="inline-block w-3 h-3 bg-red-500 mr-2"></span>
              <span>Punto de operación del sistema</span>
            </li>
            <li className="flex items-center">
              <span className="inline-block w-3 h-3 bg-green-100 mr-2 border border-green-300"></span>
              <span>Zona de alta eficiencia</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}