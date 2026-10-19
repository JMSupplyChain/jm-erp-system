"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../src/lib/supabase";

export default function EntradasPage() {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [um, setUm] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [documento, setDocumento] = useState("");
  const [responsable, setResponsable] = useState("");
  
  const [esNuevo, setEsNuevo] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [movimientosHoy, setMovimientosHoy] = useState<any[]>([]);

  const buscarMaterial = async (codigoBuscado: string) => {
    if (!codigoBuscado) return;
    const { data, error } = await supabase.from("materiales").select("*").eq("codigo", codigoBuscado).single();
    if (data) {
      setNombre(data.nombre);
      setUm(data.um);
      setEsNuevo(false);
    } else {
      setEsNuevo(true);
      setNombre("");
      setUm("");
    }
  };

  const cargarMovimientos = async () => {
    const { data } = await supabase.from("movimientos").select("*").eq("tipo", "ENTRADA").order("created_at", { ascending: false }).limit(5);
    if (data) setMovimientosHoy(data);
  };

  useEffect(() => {
    cargarMovimientos();
  }, []);

  const procesarEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo || !nombre || !cantidad || !ubicacion) {
      alert("Faltan datos clave (Código, Nombre, Cantidad o Ubicación)");
      return;
    }

    setCargando(true);
    const cantNum = Number(cantidad);

    try {
      if (esNuevo) {
        await supabase.from("materiales").insert([{ codigo, nombre, um }]);
      }

      const { data: stockExistente } = await supabase.from("stock").select("*").eq("codigo_material", codigo).eq("ubicacion", ubicacion).single();

      if (stockExistente) {
        await supabase.from("stock").update({ cantidad: stockExistente.cantidad + cantNum }).eq("codigo_material", codigo).eq("ubicacion", ubicacion);
      } else {
        await supabase.from("stock").insert([{ codigo_material: codigo, ubicacion, cantidad: cantNum }]);
      }

      await supabase.from("movimientos").insert([{ tipo: "ENTRADA", codigo_material: codigo, cantidad: cantNum, ubicacion: ubicacion, documento: documento, responsable: responsable }]);

      alert(`✅ ¡Ingreso exitoso! ${cantNum} unidades a la ubicación ${ubicacion}`);
      
      setCodigo(""); setNombre(""); setUm(""); setCantidad(""); setUbicacion(""); setDocumento("");
      cargarMovimientos();
      document.getElementById("input-codigo")?.focus();

    } catch (error) {
      console.error("Error procesando entrada:", error);
      alert("Hubo un error de conexión.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="p-8 md:p-12">
      <header className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#2a6877]">Logística y Bodega</p>
        <h1 className="text-3xl font-bold text-slate-900">Ingreso de Mercancía</h1>
        <p className="mt-1 text-slate-500">Registra repuestos nuevos o suma stock mediante Guías de Despacho.</p>
      </header>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <form onSubmit={procesarEntrada}>
          <div className="mb-6 rounded-md bg-blue-50 p-4 border border-blue-100 flex items-start gap-3">
            <span className="text-blue-800 text-lg">ℹ️</span>
            <p className="text-sm font-medium text-blue-900 mt-0.5">Ingresa el código. Si el sistema lo reconoce, autocompletará el nombre. Si es un repuesto nuevo, podrás registrarlo aquí mismo.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 md:grid-cols-4">
            <div className="flex flex-col gap-2 sm:col-span-1">
              <label className="text-sm font-bold text-slate-700">Código Repuesto</label>
              <input id="input-codigo" type="text" value={codigo} onChange={(e) => setCodigo(e.target.value)} onBlur={() => buscarMaterial(codigo)} placeholder="Ej: 10045892" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold focus:border-[#2a6877] focus:ring-1 focus:ring-[#2a6877]" required />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">Descripción {esNuevo === false && <span className="text-emerald-600 font-normal ml-2">(Material reconocido)</span>}</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Filtro de Aceite Komatsu..." className={`rounded-md border px-3 py-2 text-sm focus:outline-none ${esNuevo === false ? 'bg-slate-50 border-slate-200 text-slate-600' : 'border-slate-300 focus:border-[#2a6877] focus:ring-1 focus:ring-[#2a6877]'}`} readOnly={!esNuevo} required />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-1">
              <label className="text-sm font-bold text-slate-700">Unid. Medida</label>
              <select value={um} onChange={(e) => setUm(e.target.value)} className={`rounded-md border px-3 py-2 text-sm ${esNuevo === false ? 'bg-slate-50 border-slate-200 text-slate-600' : 'border-slate-300 focus:border-[#2a6877] focus:ring-1 focus:ring-[#2a6877]'}`} disabled={!esNuevo} required>
                <option value="">Seleccione...</option>
                <option value="UN">Unidad (UN)</option>
                <option value="CJ">Caja (CJ)</option>
                <option value="LTS">Litros (LTS)</option>
                <option value="KGS">Kilos (KGS)</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-1">
              <label className="text-sm font-bold text-slate-700">Cantidad Recibida</label>
              <input type="number" min="0.1" step="any" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="Ej: 10" className="rounded-md border border-slate-300 px-3 py-2 text-right text-lg font-bold text-[#2a6877] focus:border-[#2a6877] focus:ring-1 focus:ring-[#2a6877]" required />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-1">
              <label className="text-sm font-bold text-slate-700">Ubicación (Rack/Pasillo)</label>
              <input type="text" value={ubicacion} onChange={(e) => setUbicacion(e.target.value.toUpperCase())} placeholder="Ej: A-01-04" className="rounded-md border border-slate-300 px-3 py-2 text-sm uppercase focus:border-[#2a6877] focus:ring-1 focus:ring-[#2a6877]" required />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-1">
              <label className="text-sm font-bold text-slate-700">N° Guía de Despacho</label>
              <input type="text" value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="Ej: GD-45920" className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#2a6877] focus:ring-1 focus:ring-[#2a6877]" required />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-1">
              <label className="text-sm font-bold text-slate-700">Responsable (Pañolero)</label>
              <input type="text" value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Tu nombre..." className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#2a6877] focus:ring-1 focus:ring-[#2a6877]" required />
            </div>
          </div>
          <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
            <button type="submit" disabled={cargando} className="rounded-lg bg-[#2a6877] px-8 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#1f4e5a] disabled:opacity-50">
              {cargando ? "Registrando..." : "Confirmar Ingreso a Bodega"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-800">Últimos 5 ingresos procesados hoy</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-bold">Código</th>
                <th className="px-6 py-3 font-bold">Cantidad</th>
                <th className="px-6 py-3 font-bold">Ubicación</th>
                <th className="px-6 py-3 font-bold">Documento</th>
                <th className="px-6 py-3 font-bold">Pañolero</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {movimientosHoy.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center text-slate-400">Sin movimientos registrados aún.</td></tr>
              ) : (
                movimientosHoy.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-bold">{mov.codigo_material}</td>
                    <td className="px-6 py-3 font-bold text-emerald-600">+{mov.cantidad}</td>
                    <td className="px-6 py-3"><span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold">{mov.ubicacion}</span></td>
                    <td className="px-6 py-3">{mov.documento}</td>
                    <td className="px-6 py-3">{mov.responsable}</td>
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