import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { searchChannels, searchFiles, searchMessages, searchThreadsByKeyword } from "@/features/search/api";
import type { Message, FileResource, Channel, Thread } from "@/types";
import { Search, FileText, Hash, MessageSquare, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onNavigate: (payload: { channelId?: string; threadId?: string; messageId?: string }) => void;
}

interface SearchResults {
  messages: Message[];
  files: FileResource[];
  channels: Channel[];
  threads: Thread[];
}

export const GlobalSearch = ({ onNavigate }: Props) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ messages: [], files: [], channels: [], threads: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "messages" | "files" | "channels" | "threads">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const [messages, files, channels, threads] = await Promise.all([
        searchMessages({ q: query, limit: 5 }),
        searchFiles({ q: query, limit: 5 }),
        searchChannels({ q: query, limit: 5 }),
        searchThreadsByKeyword(query).catch(() => [] as Thread[]),
      ]);
      setResults({ messages, files, channels, threads });
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults({ messages: [], files: [], channels: [], threads: [] });
  };

  const totalResults = 
    results.messages.length + 
    results.files.length + 
    results.channels.length + 
    results.threads.length;

  const filteredResults = {
    messages: activeTab === "all" || activeTab === "messages" ? results.messages : [],
    files: activeTab === "all" || activeTab === "files" ? results.files : [],
    channels: activeTab === "all" || activeTab === "channels" ? results.channels : [],
    threads: activeTab === "all" || activeTab === "threads" ? results.threads : [],
  };

  const tabs = [
    { id: "all", label: "Todo", count: totalResults },
    { id: "messages", label: "Mensajes", count: results.messages.length, icon: <MessageSquare className="w-3 h-3" /> },
    { id: "files", label: "Archivos", count: results.files.length, icon: <FileText className="w-3 h-3" /> },
    { id: "channels", label: "Canales", count: results.channels.length, icon: <Hash className="w-3 h-3" /> },
    { id: "threads", label: "Threads", count: results.threads.length, icon: <MessageSquare className="w-3 h-3" /> },
  ] as const;

  return (
    <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header con búsqueda */}
      <div className="p-4 border-b">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar mensajes, archivos, canales o threads (Ctrl+K)"
            className="w-full pl-10 pr-20 py-2.5 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-1.5 hover:bg-muted rounded-md transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
            </button>
          </div>
        </form>
      </div>

      {/* Tabs de filtro (solo si hay resultados) */}
      {totalResults > 0 && (
        <div className="flex items-center gap-1 p-2 border-b bg-muted/30 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px]",
                  activeTab === tab.id ? "bg-primary-foreground/20" : "bg-muted-foreground/20"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Resultados */}
      <div className="max-h-80 overflow-y-auto">
        {isSearching && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Buscando...</span>
          </div>
        )}

        {!isSearching && query && totalResults === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Sin resultados para "{query}"</p>
          </div>
        )}

        {!isSearching && (
          <div className="p-2 space-y-1">
            {/* Threads */}
            {filteredResults.threads.map((thread) => (
              <SearchResultCard
                key={`thread-${thread.id}`}
                icon={<MessageSquare className="w-4 h-4 text-purple-500" />}
                title={thread.title || "Sin título"}
                subtitle={`Thread por ${thread.created_by}`}
                badge={thread.status}
                badgeColor={thread.status === "active" ? "green" : "gray"}
                onClick={() => onNavigate({ threadId: thread.id, channelId: thread.channel_id })}
              />
            ))}

            {/* Mensajes */}
            {filteredResults.messages.map((message) => (
              <SearchResultCard
                key={`msg-${message.id}`}
                icon={<MessageSquare className="w-4 h-4 text-blue-500" />}
                title={message.content ?? "Mensaje"}
                subtitle={`En hilo ${message.thread_id?.slice(0, 8)}...`}
                onClick={() => onNavigate({ threadId: message.thread_id })}
              />
            ))}

            {/* Archivos */}
            {filteredResults.files.map((file) => (
              <SearchResultCard
                key={`file-${file.id}`}
                icon={<FileText className="w-4 h-4 text-orange-500" />}
                title={file.filename}
                subtitle={`${file.mime_type} · ${(file.size / 1024).toFixed(1)} KB`}
                onClick={() => onNavigate({ threadId: file.thread_id ?? undefined })}
              />
            ))}

            {/* Canales */}
            {filteredResults.channels.map((channel) => (
              <SearchResultCard
                key={`channel-${channel.id}`}
                icon={<Hash className="w-4 h-4 text-green-500" />}
                title={channel.name}
                subtitle={channel.is_active ? "Canal activo" : "Canal inactivo"}
                badge={channel.channel_type}
                onClick={() => onNavigate({ channelId: channel.id })}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const SearchResultCard = ({
  icon,
  title,
  subtitle,
  badge,
  badgeColor,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: "green" | "gray" | "blue";
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left group"
  >
    <div className="p-2 rounded-lg bg-muted group-hover:bg-background transition-colors">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
        {title}
      </p>
      <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
    </div>
    {badge && (
      <span className={cn(
        "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase",
        badgeColor === "green" && "bg-green-500/10 text-green-600",
        badgeColor === "gray" && "bg-muted text-muted-foreground",
        badgeColor === "blue" && "bg-blue-500/10 text-blue-600",
        !badgeColor && "bg-muted text-muted-foreground"
      )}>
        {badge}
      </span>
    )}
  </button>
);

