"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [totalMateriales, setTotalMateriales] = useState(0);
  const [totalUnidades, setTotalUnidades] = useState(0);
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalSalidas, setTotalSalidas] = useState(0);
  const [inventarios, setInventarios] = useState<any[]>([]);
  const [datosGrafico, setDatosGrafico] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = async () => {
    setCargando(true);

    try {
      // 1. Contar total de repuestos en el Maestro de Materiales
      const { count: countMat } = await supabase
        .from("materiales")
        .select("*", { count: "exact", head: true });
      if (countMat) setTotalMateriales(countMat);

      // 2. Sumar el total de unidades físicas en toda la bodega y armar gráfico de ubicaciones
      const { data: stockData } = await supabase.from("stock").select("cantidad, ubicacion");
      if (stockData) {
        // Suma global
        const suma = stockData.reduce((acc, curr) => acc + Number(curr.cantidad), 0);
        setTotalUnidades(suma);

        // Agrupar para el gráfico: Top 5 ubicaciones con más carga
        const ubicaciones: Record<string, number> = {};
        stockData.forEach((s) => {
          if (s.ubicacion) {
            ubicaciones[s.ubicacion] = (ubicaciones[s.ubicacion] || 0) + Number(s.cantidad);
          }
        });
        
        const chartData = Object.keys(ubicaciones)
          .map(key => ({ ubicacion: key, Unidades: ubicaciones[key] }))
          .sort((a, b) => b.Unidades - a.Unidades)
          .slice(0, 5); // Tomar solo las 5 principales
        
        setDatosGrafico(chartData);
      }

      // 3. Contabilizar los movimientos logísticos históricos
      const { data: movData } = await supabase.from("movimientos").select("tipo");
      if (movData) {
        const entradas = movData.filter((m) => m.tipo === "ENTRADA").length;
        const salidas = movData.filter((m) => m.tipo === "SALIDA").length;
        setTotalEntradas(entradas);
        setTotalSalidas(salidas);
      }

      // 4. Traer los últimos 3 inventarios creados en el sistema
      const { data: invData } = await supabase
        .from("inventarios")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      if (invData) setInventarios(invData);

    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <main className="p-8 md:p-12">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-800">
            JM Supply Chain · Producto Digital
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Panel de Control Global</h1>
          <p className="mt-1 text-slate-500">
            Resumen en tiempo real del estado de tu bodega y operaciones logísticas.
          </p>
        </div>
        <button 
          onClick={cargarDatos}
          className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
        >
          {cargando ? "Sincronizando..." : "🔄 Actualizar Datos"}
        </button>
      </header>

      {/* Tarjetas de Métricas Reales */}
      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm border-t-4 border-t-slate-800">
          <p className="text-sm font-semibold text-slate-500">Catálogo Maestro</p>
          <p className="mt-2 text-4xl font-bold text-slate-900">
            {cargando ? "..." : totalMateriales}
          </p>
          <p className="mt-1 text-xs text-slate-400">Repuestos únicos creados</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm border-t-4 border-t-emerald-600">
          <p className="text-sm font-semibold text-slate-500">Unidades Físicas</p>
          <p className="mt-2 text-4xl font-bold text-slate-900">
            {cargando ? "..." : totalUnidades}
          </p>
          <p className="mt-1 text-xs text-slate-400">Total de stock en bodega</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm border-t-4 border-t-blue-500">
          <p className="text-sm font-semibold text-slate-500">Total Ingresos</p>
          <p className="mt-2 text-4xl font-bold text-slate-900">
            {cargando ? "..." : totalEntradas}
          </p>
          <p className="mt-1 text-xs text-slate-400">Operaciones de entrada</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm border-t-4 border-t-amber-500">
          <p className="text-sm font-semibold text-slate-500">Total Despachos</p>
          <p className="mt-2 text-4xl font-bold text-slate-900">
            {cargando ? "..." : totalSalidas}
          </p>
          <p className="mt-1 text-xs text-slate-400">Operaciones de salida</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Bloque Izquierdo: Resumen de Inventarios Reales */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Últimos inventarios en proceso</h2>
            <p className="mb-6 mt-1 text-sm text-slate-500">
              Órdenes de conteo físico registradas recientemente.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-900">
                  <tr>
                    <th className="pb-3 font-bold">Folio</th>
                    <th className="pb-3 font-bold">Tipo / Título</th>
                    <th className="pb-3 font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {inventarios.length === 0 && !cargando ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400">
                        No hay inventarios creados aún.
                      </td>
                    </tr>
                  ) : (
                    inventarios.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 font-bold text-slate-900">{inv.folio}</td>
                        <td className="py-4 font-medium">{inv.tipo} - {inv.titulo}</td>
                        <td className="py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            inv.estado === "Vigente" ? "bg-blue-100 text-blue-800" :
                            inv.estado === "Pendiente de Aprobación" ? "bg-amber-100 text-amber-800" :
                            "bg-emerald-100 text-emerald-800"
                          }`}>
                            {inv.estado}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-6 text-right">
            <Link href="/inventarios" className="text-sm font-bold text-[#2a6877] hover:underline">
              Ir al módulo de Inventario Físico →
            </Link>
          </div>
        </div>

        {/* Bloque Derecho: GRÁFICO REAL DE UBICACIONES */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Mapa de Carga por Ubicación</h2>
            <p className="mt-1 text-sm text-slate-500">Top 5 Racks con mayor cantidad de unidades físicas.</p>
          </div>
          
          <div className="h-64 w-full flex-1">
            {datosGrafico.length === 0 && !cargando ? (
              <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                No hay stock registrado para graficar.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGrafico} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="ubicacion" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }} 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }} 
                    labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="Unidades" fill="#2a6877" radius={[4, 4, 0, 0]} barSize={45} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </section>
    </main>
  );
}