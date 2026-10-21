"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import "./globals.css";

interface UserProfile {
  email: string;
  role: string;
  full_name: string;
  job_title: string;
  warehouse: string;
  avatar_url: string;
}

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const getSupabase = () => {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const cleanUrl = rawUrl ? new URL(rawUrl.trim()).origin : "";
    return createClient(cleanUrl, rawKey.trim());
  };

  useEffect(() => {
    const verifyUser = async () => {
      if (isLoginPage) {
        setCheckingAuth(false);
        return;
      }

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
          setProfile({
            email: data.email || session.user.email || "",
            role: data.role || "bodeguero",
            full_name: data.full_name || "Usuario Corporativo",
            job_title: data.job_title || "Operador Logístico",
            warehouse: data.warehouse || "Bodega Central",
            avatar_url: data.avatar_url || "",
          });
        } else {
          setProfile({
            email: session.user.email || "",
            role: "admin",
            full_name: session.user.email?.split("@")[0] || "Administrador",
            job_title: "Supervisor General",
            warehouse: "Bodega Central",
            avatar_url: "",
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingAuth(false);
      }
    };

    verifyUser();
  }, [pathname, isLoginPage, router]);

  const handleLogout = async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      setProfile(null);
      router.replace("/login");
    } catch (err) {
      router.replace("/login");
    }
  };

  const role = profile?.role || "admin";
  const canSeeResumen = role === "admin";
  const canSeeEntradasSalidas = role === "admin" || role === "bodeguero";
  const canSeeStock = role === "admin" || role === "bodeguero" || role === "auditor";
  const canSeeAuditoria = role === "admin" || role === "auditor";
  const canSeeMateriales = role === "admin";

  const initials = (profile?.full_name || profile?.email || "JM")
    .substring(0, 2)
    .toUpperCase();

  return (
    <html lang="es">
      <body
        className={`antialiased min-h-screen bg-slate-50 font-sans text-slate-800 ${
          isLoginPage ? "bg-slate-900" : "flex flex-col lg:flex-row pb-20 lg:pb-0"
        }`}
      >
        {isLoginPage ? (
          <div className="w-full min-h-screen">{children}</div>
        ) : checkingAuth ? (
          <div className="flex min-h-screen w-full items-center justify-center bg-slate-900 text-white">
            <div className="text-center space-y-2">
              <div className="text-lg font-bold tracking-widest">JM INVENTORY</div>
              <div className="text-xs text-slate-400">Verificando credenciales y asignación de bodega...</div>
            </div>
          </div>
        ) : (
          <>
            {/* CABECERA MÓVIL */}
            <header className="flex lg:hidden items-center justify-between bg-[#1a2b3c] px-4 py-3 text-white shadow-md print:hidden sticky top-0 z-50">
              <div>
                <h2 className="text-base font-bold leading-tight">JM INVENTORY</h2>
                <p className="text-[10px] font-semibold tracking-widest text-emerald-400">
                  📍 {profile?.warehouse}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/perfil"
                  className="rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-white border border-slate-700"
                >
                  👤 {initials}
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-red-600/90 px-2.5 py-1.5 text-xs font-bold text-white"
                >
                  Salir
                </button>
              </div>
            </header>

            {/* BARRA LATERAL PC */}
            <aside className="hidden w-64 flex-col justify-between bg-[#1a2b3c] text-white lg:flex fixed h-full print:hidden z-40">
              <div>
                <div className="p-6 border-b border-slate-800">
                  <h2 className="text-lg font-bold leading-tight">JM INVENTORY</h2>
                  <p className="text-xs font-semibold tracking-widest text-slate-400">ERP BODEGA</p>
                  <div className="mt-2 inline-block rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                    📍 {profile?.warehouse}
                  </div>
                </div>

                <nav className="mt-3 flex flex-col gap-1.5 px-4">
                  {canSeeResumen && (
                    <Link href="/" className="rounded-md px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white">
                      📊 Resumen
                    </Link>
                  )}
                  {canSeeEntradasSalidas && (
                    <>
                      <Link href="/entradas" className="rounded-md px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white">
                        📥 Entradas
                      </Link>
                      <Link href="/salidas" className="rounded-md px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white">
                        📤 Salidas
                      </Link>
                    </>
                  )}
                  {canSeeStock && (
                    <Link href="/stock" className="rounded-md px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white">
                      🏢 Stock en Bodega
                    </Link>
                  )}
                  {canSeeAuditoria && (
                    <Link href="/inventarios" className="rounded-md px-4 py-2.5 text-sm font-medium text-amber-400 transition-colors hover:bg-slate-800 hover:text-amber-300">
                      📋 Inventario Físico
                    </Link>
                  )}
                  {canSeeMateriales && (
                    <Link href="/materiales" className="rounded-md px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white">
                      📦 Maestro de Materiales
                    </Link>
                  )}
                </nav>
              </div>

              {/* TARJETA DE PERFIL Y LOGOUT EN LA PARTE INFERIOR */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-3">
                <Link
                  href="/perfil"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors group"
                  title="Ver Mi Credencial Corporativa"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white border-2 border-blue-400 shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate group-hover:text-blue-400">
                      {profile?.full_name}
                    </p>
                    <p className="text-[11px] text-amber-400 font-medium truncate">
                      {profile?.job_title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      Ver Mi Perfil →
                    </p>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 py-2 text-xs font-bold transition-colors"
                >
                  <span>🚪</span> Cerrar Sesión (Logout)
                </button>
              </div>
            </aside>

            {/* CONTENIDO PRINCIPAL */}
            <div className="flex-1 overflow-y-auto lg:ml-64 print:ml-0 print:w-full">
              {children}
            </div>

            {/* BARRA INFERIOR MÓVIL */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden items-center justify-between bg-[#1a2b3c] border-t border-slate-800 px-1 py-2 text-white shadow-lg print:hidden">
              {canSeeResumen && (
                <Link href="/" className="flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium text-slate-300 hover:text-white">
                  <span>📊</span><span>Inicio</span>
                </Link>
              )}
              {canSeeEntradasSalidas && (
                <>
                  <Link href="/entradas" className="flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium text-slate-300 hover:text-white">
                    <span>📥</span><span>Entradas</span>
                  </Link>
                  <Link href="/salidas" className="flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium text-slate-300 hover:text-white">
                    <span>📤</span><span>Salidas</span>
                  </Link>
                </>
              )}
              {canSeeStock && (
                <Link href="/stock" className="flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium text-slate-300 hover:text-white">
                  <span>🏢</span><span>Stock</span>
                </Link>
              )}
              {canSeeAuditoria && (
                <Link href="/inventarios" className="flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-bold text-amber-400">
                  <span>📋</span><span>Auditoría</span>
                </Link>
              )}
              <Link href="/perfil" className="flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium text-blue-300 hover:text-white">
                <span>👤</span><span>Mi Perfil</span>
              </Link>
            </nav>
          </>
        )}
      </body>
    </html>
  );
}