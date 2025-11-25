import { useAuthStore } from "@/store/authStore";
import { LogOut, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export const ProfileMenu = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!user) return null;

  const initials = (user.full_name?.[0] ?? user.username?.[0] ?? "U").toUpperCase();
  const displayName = user.full_name ?? user.username ?? "Usuario";

  return (
    <div ref={menuRef} className="relative z-50">
      {/* Botón principal del perfil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200",
          "bg-gradient-to-r from-card to-card/80 border border-border/50",
          "hover:border-primary/30 hover:shadow-md hover:shadow-primary/5",
          "focus:outline-none focus:ring-2 focus:ring-primary/20",
          isOpen && "border-primary/30 shadow-md"
        )}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-primary/80 to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
            <span className="text-sm font-bold text-white">{initials}</span>
          </div>
          {/* Indicador online */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
        </div>

        {/* Info del usuario */}
        <div className="flex-1 min-w-0 text-left">
          <p className="font-semibold text-sm text-foreground truncate leading-tight">
            {displayName}
          </p>
          <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
            {user.email}
          </p>
        </div>

        {/* Chevron */}
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl shadow-black/20 overflow-hidden">
            {/* Header del menu */}
            <div className="px-4 py-3 bg-muted/30 border-b border-border/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Cuenta
              </p>
            </div>

            {/* Info detallada */}
            <div className="px-4 py-3 space-y-2 bg-card">
              <div>
                <p className="text-xs text-muted-foreground">Nombre</p>
                <p className="text-sm font-medium text-foreground">{displayName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground break-all">{user.email}</p>
              </div>
              {user.username && user.username !== displayName && (
                <div>
                  <p className="text-xs text-muted-foreground">Usuario</p>
                  <p className="text-sm font-medium text-foreground">@{user.username}</p>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="p-2 bg-muted/20 border-t border-border/50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  "text-red-600 hover:bg-red-500/10",
                  "focus:outline-none focus:ring-2 focus:ring-red-500/20"
                )}
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};




