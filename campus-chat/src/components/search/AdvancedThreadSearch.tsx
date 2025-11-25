import { useState } from "react";
import { Search, Calendar, User, Tag, Filter, X, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useSearchThreadById,
  useSearchThreadsByAuthor,
  useSearchThreadsByDateRange,
  useSearchThreadsByStatus,
  useSearchThreadsByKeyword,
} from "@/features/search/hooks";
import type { Thread } from "@/types";

interface Props {
  onSelectThread?: (thread: Thread) => void;
  className?: string;
}

type SearchMode = "keyword" | "id" | "author" | "daterange" | "status";

const SEARCH_MODES: { value: SearchMode; label: string; icon: React.ReactNode }[] = [
  { value: "keyword", label: "Palabra clave", icon: <Search className="w-4 h-4" /> },
  { value: "id", label: "ID de Thread", icon: <Tag className="w-4 h-4" /> },
  { value: "author", label: "Autor", icon: <User className="w-4 h-4" /> },
  { value: "daterange", label: "Rango de fechas", icon: <Calendar className="w-4 h-4" /> },
  { value: "status", label: "Estado", icon: <Filter className="w-4 h-4" /> },
];

const STATUS_OPTIONS = ["active", "archived", "closed", "pending"];

export const AdvancedThreadSearch = ({ onSelectThread, className }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>("keyword");
  const [searchValue, setSearchValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Queries condicionalmente activadas
  const keywordQuery = useSearchThreadsByKeyword(
    searchMode === "keyword" && searchValue ? searchValue : undefined
  );
  const idQuery = useSearchThreadById(
    searchMode === "id" && searchValue ? searchValue : undefined
  );
  const authorQuery = useSearchThreadsByAuthor(
    searchMode === "author" && searchValue ? searchValue : undefined
  );
  const dateRangeQuery = useSearchThreadsByDateRange(
    searchMode === "daterange" && startDate ? startDate : undefined,
    searchMode === "daterange" && endDate ? endDate : undefined
  );
  const statusQuery = useSearchThreadsByStatus(
    searchMode === "status" && selectedStatus ? selectedStatus : undefined
  );

  // Obtener resultados según el modo activo
  const getResults = (): Thread[] => {
    switch (searchMode) {
      case "keyword":
        return keywordQuery.data ?? [];
      case "id":
        return idQuery.data ?? [];
      case "author":
        return authorQuery.data ?? [];
      case "daterange":
        return dateRangeQuery.data ?? [];
      case "status":
        return statusQuery.data ?? [];
      default:
        return [];
    }
  };

  const isLoading =
    keywordQuery.isLoading ||
    idQuery.isLoading ||
    authorQuery.isLoading ||
    dateRangeQuery.isLoading ||
    statusQuery.isLoading;

  const results = getResults();
  const hasSearch =
    searchValue ||
    (searchMode === "daterange" && startDate && endDate) ||
    (searchMode === "status" && selectedStatus);

  const clearSearch = () => {
    setSearchValue("");
    setStartDate("");
    setEndDate("");
    setSelectedStatus("");
  };

  return (
    <div className={cn("rounded-xl border bg-card shadow-sm", className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Search className="w-4 h-4 text-primary" />
          <span>Búsqueda Avanzada de Threads</span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4 border-t">
          {/* Selector de modo de búsqueda */}
          <div className="flex flex-wrap gap-2">
            {SEARCH_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => {
                  setSearchMode(mode.value);
                  clearSearch();
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  searchMode === mode.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                {mode.icon}
                {mode.label}
              </button>
            ))}
          </div>

          {/* Campos de búsqueda según el modo */}
          <div className="space-y-3">
            {searchMode === "keyword" && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Buscar por palabra clave..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                {searchValue && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {searchMode === "id" && (
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="ID del thread (ej: 507f1f77bcf86cd799439011)"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border bg-background text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
            )}

            {searchMode === "author" && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="ID del autor..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
            )}

            {searchMode === "daterange" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Fecha inicio
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Fecha fin
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {searchMode === "status" && (
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(selectedStatus === status ? "" : status)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                      selectedStatus === status
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Resultados */}
          <div className="space-y-2">
            {isLoading && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Buscando...</span>
              </div>
            )}

            {!isLoading && hasSearch && results.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No se encontraron threads</p>
              </div>
            )}

            {!isLoading && results.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <p className="text-xs text-muted-foreground font-medium">
                  {results.length} resultado{results.length !== 1 ? "s" : ""}
                </p>
                {results.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => onSelectThread?.(thread)}
                    className="w-full p-3 rounded-lg border bg-background hover:bg-accent hover:border-primary/30 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {thread.title || "Sin título"}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Por: {thread.created_by}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase",
                          thread.status === "active"
                            ? "bg-green-500/10 text-green-600"
                            : thread.status === "closed"
                            ? "bg-red-500/10 text-red-600"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {thread.status}
                      </span>
                    </div>
                    {thread.created_at && (
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {new Date(thread.created_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

