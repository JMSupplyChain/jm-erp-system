"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function PerfilPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  const getSupabase = () => {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const cleanUrl = rawUrl ? new URL(rawUrl.trim()).origin : "";
    return createClient(cleanUrl, rawKey.trim());
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          router.replace("/login");
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (data) {
          setProfile(data);
          setFullName(data.full_name || "");
          setAvatarUrl(data.avatar_url || "");
        } else {
          setProfile({
            email: session.user.email,
            full_name: session.user.email?.split("@")[0] || "Usuario",
            job_title: "Operador Logístico",
            warehouse: "Bodega Central",
            role: "bodeguero",
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setSaving(true);
    setMsg("");

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
        })
        .eq("id", profile.id);

      if (error) throw error;
      setProfile({ ...profile, full_name: fullName, avatar_url: avatarUrl });
      setMsg("✅ Perfil corporativo actualizado correctamente.");
    } catch (err: any) {
      setMsg("❌ Error al actualizar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Cargando credencial corporativa...
      </div>
    );
  }

  const initials = (profile?.full_name || profile?.email || "U")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
            CREDENCIAL DIGITAL DE ACCESO
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Mi Perfil Corporativo</h1>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 text-sm font-bold shadow-md transition-colors"
        >
          <span>🚪</span> Cerrar Sesión (Cambiar Usuario)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TARJETA TIPO CREDENCIAL CORPORATIVA */}
        <div className="bg-[#1a2b3c] text-white rounded-2xl p-6 shadow-xl flex flex-col items-center text-center border border-slate-700">
          <div className="text-[10px] font-bold tracking-widest uppercase text-blue-400 mb-4 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
            JM SUPPLY CHAIN · ID CARD
          </div>

          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Foto Corporativa"
              className="w-28 h-28 rounded-full object-cover border-4 border-blue-500 shadow-lg mb-4"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-blue-600 border-4 border-blue-400 flex items-center justify-center text-3xl font-extrabold shadow-lg mb-4">
              {initials}
            </div>
          )}

          <h2 className="text-xl font-bold">{profile?.full_name}</h2>
          <p className="text-xs text-amber-400 font-semibold mt-1">{profile?.job_title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{profile?.email}</p>

          <div className="w-full border-t border-slate-700 my-5 pt-4 space-y-3 text-left text-xs">
            <div className="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-lg">
              <span className="text-slate-400">📍 Centro / Almacén:</span>
              <span className="font-bold text-emerald-400">{profile?.warehouse}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-lg">
              <span className="text-slate-400">🔐 Nivel de Acceso:</span>
              <span className="font-bold uppercase text-blue-300">{profile?.role}</span>
            </div>
          </div>
        </div>

        {/* FORMULARIO DE DATOS Y PERMISOS */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800">Datos del Operador y Asignación</h3>
            <p className="text-xs text-slate-500">
              Tu cargo y sucursal están asignados por la administración central. Puedes personalizar tu nombre y fotografía corporativa.
            </p>
          </div>

          {msg && (
            <div className="p-3 rounded-lg bg-slate-100 text-xs font-semibold text-slate-800 border border-slate-300">
              {msg}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cargo Oficial (Asignado por RRHH / Admin)
                </label>
                <input
                  type="text"
                  disabled
                  value={profile?.job_title || ""}
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sucursal / Bodega Asignada
                </label>
                <input
                  type="text"
                  disabled
                  value={profile?.warehouse || ""}
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-emerald-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Corporativo
                </label>
                <input
                  type="text"
                  disabled
                  value={profile?.email || ""}
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                URL de Foto Corporativa (Opcional)
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                placeholder="https://ejemplo.com/mi-foto.jpg"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Si lo dejas en blanco, el sistema usará tus iniciales automáticamente en el menú.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar Cambios de Perfil"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}