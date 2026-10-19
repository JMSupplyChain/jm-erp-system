"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function MaterialesPage() {
  const [materiales, setMateriales] = useState<any[]>([]);
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [um, setUm] = useState("");
  const [cargando, setCargando] = useState(false);

  // Cargar lista desde Supabase
  const cargarMateriales = async () => {
    const { data } = await supabase
      .from("materiales")
      .select("*")
      .order("nombre", { ascending: true });
    if (data) setMateriales(data);
  };

  useEffect(() => {
    cargarMateriales();
  }, []);

  // Agregar nuevo material
  const agregarMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo || !nombre || !um) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    setCargando(true);
    
    // Validar que el código no exista previamente
    const { data: existe } = await supabase
      .from("materiales")
      .select("codigo")
      .eq("codigo", codigo)
      .single();

    if (existe) {
      alert("⚠️ Este código ya existe en el catálogo.");
      setCargando(false);
      return;
    }

    // Insertar a la base de datos
    const { error } = await supabase.from("materiales").insert([{ codigo, nombre, um }]);
    setCargando(false);

    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      alert("✅ Repuesto agregado exitosamente al catálogo oficial.");
      setCodigo(""); 
      setNombre(""); 
      setUm("");
      cargarMateriales();
    }
  };

  return (
    <main className="p-8 md:p-12 bg-slate-50 min-h-screen">
      <header className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#2a6877]">Base de Datos</p>
        <h1 className="text-3xl font-bold text-slate-900">Maestro de Materiales</h1>
        <p className="mt-1 text-slate-500">Catálogo oficial de repuestos. Los registros nuevos estarán disponibles para todo el ERP.</p>
      </header>

      {/* Formulario de Creación */}
      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="mb-6 text-lg font-bold text-slate-800">Crear Nuevo Repuesto</h2>
        <form onSubmit={agregarMaterial}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Código SAP / Único</label>
              <input 
                type="text" 
                value={codigo} 
                onChange={(e) => setCodigo(e.target.value)} 
                placeholder="Ej: REP-100" 
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#2a6877] focus:ring-1 focus:ring-[#2a6877]" 
                required 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Descripción / Nombre</label>
              <input 
                type="text" 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)} 
                placeholder="Filtro de aire primario..." 
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#2a6877] focus:ring-1 focus:ring-[#2a6877]" 
                required 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Unidad de Medida (UM)</label>
              <select 
                value={um} 
                onChange={(e) => setUm(e.target.value)} 
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#2a6877] focus:ring-1 focus:ring-[#2a6877]" 
                required
              >
                <option value="">Seleccionar...</option>
                <option value="UN">Unidad (UN)</option>
                <option value="CJ">Caja (CJ)</option>
                <option value="LTS">Litros (LTS)</option>
                <option value="KGS">Kilos (KGS)</option>
                <option value="MTS">Metros (MTS)</option>
              </select>
            </div>
          </div>
          <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
            <button 
              type="submit" 
              disabled={cargando} 
              className="rounded-lg bg-[#2a6877] px-8 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#1f4e5a] disabled:opacity-50 transition-colors"
            >
              {cargando ? "Guardando..." : "+ Agregar al Catálogo Oficial"}
            </button>
          </div>
        </form>
      </section>

      {/* Tabla de Resultados */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-800">Listado Maestro Activo ({materiales.length} registros)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-bold">Código</th>
                <th className="px-6 py-3 font-bold">Descripción</th>
                <th className="px-6 py-3 font-bold">UM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {materiales.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400">
                    Aún no hay repuestos registrados en el sistema.
                  </td>
                </tr>
              ) : (
                materiales.map((mat) => (
                  <tr key={mat.codigo} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{mat.codigo}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{mat.nombre}</td>
                    <td className="px-6 py-4">
                      <span className="rounded bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200">
                        {mat.um}
                      </span>
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