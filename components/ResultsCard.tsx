export default function ResultsCard({ resultados }:{resultados:any}) {
  return (
    <div className="p-4 rounded border">
      <h3 className="font-semibold">Resultados</h3>
      <p className="mt-2">Altura requerida total: <strong>{(resultados.Hreq||0).toFixed(2)} m</strong></p>
      <p>Potencia estimada: <strong>{(resultados.kW||0).toFixed(2)} kW</strong></p>
      <p>Bombas en serie (mín): <strong>{resultados.bombas}</strong></p>
      <details className="mt-2">
        <summary className="cursor-pointer">Ver detalles</summary>
        <ul className="mt-2 list-disc pl-5">
          {(resultados.details||[]).map((d:any,i:number)=>(
            <li key={i}>{d.name}: hf {(d.hf||0).toFixed(3)} m — f {(d.f||0).toFixed(5)} — Re {Math.round(d.Re||0)}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
