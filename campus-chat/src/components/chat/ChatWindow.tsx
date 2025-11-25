import { useEffect, useRef } from "react";
import type { Message } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { Loader2 } from "lucide-react";

interface Props {
  messages: Message[];
  currentUserId?: string;
  hasMore?: boolean;
  isLoading?: boolean;
  onLoadMore?: () => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  typingUsers?: string[];
  moderationMap?: Record<string, string | null>;
}

export const ChatWindow = ({
  messages,
  currentUserId,
  hasMore,
  isLoading,
  onLoadMore,
  onEdit,
  onDelete,
  typingUsers = [],
  moderationMap = {},
}: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true); // Asumimos que empieza abajo

  // Detectar si el usuario está cerca del fondo al hacer scroll
  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    // Consideramos "cerca del fondo" si está a menos de 100px del final
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    isNearBottomRef.current = distanceFromBottom < 100;
  };

  // Efecto para manejar el scroll automático
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || isLoading) return;

    // Si estamos cerca del fondo o es la primera carga (mensajes previos vacíos o pocos), bajar
    if (isNearBottomRef.current) {
      // Usamos timeout para asegurar que el DOM se actualizó
      setTimeout(() => {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }, 100);
    }
  }, [messages.length, isLoading, typingUsers]); // Dependencias que disparan el scroll

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background/50">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 scroll-smooth min-h-0"
      >
        {hasMore && (
          <div className="flex justify-center py-4">
            <button 
              onClick={onLoadMore} 
              disabled={isLoading} 
              className="flex items-center gap-2 text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-full transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : null}
              {isLoading ? "Cargando..." : "Cargar anteriores"}
            </button>
          </div>
        )}
        
        {messages.length === 0 && !isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <p>No hay mensajes aún.</p>
            </div>
        )}

        {/* Invertir orden: mensajes más antiguos arriba, más recientes abajo */}
        {[...messages].reverse().map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.user_id === currentUserId}
            onEdit={onEdit}
            onDelete={onDelete}
            moderationBanner={moderationMap[message.id]}
          />
        ))}
        
        {typingUsers.length > 0 && (
             <div className="pt-2 animate-in fade-in slide-in-from-bottom-2">
                 <TypingIndicator users={typingUsers} />
             </div>
        )}
      </div>
    </div>
  );
};
