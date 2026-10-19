"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../src/lib/supabase";

export default function StockPage() {
  const [stockCompleto, setStockCompleto] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  // Función para cruzar la tabla "stock" con la tabla "materiales"
  const cargarStock = async () => {
    setCargando(true);
    
    // 1. Traer todo el stock físico que sea mayor a 0
    const { data: stockData } = await supabase
      .from("stock")
      .select("*")
      .gt("cantidad", 0)
      .order("ubicacion", { ascending: true });

    // 2. Traer el catálogo de materiales para saber los nombres
    const { data: materialesData } = await supabase
      .from("materiales")
      .select("*");

    if (stockData && materialesData) {
      // 3. Unir los datos (como un BUSCARV en Excel)
      const stockCruzado = stockData.map((item) => {
        const material = materialesData.find((m) => m.codigo === item.codigo_material);
        return {
          ...item,
          nombre: material ? material.nombre : "Material no registrado",
          um: material ? material.um : "SD",
        };
      });
      setStockCompleto(stockCruzado);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarStock();
  }, []);

  // Función de búsqueda en tiempo real
  const stockFiltrado = stockCompleto.filter(
    (item) =>
      item.codigo_material.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.ubicacion.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Función mágica para exportar directo a Excel con acentos corregidos
  const exportarExcel = () => {
    if (stockFiltrado.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    let csvContent = "Código;Descripción;Ubicación;Cantidad;UM\n";

    stockFiltrado.forEach((item) => {
      const row = `${item.codigo_material};${item.nombre};${item.ubicacion};${item.cantidad};${item.um}`;
      csvContent += row + "\n";
    });

    // LA SOLUCIÓN TÉCNICA: Agregamos "\uFEFF" (BOM de UTF-8) para que Excel de Windows lea los acentos perfecto.
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Stock_Bodega_${new Date().toLocaleDateString("es-CL").replace(/\//g, "-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="p-8 md:p-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#2a6877]">Visión Global</p>
          <h1 className="text-3xl font-bold text-slate-900">Stock en Bodega</h1>
          <p className="mt-1 text-slate-500">Consulta en tiempo real la disponibilidad y ubicación física de repuestos.</p>
        </div>
        <button 
          onClick={exportarExcel}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          <span>📥</span> Descargar Excel
        </button>
      </header>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700">🔍 Buscador Inteligente</label>
          <input 
            type="text" 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código, nombre de repuesto o ubicación (Ej: Filtro, 10045, A-01)..." 
            className="w-full rounded-md border border-slate-300 px-4 py-3 text-sm focus:border-[#2a6877] focus:ring-1 focus:ring-[#2a6877]" 
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800">Inventario Físico ({stockFiltrado.length} registros encontrados)</h2>
          <button onClick={cargarStock} className="text-xs font-bold text-[#2a6877] hover:underline">🔄 Actualizar datos</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-bold">Código SAP</th>
                <th className="px-6 py-3 font-bold">Descripción</th>
                <th className="px-6 py-3 font-bold">Ubicación</th>
                <th className="px-6 py-3 font-bold text-right">Cantidad Disponible</th>
                <th className="px-6 py-3 font-bold">UM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {cargando ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500 font-medium">Cargando inventario desde la base de datos...</td></tr>
              ) : stockFiltrado.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400 font-medium">No se encontraron repuestos con esa búsqueda.</td></tr>
              ) : (
                stockFiltrado.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{item.codigo_material}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{item.nombre}</td>
                    <td className="px-6 py-4">
                      <span className="rounded bg-slate-100 border border-slate-200 px-2 py-1 text-xs font-bold text-slate-700">
                        {item.ubicacion}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600 text-base">{item.cantidad}</td>
                    <td className="px-6 py-4 text-slate-500">{item.um}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}