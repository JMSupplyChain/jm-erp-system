"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../../src/lib/supabase";

function EjecucionInventario() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const folio = searchParams.get("folio");

  const [inventario, setInventario] = useState<any>(null);
  const [lineas, setLineas] = useState<any[]>([]);
  const [fechaEjecucion, setFechaEjecucion] = useState(new Date().toISOString().split('T')[0]);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (folio) cargarDatosLogisticos();
  }, [folio]);

  const cargarDatosLogisticos = async () => {
    const { data: invData } = await supabase.from("inventarios").select("*").eq("folio", folio).single();
    if (!invData) return;
    setInventario(invData);

    if (invData.tipo === "Cíclico" && invData.codigos_asignados) {
      const codigosArray = invData.codigos_asignados.split(",").map((c: string) => c.trim());
      const { data: stockData } = await supabase.from("stock").select("codigo_material, ubicacion, cantidad").in("codigo_material", codigosArray).gt("cantidad", 0);

      let filasConstruidas: any[] = [];
      codigosArray.forEach((codigo) => {
        const ubicacionesDelCodigo = stockData?.filter((s) => s.codigo_material === codigo) || [];
        if (ubicacionesDelCodigo.length > 0) {
          ubicacionesDelCodigo.forEach((ub) => {
            filasConstruidas.push({ codigo, ubicacion: ub.ubicacion, teorico: ub.cantidad, fisico: "", diferencia: 0 });
          });
        } else {
          filasConstruidas.push({ codigo, ubicacion: "SIN REGISTRO", teorico: 0, fisico: "", diferencia: 0 });
        }
      });
      setLineas(filasConstruidas);
    }
  };

  const actualizarConteo = (index: number, valor: string) => {
    const nuevasLineas = [...lineas];
    nuevasLineas[index].fisico = valor;
    if (valor !== "") {
      nuevasLineas[index].diferencia = Number(valor) - nuevasLineas[index].teorico;
    } else {
      nuevasLineas[index].diferencia = 0;
    }
    setLineas(nuevasLineas);
  };

  // Función para ir acumulando los archivos que sube el bodeguero
  const agregarArchivosAuditor = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const nuevosArchivos = Array.from(e.target.files);
      setArchivos((previos) => [...previos, ...nuevosArchivos]);
    }
  };

  // Función para quitar un archivo si la foto salió mal
  const quitarArchivoAuditor = (index: number) => {
    setArchivos((previos) => previos.filter((_, i) => i !== index));
  };

  const enviarAValidacion = async () => {
    const incompletos = lineas.some(l => l.fisico === "");
    if (incompletos) {
      alert("⚠️ Debes ingresar el conteo físico para todas las líneas. Si no hay stock, ingresa 0.");
      return;
    }

    const confirmar = window.confirm("¿Confirmas el envío de este conteo al Supervisor?");
    if (!confirmar) return;

    setCargando(true);

    try {
      // Subir múltiples archivos físicos a Supabase Storage
      let urlsArchivos: string[] = [];
      for (const file of archivos) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folio}-terreno-${Date.now()}-${Math.floor(Math.random()*1000)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from("evidencias").upload(fileName, file);
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from("evidencias").getPublicUrl(fileName);
          urlsArchivos.push(publicUrlData.publicUrl);
        }
      }

      const resultadosJSON = JSON.stringify(lineas);
      const archivosJSON = JSON.stringify(urlsArchivos);

      await supabase.from("inventarios").update({ 
        estado: "Pendiente Revisión",
        fecha_ejecucion: fechaEjecucion,
        resultados: resultadosJSON,
        archivo_respaldo: urlsArchivos.length > 0 ? archivosJSON : null
      }).eq("folio", folio);
      
      alert("✅ Conteo y evidencias subidas exitosamente.");
      router.push("/inventarios");

    } catch (error) {
      console.error(error);
      alert("Hubo un error al enviar el conteo.");
    } finally {
      setCargando(false);
    }
  };

  if (!inventario) return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 font-bold">Cargando hoja...</div>;

  return (
    <main className="p-8 md:p-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-700">Trabajo en Terreno</p>
          <h1 className="text-3xl font-bold text-slate-900">Digitación de Conteo</h1>
          <p className="mt-1 text-slate-500">Documento: <span className="font-bold text-slate-700">{inventario.folio}</span></p>
        </div>
        <Link href="/inventarios" className="rounded-lg bg-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-300 transition-colors">← Volver</Link>
      </header>

      {inventario.estado !== "Vigente" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
          <p className="text-4xl">⏳</p>
          <h2 className="mt-4 text-xl font-bold text-amber-900">Conteo ya ingresado</h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
          <section className="flex flex-col gap-6 xl:col-span-1">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-slate-900 uppercase">1. Ingreso</h2>
              <input type="date" value={fechaEjecucion} onChange={(e) => setFechaEjecucion(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600" />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-slate-900 uppercase">2. Evidencias Múltiples</h2>
              <p className="text-xs text-slate-500 mb-4">Sube la hoja firmada y fotos de repuestos dañados.</p>
              <input 
                type="file" 
                multiple 
                accept="image/*,.pdf" 
                onChange={agregarArchivosAuditor}
                className="w-full text-sm text-slate-500 file:mr-4 file:rounded-md file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
              
              {/* ÁREA DE VISUALIZACIÓN DE ARCHIVOS SELECCIONADOS */}
              {archivos.length > 0 && (
                <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold text-emerald-600">✅ {archivos.length} archivo(s) listo(s) para subir:</p>
                  {archivos.map((file, index) => (
                    <div key={index} className="flex justify-between items-center bg-slate-50 rounded-md px-2 py-1.5 border border-slate-200">
                      <span className="text-xs text-slate-600 truncate w-3/4" title={file.name}>📎 {file.name}</span>
                      <button type="button" onClick={() => quitarArchivoAuditor(index)} className="text-red-500 text-xs font-bold hover:text-red-700 px-2">X</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="border-b border-slate-200 bg-white text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">Ubicación</th>
                    <th className="px-6 py-3">Código</th>
                    <th className="px-6 py-3 text-center">Teórico</th>
                    <th className="px-6 py-3 text-center bg-emerald-50">Conteo Físico</th>
                    <th className="px-6 py-3 text-center">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineas.map((linea, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-bold text-slate-600">{linea.ubicacion}</td>
                      <td className="px-6 py-3 font-bold">{linea.codigo}</td>
                      <td className="px-6 py-3 text-center">{linea.teorico}</td>
                      <td className="px-6 py-3 bg-emerald-50/30">
                        <input type="number" min="0" value={linea.fisico} onChange={(e) => actualizarConteo(idx, e.target.value)} className="w-full rounded border border-emerald-300 px-3 py-2 text-center text-lg font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-600/50" />
                      </td>
                      <td className="px-6 py-3 text-center font-bold">
                        {linea.fisico !== "" && (
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                            linea.diferencia === 0 ? "bg-slate-100 text-slate-500" :
                            linea.diferencia > 0 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                          }`}>
                            {linea.diferencia > 0 ? `+${linea.diferencia}` : linea.diferencia < 0 ? `${linea.diferencia}` : "OK"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-200 bg-slate-50 p-6 flex justify-end">
              <button onClick={enviarAValidacion} disabled={cargando} className="rounded-lg bg-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {cargando ? "Subiendo archivos..." : "Registrar Conteo ➔"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default function EjecucionPage() {
  return <Suspense fallback={<div className="p-12 text-center">Cargando...</div>}><EjecucionInventario /></Suspense>;
}