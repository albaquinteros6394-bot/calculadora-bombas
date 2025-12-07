import './globals.css';
export const metadata = { title: 'Proyecto Bombeo' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-slate-50 text-slate-900">
        <div className="min-h-screen">
          <header className="bg-white shadow-sm">
            <div className="max-w-5xl mx-auto px-4 py-4">
              <h1 className="text-xl font-semibold">Proyecto: Sistema de Bombeo</h1>
            </div>
          </header>
          <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
          <footer className="mt-10 text-center text-sm text-slate-600 pb-6">
            Hecho para proyecto universitario — Calculadora de bombeo
          </footer>
        </div>
      </body>
    </html>
  );
}
