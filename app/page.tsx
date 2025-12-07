import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-6">
      {/* Sección principal */}
      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold">Sistema de Bombeo en Cascada</h2>
        <p className="mt-2 text-slate-700">
          Herramienta web para dimensionar estaciones de bombeo en tajo minero.
          Calcula pérdidas, potencia, número de bombas y muestra curvas H–Q.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/calculadora"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Abrir calculadora
          </Link>
          <a
            className="px-4 py-2 rounded border"
            href="https://vercel.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Desplegar en Vercel
          </a>
        </div>
      </section>

      {/* Sección de modos */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Modo básico</h3>
          <p className="mt-2 text-slate-600">
            Introduce caudal, altura y bomba; obtén número mínimo de bombas.
          </p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Modo avanzado</h3>
          <p className="mt-2 text-slate-600">
            Agrega tramos con longitud, diámetro y pérdidas; calcula pérdidas
            por fricción (Darcy–Weisbach) y localizadas.
          </p>
        </div>
      </section>
    </div>
  );
}
