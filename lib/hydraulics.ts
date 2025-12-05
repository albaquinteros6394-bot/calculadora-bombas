export const g = 9.81;
export const rho = 1000;

export function reynoldsNumber(Q_m3s:number, D_m:number, nu=1e-6){
  const A = Math.PI*D_m*D_m/4;
  const V = Q_m3s / A;
  return (V * D_m) / nu;
}

export function swameeJain(Re:number, epsRelative:number){
  if(Re<=0) return 0.02;
  const A = Math.pow((epsRelative/3.7),1.11) + (6.9/Re);
  const f = 0.25 / Math.pow(Math.log10(A),2);
  return f;
}

export function darcyWeisbachLoss(Q_Ls:number, L_m:number, D_m:number, eps_m=4.6e-5){
  const Q = Q_Ls/1000;
  const A = Math.PI*D_m*D_m/4;
  const V = Q / A;
  const Re = reynoldsNumber(Q, D_m);
  const epsRel = eps_m / D_m;
  const f = swameeJain(Re, epsRel);
  const hf = f * (L_m / D_m) * (V*V) / (2*g);
  return { hf, f, V, Re };
}

export function hydraulicPower_kW(Q_Ls:number, H_m:number, eta=1){
  const Q = Q_Ls/1000;
  const P_W = rho * g * Q * H_m / eta;
  return P_W/1000;
}

export function powerHP_from_kW(kW:number){ return kW * 1.34102209; }
