'use client';
import { useEffect, useRef, useState } from 'react';

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
    const padding = 50;
    const graphWidth = canvas.width - 2 * padding;
    const graphHeight = canvas.height - 2 * padding;
    
    // Encontrar valores máximos
    const maxQ = Math.max(...selectedPump.curva.map(p => p.Q), currentQ, 100);
    const maxH = Math.max(...selectedPump.curva.map(p => p.H), currentH, 120);
    
    // Escalas
    const scaleX = graphWidth / maxQ;
    const scaleY = graphHeight / maxH;
    
    // Función para convertir coordenadas
    const toCanvasX = (q: number) => padding + q * scaleX;
    const toCanvasY = (h: number) => canvas.height - padding - h * scaleY;
    
    // Dibujar ejes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    
    // Eje X (Q)
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Eje Y (H)
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(padding, padding);
    ctx.stroke();
    
    // Etiquetas de ejes
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Caudal (L/s)', canvas.width / 2, canvas.height - 10);
    
    ctx.save();
    ctx.translate(10, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Altura (m)', 0, 0);
    ctx.restore();
    
    // Dibujar curva de la bomba
    if (selectedPump.curva.length > 0) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      selectedPump.curva.forEach((point: any, i: number) => {
        const x = toCanvasX(point.Q);
        const y = toCanvasY(point.H);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Puntos en la curva
      selectedPump.curva.forEach((point: any) => {
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(toCanvasX(point.Q), toCanvasY(point.H), 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // Dibujar punto de operación actual
    if (currentQ > 0 && currentH > 0) {
      const opX = toCanvasX(currentQ);
      const opY = toCanvasY(currentH);
      
      // Líneas punteadas al punto
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      // Línea vertical
      ctx.beginPath();
      ctx.moveTo(opX, canvas.height - padding);
      ctx.lineTo(opX, opY);
      ctx.stroke();
      
      // Línea horizontal
      ctx.beginPath();
      ctx.moveTo(padding, opY);
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
      
      // Etiqueta del punto
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Q=${currentQ} L/s, H=${currentH}m`, opX + 10, opY - 10);
    }
    
  }, [isClient, selectedPump, currentQ, currentH]);
  
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
          width={600} 
          height={400}
          className="w-full h-auto bg-white"
        />
      </div>
      <div className="text-sm text-gray-600">
        <p>• <span className="inline-block w-3 h-3 bg-blue-500 mr-2"></span> Curva de la bomba seleccionada</p>
        <p>• <span className="inline-block w-3 h-3 bg-red-500 mr-2"></span> Punto de operación del sistema</p>
        {requiredPumps > 1 && (
          <p className="text-yellow-600 font-medium">
            ⚠ Se requieren {requiredPumps} bombas en serie para alcanzar la altura necesaria
          </p>
        )}
      </div>
    </div>
  );
}
