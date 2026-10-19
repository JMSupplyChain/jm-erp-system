import Link from "next/link";

export default function NuevoCiclicoPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-[#1a2b3c] px-6 py-4 text-white md:px-10">
        <div className="mx-auto max-w-4xl">
          <Link href="/inventarios" className="text-sm font-semibold text-slate-400 hover:text-white">← Volver atrás</Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-9 md:px-10">
        <h1 className="text-3xl font-bold text-slate-900">Planificar Conteo Cíclico</h1>
        <p className="mt-2 text-slate-600">Genera la orden de trabajo. Las firmas se solicitarán en terreno.</p>

        <form className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="text-sm font-bold text-slate-700">Título de la tarea</label>
              <input type="text" className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#2a6877] focus:ring-1 focus:ring-[#2a6877]" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Fecha de inicio</label>
              <input type="date" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Fecha límite (Fin)</label>
              <input type="date" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>

            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-5 sm:col-span-2">
              <h3 className="mb-4 text-sm font-bold text-slate-800">Asignación de Personal</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2 rounded border border-slate-300 bg-white p-4">
                  <label className="text-sm font-bold text-slate-700">Contador asignado</label>
                  <select className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                    <option>Juan Pérez (RUT: 15.XXX.XXX-X)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2 rounded border border-slate-300 bg-white p-4">
                  <label className="text-sm font-bold text-slate-700">Supervisor que autoriza</label>
                  <select className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                    <option>Carlos Soto (RUT: 12.XXX.XXX-X)</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
            <Link href="/inventarios" className="rounded-lg px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">Cancelar</Link>
            <button type="button" className="rounded-lg bg-[#2a6877] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#1f4e5a]">Generar Orden de Conteo</button>
          </div>
        </form>
      </div>
    </main>
  );
}