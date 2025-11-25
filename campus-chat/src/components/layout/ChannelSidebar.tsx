import { useState, useEffect } from "react";
import type { Channel, PresenceStats } from "@/types";
import { ProfileMenu } from "@/features/auth/ProfileMenu";
import { PresenceBadge } from "@/components/presence/PresenceBadge";
import { Search, Plus, Hash, Lock, Users, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchChannels } from "@/features/search/api";

interface Props {
  channels?: Channel[];
  selectedChannelId?: string;
  onSelectChannel: (channelId: string) => void;
  onCreateChannel: () => void;
  presenceStats?: PresenceStats;
  // Paginación
  currentPage?: number;
  hasMore?: boolean;
  onNextPage?: () => void;
  onPrevPage?: () => void;
}

export const ChannelSidebar = ({
  channels = [],
  selectedChannelId,
  onSelectChannel,
  onCreateChannel,
  presenceStats,
  currentPage = 1,
  hasMore = false,
  onNextPage,
  onPrevPage,
}: Props) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Channel[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Buscar canales cuando cambia el query (con debounce)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchChannels({ q: searchQuery, limit: 50 });
        setSearchResults(results);
      } catch (error) {
        console.error("Error buscando canales:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Si hay búsqueda, mostrar resultados de búsqueda; si no, mostrar canales paginados
  const displayChannels = searchQuery.trim() ? searchResults : channels;
  const isSearchMode = Boolean(searchQuery.trim());

  return (
    <aside className="flex flex-col h-full min-h-0 bg-muted/10">
      {/* Header Profile - z-index alto para el dropdown */}
      <div className="p-4 border-b bg-background/50 backdrop-blur-sm relative z-50">
        <ProfileMenu />
      </div>

      {/* Search & Actions - z-index menor */}
      <div className="p-3 space-y-3 relative z-10">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/70"
              placeholder="Buscar canal..."
              aria-label="Buscar canal"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={onCreateChannel} 
            className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
            aria-label="Crear nuevo canal"
            title="Crear canal"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Stats Card */}
        {presenceStats && (
          <div className="bg-card border rounded-lg p-3 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 text-green-700 rounded-full">
                <Users className="h-3 w-3" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Online</p>
                <p className="text-sm font-bold leading-none">{presenceStats.online}</p>
              </div>
            </div>
            <div className="text-right border-l pl-3">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total</p>
              <p className="text-sm font-bold leading-none">{presenceStats.total}</p>
            </div>
          </div>
        )}
      </div>

      {/* Channel List */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5" aria-label="Lista de canales">
        {/* Indicador de búsqueda */}
        {isSearching && (
          <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Buscando...</span>
          </div>
        )}

        {!isSearching && displayChannels.length === 0 ? (
           <div className="text-center py-8 px-4">
            <p className="text-muted-foreground text-sm">
              {isSearchMode ? `No se encontraron canales para "${searchQuery}"` : "No hay canales en esta página"}
            </p>
            {!isSearchMode && currentPage === 1 && (
              <button onClick={onCreateChannel} className="text-xs text-primary hover:underline mt-1">Crear uno</button>
            )}
           </div>
        ) : !isSearching && (
          displayChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onSelectChannel(channel.id)}
              className={cn(
                "group w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-all duration-200",
                channel.id === selectedChannelId 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              aria-current={channel.id === selectedChannelId}
            >
              <div className="flex items-center gap-3 min-w-0">
                {channel.channel_type === "public" ? (
                  <Hash className={cn("h-4 w-4 shrink-0", channel.id === selectedChannelId ? "text-primary-foreground/70" : "text-muted-foreground/70")} />
                ) : (
                  <Lock className={cn("h-4 w-4 shrink-0", channel.id === selectedChannelId ? "text-primary-foreground/70" : "text-muted-foreground/70")} />
                )}
                <div className="truncate">
                  <span className="block font-medium text-sm truncate">{channel.name}</span>
                  <span className={cn("text-xs block", channel.id === selectedChannelId ? "text-primary-foreground/60" : "text-muted-foreground/60")}>
                    {channel.user_count ?? channel.users?.length ?? 0} miembros
                  </span>
                </div>
              </div>
              <PresenceBadge status={channel.is_active ? "online" : "offline"} />
            </button>
          ))
        )}
      </nav>

      {/* Paginación - Solo mostrar cuando no estamos buscando */}
      {!isSearchMode && (
        <div className="p-2 border-t bg-background/50 flex items-center justify-between">
          <button
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            className={cn(
              "flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors",
              currentPage <= 1 
                ? "text-muted-foreground/50 cursor-not-allowed" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>
          <span className="text-xs text-muted-foreground font-medium">
            Página {currentPage}
          </span>
          <button
            onClick={onNextPage}
            disabled={!hasMore}
            className={cn(
              "flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors",
              !hasMore 
                ? "text-muted-foreground/50 cursor-not-allowed" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Indicador de modo búsqueda */}
      {isSearchMode && !isSearching && searchResults.length > 0 && (
        <div className="p-2 border-t bg-background/50 text-center">
          <span className="text-xs text-muted-foreground">
            {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </aside>
  );
};
