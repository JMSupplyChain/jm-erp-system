import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "JM Inventory Control",
  description: "Mini ERP para control logístico",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1a2b3c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased flex flex-col lg:flex-row min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 lg:pb-0">
        
        {/* CABECERA MÓVIL (Solo celulares y tablets) */}
        <header className="flex lg:hidden items-center justify-between bg-[#1a2b3c] px-4 py-3 text-white shadow-md print:hidden sticky top-0 z-50">
          <div>
            <h2 className="text-base font-bold leading-tight">JM INVENTORY</h2>
            <p className="text-[10px] font-semibold tracking-widest text-slate-400">ERP BODEGA MÓVIL</p>
          </div>
          <Link href="/materiales" className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 border border-slate-700">
            📦 Catálogo
          </Link>
        </header>

        {/* BARRA LATERAL PC (Oculta en celulares e impresión) */}
        <aside className="hidden w-64 flex-col bg-[#1a2b3c] text-white lg:flex fixed h-full print:hidden z-40">
          <div>
            <div className="p-6">
              <h2 className="text-lg font-bold leading-tight">JM INVENTORY</h2>
              <p className="text-xs font-semibold tracking-widest text-slate-400">ERP BODEGA</p>
            </div>
            <nav className="mt-2 flex flex-col gap-2 px-4">
              <Link href="/" className="rounded-md px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus:bg-slate-700/50">
                📊 Resumen
              </Link>
              <Link href="/entradas" className="rounded-md px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus:bg-slate-700/50">
                📥 Entradas
              </Link>
              <Link href="/salidas" className="rounded-md px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus:bg-slate-700/50">
                📤 Salidas
              </Link>
              <Link href="/stock" className="rounded-md px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus:bg-slate-700/50">
                🏢 Stock en Bodega
              </Link>
              <Link href="/inventarios" className="rounded-md px-4 py-3 text-sm font-medium text-amber-400 transition-colors hover:bg-slate-800 hover:text-amber-300 focus:bg-slate-700/50">
                📋 Inventario Físico
              </Link>
              <Link href="/materiales" className="rounded-md px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus:bg-slate-700/50">
                📦 Maestro de Materiales
              </Link>
            </nav>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto lg:ml-64 print:ml-0 print:w-full">
          {children}
        </div>

        {/* BARRA INFERIOR MÓVIL (Los 6 módulos exactos) */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden items-center justify-between bg-[#1a2b3c] border-t border-slate-800 px-1 py-2 text-white shadow-lg print:hidden">
          <Link href="/" className="flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium text-slate-300 hover:text-white">
            <span className="text-sm">📊</span>
            <span className="truncate">Inicio</span>
          </Link>
          <Link href="/entradas" className="flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium text-slate-300 hover:text-white">
            <span className="text-sm">📥</span>
            <span className="truncate">Entradas</span>
          </Link>
          <Link href="/salidas" className="flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium text-slate-300 hover:text-white">
            <span className="text-sm">📤</span>
            <span className="truncate">Salidas</span>
          </Link>
          <Link href="/stock" className="flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium text-slate-300 hover:text-white">
            <span className="text-sm">🏢</span>
            <span className="truncate">Stock</span>
          </Link>
          <Link href="/inventarios" className="flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-bold text-amber-400 hover:text-amber-300">
            <span className="text-sm">📋</span>
            <span className="truncate">Auditoría</span>
          </Link>
          <Link href="/materiales" className="flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium text-slate-300 hover:text-white">
            <span className="text-sm">📦</span>
            <span className="truncate">Materiales</span>
          </Link>
        </nav>

      </body>
    </html>
  );
}