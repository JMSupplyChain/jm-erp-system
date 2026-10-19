"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../src/lib/supabase";

export default function SalidasPage() {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [um, setUm] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [documento, setDocumento] = useState("");
  const [responsable, setResponsable] = useState("");
  
  const [opcionesStock, setOpcionesStock] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [movimientosHoy, setMovimientosHoy] = useState<any[]>([]);

  // Buscar material y consultar en qué ubicaciones hay stock real
  const buscarMaterialYStock = async (codigoBuscado: string) => {
    if (!codigoBuscado) return;
    
    // 1. Traer nombre del catálogo
    const { data: mat } = await supabase.from("materiales").select("*").eq("codigo", codigoBuscado).single();
    
    if (mat) {
      setNombre(mat.nombre);
      setUm(mat.um);
      
      // 2. Buscar stock disponible mayor a 0 para este código
      const { data: stock } = await supabase
        .from("stock")
        .select("ubicacion, cantidad")
        .eq("codigo_material", codigoBuscado)
        .gt("cantidad", 0);
        
      if (stock && stock.length > 0) {
        setOpcionesStock(stock);
      } else {
        setOpcionesStock([]);
        alert("⚠️ Este material existe, pero actualmente tiene STOCK CERO en la bodega.");
      }
    } else {
      setNombre("");
      setUm("");
      setOpcionesStock([]);
      alert("❌ Código no encontrado en el Maestro de Materiales.");
    }
  };

  const cargarMovimientos = async () => {
    const { data } = await supabase.from("movimientos").select("*").eq("tipo", "SALIDA").order("created_at", { ascending: false }).limit(5);
    if (data) setMovimientosHoy(data);
  };

  useEffect(() => {
    cargarMovimientos();
  }, []);

  const procesarSalida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo || !nombre || !cantidad || !ubicacion) {
      alert("Faltan datos clave para registrar la salida.");
      return;
    }

    setCargando(true);
    const cantNum = Number(cantidad);

    try {
      // 1. Verificar stock actual exacto en la base de datos para esa ubicación
      const { data: stockExistente } = await supabase
        .from("stock")
        .select("*")
        .eq("codigo_material", codigo)
        .eq("ubicacion", ubicacion)
        .single();

      if (!stockExistente) {
        alert("Error crítico: No se encontró la ubicación de stock.");
        setCargando(false);
        return;
      }

      if (stockExistente.cantidad < cantNum) {
        alert(`❌ Error de Stock: Estás intentando sacar ${cantNum}, pero solo quedan ${stockExistente.cantidad} en la ubicación ${ubicacion}.`);
        setCargando(false);
        return;
      }

      // 2. Descontar stock
      const nuevoStock = stockExistente.cantidad - cantNum;
      await supabase.from("stock").update({ cantidad: nuevoStock }).eq("id", stockExistente.id);

      // 3. Registrar el movimiento (Kardex)
      await supabase.from("movimientos").insert([{ 
        tipo: "SALIDA", 
        codigo_material: codigo, 
        cantidad: cantNum, 
        ubicacion: ubicacion, 
        documento: documento, 
        responsable: responsable 
      }]);

      alert(`✅ ¡Despacho exitoso! Se restaron ${cantNum} unidades de la ubicación ${ubicacion}`);
      
      setCodigo(""); setNombre(""); setUm(""); setCantidad(""); setUbicacion(""); setDocumento(""); setOpcionesStock([]);
      cargarMovimientos();
      document.getElementById("input-codigo-salida")?.focus();

    } catch (error) {
      console.error("Error procesando salida:", error);
      alert("Hubo un error de conexión.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="p-8 md:p-12">
      <header className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-600">Logística y Bodega</p>
        <h1 className="text-3xl font-bold text-slate-900">Despacho de Materiales</h1>
        <p className="mt-1 text-slate-500">Registra retiros de bodega, descuenta stock físico y asocia vales de salida.</p>
      </header>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <form onSubmit={procesarSalida}>
          <div className="mb-6 rounded-md bg-amber-50 p-4 border border-amber-100 flex items-start gap-3">
            <span className="text-amber-800 text-lg">📤</span>
            <p className="text-sm font-medium text-amber-900 mt-0.5">Ingresa el código del repuesto. El sistema validará automáticamente en qué ubicaciones tienes stock disponible para despachar.</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 md:grid-cols-4">
            <div className="flex flex-col gap-2 sm:col-span-1">
              <label className="text-sm font-bold text-slate-700">Código Repuesto</label>
              <input id="input-codigo-salida" type="text" value={codigo} onChange={(e) => setCodigo(e.target.value)} onBlur={() => buscarMaterialYStock(codigo)} placeholder="Ej: 10045892" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold focus:border-amber-600 focus:ring-1 focus:ring-amber-600" required />
            </div>
            
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="text-sm font-bold text-slate-700">Descripción</label>
              <input type="text" value={nombre} placeholder="El nombre aparecerá aquí..." className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 focus:outline-none" readOnly required />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-1">
              <label className="text-sm font-bold text-slate-700">UM</label>
              <input type="text" value={um} placeholder="UM" className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 focus:outline-none" readOnly required />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="text-sm font-bold text-slate-700">Seleccionar Ubicación (Stock Disponible)</label>
              <select value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-600 focus:ring-1 focus:ring-amber-600" required disabled={opcionesStock.length === 0}>
                <option value="">{opcionesStock.length === 0 ? "Esperando código válido..." : "Selecciona de dónde sacar..."}</option>
                {opcionesStock.map((op, idx) => (
                  <option key={idx} value={op.ubicacion}>Ubicación: {op.ubicacion} (Disponible: {op.cantidad})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 sm:col-span-1">
              <label className="text-sm font-bold text-slate-700">Cantidad a Retirar</label>
              <input type="number" min="0.1" step="any" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="Ej: 2" className="rounded-md border border-slate-300 px-3 py-2 text-right text-lg font-bold text-amber-700 focus:border-amber-600 focus:ring-1 focus:ring-amber-600" required />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-1">
              <label className="text-sm font-bold text-slate-700">Vale Salida / OT</label>
              <input type="text" value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="Ej: OT-9001" className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-600 focus:ring-1 focus:ring-amber-600" required />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="text-sm font-bold text-slate-700">Retira / Autoriza</label>
              <input type="text" value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Nombre del mecánico o mantenedor..." className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-600 focus:ring-1 focus:ring-amber-600" required />
            </div>
          </div>
          
          <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
            <button type="submit" disabled={cargando || opcionesStock.length === 0} className="rounded-lg bg-amber-600 px-8 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-amber-700 disabled:opacity-50">
              {cargando ? "Procesando..." : "Confirmar Salida de Bodega"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-800">Últimos 5 despachos procesados hoy</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-bold">Código</th>
                <th className="px-6 py-3 font-bold">Cantidad</th>
                <th className="px-6 py-3 font-bold">Ubicación Origen</th>
                <th className="px-6 py-3 font-bold">Documento</th>
                <th className="px-6 py-3 font-bold">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {movimientosHoy.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center text-slate-400">Sin salidas registradas aún.</td></tr>
              ) : (
                movimientosHoy.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-bold">{mov.codigo_material}</td>
                    <td className="px-6 py-3 font-bold text-red-600">-{mov.cantidad}</td>
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