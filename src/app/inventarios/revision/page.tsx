"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../../src/lib/supabase";

function RevisionInventario() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const folio = searchParams.get("folio");

  const [inventario, setInventario] = useState<any>(null);
  const [resultados, setResultados] = useState<any[]>([]);
  const [archivosTerreno, setArchivosTerreno] = useState<string[]>([]);
  const [archivosAuth, setArchivosAuth] = useState<File[]>([]);
  const [cargando, setCargando] = useState(false);

  const inputArchivoRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setArchivosAuth([]);
    if (inputArchivoRef.current) {
      inputArchivoRef.current.value = "";
    }

    if (folio) {
      cargarRevision();
    }
  }, [folio]);

  const cargarRevision = async () => {
    const { data } = await supabase.from("inventarios").select("*").eq("folio", folio).single();
    if (data) {
      setInventario(data);
      if (data.resultados) {
        try {
          setResultados(JSON.parse(data.resultados));
        } catch {
          setResultados([]);
        }
      }
      if (data.archivo_respaldo) {
        try {
          const parsed = JSON.parse(data.archivo_respaldo);
          setArchivosTerreno(Array.isArray(parsed) ? parsed : [data.archivo_respaldo]);
        } catch {
          setArchivosTerreno([data.archivo_respaldo]);
        }
      } else {
        setArchivosTerreno([]);
      }
    }
  };

  const agregarArchivosSupervisor = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const nuevosArchivos = Array.from(e.target.files);
      setArchivosAuth((previos) => [...previos, ...nuevosArchivos]);
      if (inputArchivoRef.current) {
        inputArchivoRef.current.value = "";
      }
    }
  };

  const quitarArchivoSupervisor = (index: number) => {
    setArchivosAuth((previos) => previos.filter((_, i) => i !== index));
  };

  const procesarAutorizacion = async (accion: "APROBAR" | "RECHAZAR") => {
    if (accion === "RECHAZAR") {
      if (!window.confirm("¿Estás seguro de enviar a recontar? El documento volverá a estar Vigente para el auditor.")) return;
      setCargando(true);
      await supabase.from("inventarios").update({ estado: "Vigente", resultados: null, archivo_respaldo: null }).eq("folio", folio);
      alert("⚠️ Inventario devuelto a terreno para reconteo.");
      router.push("/inventarios");
      return;
    }

    const tieneDiferencias = resultados.some(r => r.diferencia !== 0);
    if (tieneDiferencias && archivosAuth.length === 0) {
      if (!window.confirm("⚠️ ALERTA FINANCIERA: Hay descuadres y no adjuntaste la evidencia de autorización del supervisor. ¿Aceptar y consolidar de todos modos?")) return;
    } else {
      if (!window.confirm("¿Aceptar y consolidar el cierre? Esto modificará el Stock Oficial.")) return;
    }

    setCargando(true);

    try {
      let urlsAuth: string[] = [];
      for (const file of archivosAuth) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folio}-supervisor-${Date.now()}-${Math.floor(Math.random()*1000)}.${fileExt}`;
        const { error } = await supabase.storage.from("evidencias").upload(fileName, file);
        if (!error) {
          const { data: publicUrlData } = supabase.storage.from("evidencias").getPublicUrl(fileName);
          urlsAuth.push(publicUrlData.publicUrl);
        }
      }

      for (const item of resultados) {
        if (item.diferencia !== 0 && item.fisico !== "") {
          const fisicoNum = Number(item.fisico);
          if (item.teorico === 0) {
             await supabase.from("stock").insert([{ codigo_material: item.codigo, ubicacion: item.ubicacion, cantidad: fisicoNum }]);
          } else {
             await supabase.from("stock").update({ cantidad: fisicoNum }).eq("codigo_material", item.codigo).eq("ubicacion", item.ubicacion);
          }
          const tipoAjuste = item.diferencia > 0 ? "AJUSTE (SOBRANTE)" : "AJUSTE (FALTANTE)";
          await supabase.from("movimientos").insert([{
            tipo: tipoAjuste, codigo_material: item.codigo, cantidad: Math.abs(item.diferencia), ubicacion: item.ubicacion, documento: folio, responsable: inventario?.supervisor || "Supervisor"
          }]);
        }
      }

      await supabase.from("inventarios").update({ 
        estado: "Cerrado y Contabilizado",
        archivo_autorizacion: urlsAuth.length > 0 ? JSON.stringify(urlsAuth) : "Consolidado sin archivo adjunto"
      }).eq("folio", folio);
      
      alert("✅ Ajustes consolidados exitosamente.");
      router.push("/inventarios");

    } catch (error) {
      alert("Error procesando la consolidación.");
      setCargando(false);
    }
  };

  if (!inventario) return <div className="flex min-h-screen items-center justify-center bg-slate-50 font-bold text-slate-500">Cargando revisión...</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-8 md:p-12 text-slate-800">
      <header className="mb-8 flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#2a6877]">Validación de Jefatura</p>
          <h1 className="text-3xl font-bold text-slate-900">Auditoría de Inventario</h1>
          <p className="mt-1 text-slate-500">Documento: <span className="font-bold text-slate-700">{inventario.folio}</span></p>
        </div>
        <Link href="/inventarios" className="rounded-lg bg-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-300 transition-colors">
          ← Volver al Panel
        </Link>
      </header>

      {inventario.estado !== "Pendiente Revisión" ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xl font-bold text-slate-700">Este inventario ya fue procesado.</p>
          <p className="mt-2 text-slate-500">Estado actual: {inventario.estado}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
          
          <section className="flex flex-col gap-6 xl:col-span-1">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">1. Resumen Operativo</h2>
              <div className="space-y-3 text-sm">
                <p><span className="font-bold text-slate-500">Título:</span> {inventario.titulo}</p>
                <p><span className="font-bold text-slate-500">Tipo:</span> {inventario.tipo}</p>
                <p><span className="font-bold text-slate-500">Carga Terreno:</span> {inventario.fecha_ejecucion}</p>
                <p><span className="font-bold text-slate-500">Auditor:</span> {inventario.responsable}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-900">2. Evidencia de Terreno</h2>
              <p className="text-xs text-slate-500 mb-4">Archivos subidos por el auditor.</p>
              {archivosTerreno.length === 0 ? (
                <p className="text-xs font-bold text-slate-500">Ningún archivo adjunto.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {archivosTerreno.map((url, idx) => {
                    const esLink = typeof url === "string" && url.startsWith("http");
                    return esLink ? (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-center text-xs font-bold text-[#2a6877] hover:bg-slate-200 transition-colors">
                        👁️ Ver Archivo / Foto {idx + 1}
                      </a>
                    ) : (
                      <div key={idx} className="rounded-md bg-slate-50 border border-slate-200 p-2 text-xs text-slate-600 break-words">
                        📎 {url}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-900">3. Respaldo Supervisor</h2>
              <p className="text-xs text-slate-500 mb-4">Adjunta firmas y V°B° de autorización.</p>
              <input 
                ref={inputArchivoRef}
                type="file" 
                multiple 
                accept="image/*,.pdf" 
                onChange={agregarArchivosSupervisor} 
                className="w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-2 file:text-xs file:font-bold file:text-slate-800 hover:file:bg-slate-300 transition-colors cursor-pointer" 
              />
              
              {archivosAuth.length > 0 && (
                <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold text-emerald-600">✅ {archivosAuth.length} archivo(s) listo(s) para subir:</p>
                  {archivosAuth.map((file, index) => (
                    <div key={index} className="flex justify-between items-center bg-slate-100 rounded-md px-2 py-1.5 border border-slate-200">
                      <span className="text-xs text-slate-600 truncate w-3/4" title={file.name}>📎 {file.name}</span>
                      <button type="button" onClick={() => quitarArchivoSupervisor(index)} className="text-red-500 text-xs font-bold hover:text-red-700 px-2">X</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-3 h-fit">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Descuadres Encontrados</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-bold">Ubicación</th>
                    <th className="px-6 py-3 font-bold">Código SAP</th>
                    <th className="px-6 py-3 font-bold text-center">Stock Sistema</th>
                    <th className="px-6 py-3 font-bold text-center text-[#2a6877]">Conteo Auditor</th>
                    <th className="px-6 py-3 font-bold text-center">Variación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {resultados.map((linea, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-600">{linea.ubicacion}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{linea.codigo}</td>
                      <td className="px-6 py-4 text-center text-slate-400">{linea.teorico}</td>
                      <td className="px-6 py-4 text-center text-lg font-bold text-[#2a6877]">{linea.fisico === "" ? "-" : linea.fisico}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                          linea.diferencia === 0 ? "bg-slate-100 text-slate-500" :
                          linea.diferencia > 0 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                        }`}>
                          {linea.diferencia > 0 ? `+${linea.diferencia} (Sobrante)` : linea.diferencia < 0 ? `${linea.diferencia} (Faltante)` : "OK (Cuadrado)"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-6 flex flex-col sm:flex-row justify-end gap-4">
              <button 
                onClick={() => procesarAutorizacion("RECHAZAR")} 
                disabled={cargando}
                className="rounded-lg px-6 py-3 text-sm font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
              >
                ✖ Enviar a recontar
              </button>
              <button 
                onClick={() => procesarAutorizacion("APROBAR")} 
                disabled={cargando}
                className="rounded-lg bg-[#2a6877] px-8 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#1f4e5a] transition-colors"
              >
                {cargando ? "Procesando..." : "✓ Aceptar y consolidar"}
              </button>
            </div>
          </section>

        </div>
      )}
    </main>
  );
}

export default function RevisionPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 font-bold">Cargando revisión...</div>}>
      <RevisionInventario />
    </Suspense>
  );
}