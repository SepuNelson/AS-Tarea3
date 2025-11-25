import type { Message } from "@/types";
import { sanitizeHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import { AlertTriangle, File, Edit2, Trash2, User } from "lucide-react";

interface Props {
  message: Message;
  isOwn: boolean;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  moderationBanner?: string | null;
}

export const MessageBubble = ({ message, isOwn, onEdit, onDelete, moderationBanner }: Props) => {
  // Formatear fecha de forma segura
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? "" : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <article
      className={cn(
        "group relative max-w-[85%] md:max-w-[75%] w-fit animate-in fade-in slide-in-from-bottom-2 duration-300",
        isOwn ? "self-end ml-auto" : "self-start mr-auto"
      )}
      aria-label={`Mensaje de ${isOwn ? 'ti' : message.user_id}${message.created_at ? ` enviado a las ${formatTime(message.created_at)}` : ''}`}
    >
      {/* Nombre del usuario (solo para mensajes de otros) */}
      {!isOwn && (
        <div className="flex items-center gap-1 mb-1 px-1">
          <User className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            Usuario #{message.user_id.slice(0, 8)}
          </span>
        </div>
      )}

      <div className={cn(
        "rounded-2xl px-4 py-3 shadow-sm",
        isOwn 
          ? "bg-primary text-primary-foreground rounded-tr-sm" 
          : "bg-card border text-card-foreground rounded-tl-sm",
        moderationBanner && "border-2 border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10"
      )}>
        {/* Banner de Moderación */}
        {moderationBanner && (
          <div className="flex items-start gap-2 mb-2 text-xs font-bold text-yellow-600 dark:text-yellow-500 bg-yellow-100/50 dark:bg-yellow-900/20 p-2 rounded">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Moderación: {moderationBanner}</span>
          </div>
        )}

        {/* Contenido del Mensaje */}
        {message.content && (
          <div
            className={cn(
              "text-sm leading-relaxed break-words",
              isOwn ? "text-primary-foreground" : "text-foreground"
            )}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(message.content).replace(/\n/g, "<br />") }}
          />
        )}

        {/* Archivos Adjuntos */}
        {message.files && message.files.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {message.files.map((file) => (
              <a
                key={file.id}
                href={`/api/files/${file.id}`}
                target="_blank"
                rel="noreferrer"
                className={cn(
                    "flex items-center gap-2 text-xs p-2 rounded border transition-colors no-underline",
                    isOwn 
                        ? "bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20 text-primary-foreground" 
                        : "bg-muted hover:bg-muted/80 text-foreground border-border"
                )}
              >
                <File className="w-4 h-4 shrink-0" />
                <span className="truncate font-medium">{file.filename}</span>
                <span className="opacity-70 text-[10px]">({Math.round(file.size / 1024)} KB)</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Metadata & Actions Footer */}
      <div className={cn(
          "flex items-center gap-2 mt-1 px-1 text-[10px] text-muted-foreground transition-opacity",
          isOwn ? "justify-end" : "justify-start"
      )}>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            {message.updated_at ? "Editado · " : ""}
            {formatTime(message.created_at)}
        </span>

        {isOwn && (
            <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                {onEdit && (
                    <button 
                        onClick={() => onEdit(message)} 
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Editar"
                        aria-label="Editar mensaje"
                    >
                        <Edit2 className="w-3 h-3" />
                    </button>
                )}
                {onDelete && (
                    <button 
                        onClick={() => onDelete(message)} 
                        className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                        title="Eliminar"
                        aria-label="Eliminar mensaje"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                )}
            </div>
        )}
      </div>
    </article>
  );
};
