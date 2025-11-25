import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegister } from "./hooks";
import { Mail, User, Lock, UserCircle, Loader2, AlertCircle, CheckCircle2, MessageSquare, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const [formState, setFormState] = useState({
    email: "",
    username: "",
    password: "",
    full_name: "",
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    registerMutation.mutate(formState, {
      onSuccess: () => {
        toast.success("¡Cuenta creada exitosamente!", {
          description: "Ahora puedes iniciar sesión con tus credenciales."
        });
        navigate("/login");
      },
    });
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
    return "No se pudo crear la cuenta. Verifica los datos.";
  };

  const fields = [
    { 
      key: "email", 
      label: "Correo institucional", 
      type: "email", 
      required: true,
      icon: Mail,
      placeholder: "tu.correo@universidad.edu"
    },
    { 
      key: "username", 
      label: "Usuario", 
      type: "text", 
      required: true,
      icon: User,
      placeholder: "tu_usuario"
    },
    { 
      key: "full_name", 
      label: "Nombre completo", 
      type: "text", 
      required: false,
      icon: UserCircle,
      placeholder: "Juan Pérez"
    },
    { 
      key: "password", 
      label: "Contraseña", 
      type: "password", 
      required: true,
      icon: Lock,
      placeholder: "Mínimo 8 caracteres"
    },
  ];

  return (
    <main className="h-screen w-screen flex items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Card principal */}
        <section className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-purple-900/10 border border-white/50 p-5 sm:p-6">
          {/* Header */}
          <header className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30 mb-3">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <p className="text-[10px] font-bold tracking-[0.25em] text-purple-600 uppercase mb-1">
              Registro
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              Crea tu cuenta
            </h1>
          </header>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {fields.map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.key} className="space-y-1">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    {field.label}
                    {!field.required && (
                      <span className="text-[10px] text-slate-400 font-normal">(opcional)</span>
                    )}
                  </label>
                  <div className="relative">
                    <div className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200",
                      focusedField === field.key ? "text-purple-500" : "text-slate-400"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <input
                      required={field.required}
                      type={field.type}
                      value={formState[field.key as keyof typeof formState]}
                      onChange={(e) => setFormState({ ...formState, [field.key]: e.target.value })}
                      onFocus={() => setFocusedField(field.key)}
                      onBlur={() => setFocusedField(null)}
                      placeholder={field.placeholder}
                      className={cn(
                        "w-full pl-10 pr-9 py-2 text-sm rounded-lg border-2 bg-slate-50/50 transition-all duration-200 outline-none",
                        "placeholder:text-slate-400 text-slate-800",
                        focusedField === field.key 
                          ? "border-purple-500 bg-white shadow-md shadow-purple-500/10" 
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    />
                    {/* Indicador de campo válido */}
                    {formState[field.key as keyof typeof formState] && field.required && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Mensaje de error */}
            {registerMutation.isError && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs">{getErrorMessage(registerMutation.error)}</p>
              </div>
            )}

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className={cn(
                "w-full py-2.5 px-4 rounded-lg font-semibold text-sm text-white transition-all duration-300 mt-3",
                "bg-gradient-to-r from-purple-500 to-indigo-600",
                "hover:from-purple-600 hover:to-indigo-700 hover:shadow-lg hover:shadow-purple-500/25",
                "active:scale-[0.98]",
                "disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none",
                "flex items-center justify-center gap-2"
              )}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <>
                  <span>Crear mi cuenta</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link a login */}
          <div className="mt-4 pt-4 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500">
              ¿Ya tienes una cuenta?{" "}
              <Link 
                to="/login" 
                className="font-semibold text-purple-600 hover:text-purple-700 transition-colors hover:underline"
              >
                Inicia sesión
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
