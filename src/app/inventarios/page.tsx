"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function InventariosPage() {
  const [tipo, setTipo] = useState("");
  const [titulo, setTitulo] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [responsable, setResponsable] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [codigos, setCodigos] = useState(""); // Para el inventario cíclico
  
  const [cargando, setCargando] = useState(false);
  const [inventarios, setInventarios] = useState<any[]>([]);

  const cargarInventarios = async () => {
    const { data, error } = await supabase
      .from("inventarios")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setInventarios(data);
    if (error) console.error("Error al cargar datos:", error);
  };

  useEffect(() => {
    cargarInventarios();
  }, []);

  const generarDocumento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !tipo || !fechaInicio || !fechaFin) {
      alert("Faltan datos obligatorios (Tipo, Título o Fechas).");
      return;
    }

    if (tipo === "Cíclico" && !codigos.trim()) {
      alert("Para un inventario cíclico, debes ingresar los códigos a contar.");
      return;
    }

    setCargando(true);
    const correlativo = Math.floor(Math.random() * 9000) + 1000;
    const nuevoFolio = `INV-2026-${correlativo}`;

    // Limpiar los códigos
    const codigosLimpios = tipo === "Cíclico" 
      ? codigos.split(/[\n,]+/).map(c => c.trim()).filter(c => c !== "").join(",")
      : "";

    const { error } = await supabase.from("inventarios").insert([
      {
        folio: nuevoFolio,
        titulo: titulo,
        tipo: tipo,
        estado: "Vigente",
        responsable: responsable,
        supervisor: supervisor,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        codigos_asignados: codigosLimpios
      }
    ]);

    setCargando(false);

    if (error) {
      alert("Hubo un error al guardar: " + error.message);
    } else {
      alert("¡Documento de inventario generado con éxito!");
      setTitulo(""); setTipo(""); setResponsable(""); setSupervisor(""); 
      setFechaInicio(""); setFechaFin(""); setCodigos("");
      cargarInventarios();
    }
  };

  return (
    <main className="p-8 md:p-12">
      <header className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-800">Planificación Logística</p>
        <h1 className="text-3xl font-bold text-slate-900">Gestión de Inventarios</h1>
        <p className="mt-1 text-slate-500">Planifica levantamientos físicos, asigna fechas y genera documentos de conteo.</p>
      </header>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="mb-6 text-lg font-bold text-slate-900">Crear Nueva Orden de Inventario</h2>
        <form onSubmit={generarDocumento}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Tipo de inventario</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#2a6877] focus:ring-1 focus:ring-[#2a6877]">
                <option value="">Seleccionar tipo...</option>
                <option value="Cíclico">Cíclico (Por códigos específicos)</option>
                <option value="General">General (Bodega Completa)</option>
                <option value="Selectivo">Selectivo (Por familia/zona)</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">Título / Descripción de la Tarea</label>
              <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Conteo Semanal Repuestos Críticos" className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#2a6877] focus:ring-1 focus:ring-[#2a6877]" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Fecha Inicio</label>
              <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#2a6877] focus:ring-1 focus:ring-[#2a6877]" required />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Fecha Fin (Cierre máximo)</label>
              <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#2a6877] focus:ring-1 focus:ring-[#2a6877]" required />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Responsable (Auditor)</label>
              <input type="text" value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Ej: Juan Pérez" className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#2a6877] focus:ring-1 focus:ring-[#2a6877]" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Supervisor que autoriza</label>
              <input type="text" value={supervisor} onChange={(e) => setSupervisor(e.target.value)} placeholder="Ej: Carlos Soto" className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#2a6877] focus:ring-1 focus:ring-[#2a6877]" />
            </div>

            {/* SECCIÓN DINÁMICA: Solo aparece si eligen Cíclico */}
            {tipo === "Cíclico" && (
              <div className="flex flex-col gap-2 md:col-span-3 mt-2 rounded-lg bg-blue-50 p-4 border border-blue-100">
                <label className="text-sm font-bold text-blue-900">📋 Códigos a auditar (Inventario Cíclico)</label>
                <p className="text-xs text-blue-800 mb-1">Pega aquí los códigos de los repuestos que se deben contar. Puedes separarlos por coma o saltos de línea.</p>
                <textarea 
                  value={codigos} 
                  onChange={(e) => setCodigos(e.target.value)} 
                  placeholder="FL190500&#10;100-220-23847&#10;REP-003" 
                  rows={4}
                  className="rounded-md border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
            <button type="button" onClick={() => { setTitulo(""); setTipo(""); setFechaInicio(""); setFechaFin(""); setCodigos(""); }} className="rounded-lg px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">Limpiar</button>
            <button type="submit" disabled={cargando} className="rounded-lg bg-[#2a6877] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#1f4e5a] disabled:opacity-50">
              {cargando ? "Guardando..." : "Generar Orden de Inventario"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-800">Inventarios Realizados y Activos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-slate-200 bg-white text-slate-900">
              <tr>
                <th className="px-6 py-4 font-bold">Folio</th>
                <th className="px-6 py-4 font-bold">Detalle / Tipo</th>
                <th className="px-6 py-4 font-bold">Plazo (Inicio - Fin)</th>
                <th className="px-6 py-4 font-bold">Responsables</th>
                <th className="px-6 py-4 font-bold">Estado</th>
                <th className="px-6 py-4 font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {inventarios.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-500">Aún no hay inventarios registrados.</td></tr>
              ) : (
                inventarios.map((inv) => (
                  <tr key={inv.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">{inv.folio}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold">{inv.titulo}</p>
                      <p className="text-xs text-slate-400">{inv.tipo}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">
                      {inv.fecha_inicio ? new Date(inv.fecha_inicio).toLocaleDateString("es-CL") : "-"} <br/>
                      al {inv.fecha_fin ? new Date(inv.fecha_fin).toLocaleDateString("es-CL") : "-"}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <p><span className="font-bold">Auditor:</span> {inv.responsable || "N/A"}</p>
                      <p><span className="font-bold">Sup:</span> {inv.supervisor || "N/A"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        inv.estado === "Vigente" ? "bg-blue-100 text-blue-800" :
                        inv.estado === "Pendiente Revisión" ? "bg-amber-100 text-amber-800" :
                        "bg-emerald-100 text-emerald-800"
                      }`}>
                        {inv.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        {inv.estado === "Vigente" ? (
                          <>
                            <Link href={`/inventarios/ejecucion?folio=${inv.folio}`} className="rounded-md bg-slate-100 px-3 py-1.5 font-bold text-[#2a6877] hover:bg-slate-200 transition-colors">
                              Ejecutar
                            </Link>
                            <Link href={`/inventarios/imprimir?folio=${inv.folio}`} target="_blank" className="rounded-md bg-slate-800 px-3 py-1.5 font-bold text-white hover:bg-slate-900 transition-colors">
                              🖨️ Imprimir
                            </Link>
                          </>
                        ) : inv.estado === "Pendiente Revisión" ? (
                          <Link href={`/inventarios/revision?folio=${inv.folio}`} className="rounded-md bg-indigo-100 px-3 py-1.5 font-bold text-indigo-700 hover:bg-indigo-200 transition-colors">
                            👁️ Revisar Jefatura
                          </Link>
                        ) : (
                          <span className="text-xs text-emerald-600 font-bold">Cerrado</span>
                        )}
                      </div>
                    </td>
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