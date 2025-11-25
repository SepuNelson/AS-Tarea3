import type { Thread } from "@/types";
import { MessageSquare, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  threads?: Thread[];
  selectedThreadId?: string;
  onSelectThread: (threadId: string) => void;
  onCreateThread: () => void;
}

export const ThreadList = ({ threads = [], selectedThreadId, onSelectThread, onCreateThread }: Props) => {
  return (
    <section className="flex flex-col h-full min-h-0 bg-background/50">
      <header className="flex justify-between items-center p-4 border-b bg-background sticky top-0 z-10">
        <h2 className="text-base font-bold flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          Hilos
        </h2>
        <button 
          onClick={onCreateThread} 
          className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Nuevo
        </button>
      </header>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1" aria-label="Lista de hilos">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-6">
            <div className="p-3 bg-muted rounded-full mb-3">
              <MessageSquare className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">No hay hilos activos</p>
            <button 
              onClick={onCreateThread}
              className="text-xs font-medium text-primary hover:underline"
            >
              Comienza una discusión
            </button>
          </div>
        ) : (
          threads.map((thread, index) => {
            // Usar uuid si está disponible, sino id, con índice como fallback para garantizar unicidad
            const uniqueKey = thread.uuid || thread.id || `thread-${index}`;
            const threadId = thread.id;
            const isSelected = threadId === selectedThreadId;
            
            return (
              <button
                key={uniqueKey}
                onClick={() => threadId && onSelectThread(threadId)}
                className={cn(
                  "w-full flex items-start p-3 rounded-lg text-left transition-all border border-transparent",
                  isSelected 
                    ? "bg-accent border-border shadow-sm" 
                    : "hover:bg-muted/50 hover:border-border/50"
                )}
                aria-current={isSelected}
              >
                <strong className={cn(
                  "text-sm font-medium line-clamp-2",
                  isSelected ? "text-foreground" : "text-foreground/80"
                )}>
                  {thread.title || "Sin título"}
                </strong>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
};
