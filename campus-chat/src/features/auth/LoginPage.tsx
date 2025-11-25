import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useLogin } from "./hooks";
import { Mail, Lock, Loader2, AlertCircle, MessageSquare, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const LoginPage = () => {
  const loginMutation = useLogin();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    loginMutation.mutate({ username_or_email: usernameOrEmail, password });
  };

  const getErrorMessage = (error: unknown) => {
    const err = error as { response?: { data?: { detail?: unknown } } };
    const detail = err?.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((e: { msg?: string }) => e.msg || JSON.stringify(e)).join(", ");
    }
    if (typeof detail === "object" && detail !== null) {
      return JSON.stringify(detail);
    }
    return "Usuario o contraseña incorrectos.";
  };

  return (
    <main className="h-screen w-screen flex items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Card principal */}
        <section className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-900/10 border border-white/50 p-5 sm:p-6">
          {/* Header */}
          <header className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mb-3">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <p className="text-[10px] font-bold tracking-[0.25em] text-blue-600 uppercase mb-1">
              Campus Chat
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              Bienvenido
            </h1>
          </header>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Campo Usuario/Email */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">
                Usuario o correo
              </label>
              <div className="relative">
                <div className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200",
                  focusedField === "email" ? "text-blue-500" : "text-slate-400"
                )}>
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  required
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="tu.usuario@campus.edu"
                  className={cn(
                    "w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border-2 bg-slate-50/50 transition-all duration-200 outline-none",
                    "placeholder:text-slate-400 text-slate-800",
                    focusedField === "email" 
                      ? "border-blue-500 bg-white shadow-md shadow-blue-500/10" 
                      : "border-slate-200 hover:border-slate-300"
                  )}
                  aria-label="Usuario o correo electrónico"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">
                Contraseña
              </label>
              <div className="relative">
                <div className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200",
                  focusedField === "password" ? "text-blue-500" : "text-slate-400"
                )}>
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className={cn(
                    "w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border-2 bg-slate-50/50 transition-all duration-200 outline-none",
                    "placeholder:text-slate-400 text-slate-800",
                    focusedField === "password" 
                      ? "border-blue-500 bg-white shadow-md shadow-blue-500/10" 
                      : "border-slate-200 hover:border-slate-300"
                  )}
                  aria-label="Contraseña"
                />
              </div>
            </div>

            {/* Mensaje de error */}
            {loginMutation.isError && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs">{getErrorMessage(loginMutation.error)}</p>
              </div>
            )}

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className={cn(
                "w-full py-2.5 px-4 rounded-lg font-semibold text-sm text-white transition-all duration-300",
                "bg-gradient-to-r from-blue-500 to-indigo-600",
                "hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/25",
                "active:scale-[0.98]",
                "disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none",
                "flex items-center justify-center gap-2"
              )}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Ingresando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link a registro */}
          <div className="mt-4 pt-4 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500">
              ¿Aún no tienes cuenta?{" "}
              <Link 
                to="/register" 
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors hover:underline"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </section>

        {/* Footer */}
        <p className="text-center text-slate-400 text-[10px] mt-3">
          © 2025 Campus Chat
        </p>
      </div>
    </main>
  );
};
