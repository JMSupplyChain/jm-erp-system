"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../../../src/lib/supabase";

function DocumentoImpresion() {
  const searchParams = useSearchParams();
  const folio = searchParams.get("folio");
  
  const [inventario, setInventario] = useState<any>(null);
  const [lineasConteo, setLineasConteo] = useState<any[]>([]);

  useEffect(() => {
    if (folio) {
      cargarDatosLogisticos();
    }
  }, [folio]);

  const cargarDatosLogisticos = async () => {
    const { data: invData } = await supabase.from("inventarios").select("*").eq("folio", folio).single();
    if (!invData) return;
    setInventario(invData);

    if (invData.tipo === "Cíclico" && invData.codigos_asignados) {
      const codigosArray = invData.codigos_asignados.split(",").map((c: string) => c.trim());
      
      const { data: stockData } = await supabase
        .from("stock")
        .select("codigo_material, ubicacion")
        .in("codigo_material", codigosArray)
        .gt("cantidad", 0);

      let filasConstruidas: any[] = [];

      codigosArray.forEach((codigo) => {
        const ubicacionesDelCodigo = stockData?.filter((s) => s.codigo_material === codigo) || [];
        
        if (ubicacionesDelCodigo.length > 0) {
          ubicacionesDelCodigo.forEach((ub) => {
            filasConstruidas.push({ codigo, ubicacion: ub.ubicacion });
          });
        } else {
          filasConstruidas.push({ codigo, ubicacion: "SIN REGISTRO (Búsqueda)" });
        }
      });

      setLineasConteo(filasConstruidas);
    }
  };

  if (!inventario) return <div className="p-10 text-center font-bold">Generando documento logístico...</div>;

  return (
    <div className="min-h-screen bg-white p-8 text-black sm:p-12 print:p-0">
      <div className="mb-8 flex justify-end print:hidden">
        <button 
          onClick={() => window.print()} 
          className="rounded-lg bg-[#2a6877] px-8 py-3 font-bold text-white shadow-md hover:bg-[#1f4e5a]"
        >
          🖨️ Imprimir Hoja de Trabajo
        </button>
      </div>

      <div className="border-2 border-black p-6 mb-6">
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
          <div>
            <h1 className="text-2xl font-black uppercase">JM INVENTORY CONTROL</h1>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-600">Supply Chain & Bodega</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase">Orden de Inventario {inventario.tipo}</h2>
            <p className="text-lg font-bold text-red-600">FOLIO: {inventario.folio}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="font-bold">TÍTULO:</span> {inventario.titulo}</p>
            <p><span className="font-bold">FECHA EMISIÓN DOC:</span> {new Date().toLocaleDateString("es-CL")}</p>
          </div>
          <div>
            <p><span className="font-bold">PERIODO DE EJECUCIÓN:</span> {inventario.fecha_inicio ? new Date(inventario.fecha_inicio).toLocaleDateString("es-CL") : "-"} AL {inventario.fecha_fin ? new Date(inventario.fecha_fin).toLocaleDateString("es-CL") : "-"}</p>
            <p><span className="font-bold">AUDITOR DESIGNADO:</span> {inventario.responsable || "___________________________"}</p>
            <p><span className="font-bold">SUPERVISOR:</span> {inventario.supervisor || "___________________________"}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 text-sm italic text-gray-700">
        Instrucciones: El auditor debe dirigirse a las ubicaciones exactas indicadas en la columna "Ubicación / Rack". Registre la cantidad física encontrada en "Conteo Físico 1". Materiales encontrados en ubicaciones no listadas deben ser anotados en observaciones o reportados como hallazgos (5S).
      </div>

      <table className="w-full border-collapse border-2 border-black text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border-2 border-black p-2 w-12 text-center">N°</th>
            <th className="border-2 border-black p-2">Código Material</th>
            <th className="border-2 border-black p-2">Ubicación / Rack (5S)</th>
            <th className="border-2 border-black p-2 w-32 text-center">Conteo Físico 1</th>
            <th className="border-2 border-black p-2 w-32 text-center">Conteo Físico 2</th>
            <th className="border-2 border-black p-2 w-48 text-center">Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {inventario.tipo === "Cíclico" && lineasConteo.length > 0 ? (
            lineasConteo.map((linea, idx) => (
              <tr key={idx}>
                <td className="border-2 border-black p-2 text-center font-bold">{idx + 1}</td>
                <td className="border-2 border-black p-2 font-bold">{linea.codigo}</td>
                <td className="border-2 border-black p-2 font-bold text-gray-800">{linea.ubicacion}</td>
                <td className="border-2 border-black p-2"></td>
                <td className="border-2 border-black p-2"></td>
                <td className="border-2 border-black p-2"></td>
              </tr>
            ))
          ) : (
            Array.from({ length: 20 }).map((_, idx) => (
              <tr key={idx}>
                <td className="border-2 border-black p-4 text-center font-bold text-gray-400">{idx + 1}</td>
                <td className="border-2 border-black p-4"></td>
                <td className="border-2 border-black p-4"></td>
                <td className="border-2 border-black p-4"></td>
                <td className="border-2 border-black p-4"></td>
                <td className="border-2 border-black p-4"></td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="mt-20 grid grid-cols-2 gap-8 text-center text-sm font-bold">
        <div>
          <div className="mx-auto w-64 border-t-2 border-black pt-2">
            FIRMA AUDITOR / PAÑOLERO<br/>
            {inventario.responsable || "___________________________"}
          </div>
        </div>
        <div>
          <div className="mx-auto w-64 border-t-2 border-black pt-2">
            FIRMA SUPERVISOR<br/>
            {inventario.supervisor || "___________________________"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ImprimirPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Cargando documento...</div>}>
      <DocumentoImpresion />
    </Suspense>
  );
}