'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function HQChart({ Q, Hreq, pump }:{Q:number, Hreq:number, pump:any}) {
  const points:any[] = [];
  const Qmax = Math.max((pump?.curva?.slice(-1)[0]?.Q || Q*2), Math.max(Q*1.5, 100));
  for(let q=0; q<=Qmax; q+=Qmax/30){
    const Hsystem = Q===0?0: Hreq * (q / Math.max(Q,1));
    const Hpump = pump?.curva ? interpolatePumpH(pump.curva, q) : Math.max(0, 100 - 0.01*q*q);
    points.push({ q: Math.round(q), Hpump: Number(Hpump.toFixed(2)), Hsystem: Number(Hsystem.toFixed(2)) });
  }
  return (
    <div style={{ height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={points}>
          <XAxis dataKey="q" name="Q (L/s)" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Hpump" stroke="#8884d8" dot={false} />
          <Line type="monotone" dataKey="Hsystem" stroke="#82ca9d" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function interpolatePumpH(curve:any[], q:number){
  if(q<=curve[0].Q) return curve[0].H;
  for(let i=0;i<curve.length-1;i++){
    const a=curve[i], b=curve[i+1];
    if(q>=a.Q && q<=b.Q){
      const t=(q-a.Q)/(b.Q-a.Q);
      return a.H + t*(b.H-a.H);
    }
  }
  const last = curve[curve.length-1];
  return Math.max(0, last.H - 0.005*(q-last.Q)*(q-last.Q));
}
