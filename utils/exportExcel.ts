import * as XLSX from 'xlsx';

export function exportToExcel(results:any, stations:any[]){
  const ws_data:any[] = [
    ["Proyecto Bombeo"],
    ["Fecha", new Date().toLocaleString()],
    [],
    ["Estación","L (m)","D (m)","Pérdidas locales (m)","Elevación (m)"]
  ];
  stations.forEach(s=> ws_data.push([s.name,s.L,s.D,s.K,s.elevation]));
  ws_data.push([]);
  ws_data.push(["Altura requerida (m)", results.Hreq]);
  ws_data.push(["Potencia (kW)", results.kW]);

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Resultados");
  XLSX.writeFile(wb, "resultado_bombeo.xlsx");
}
