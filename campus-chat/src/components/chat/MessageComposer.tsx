import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { BotShortcutBar } from "@/components/bots/BotShortcutBar";
import { Paperclip, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onSend: (content: string) => Promise<void> | void;
  onUploadFile: (file: File) => void;
  onCommand: (command: string) => void;
  disabled?: boolean;
}

export const MessageComposer = ({ onSend, onUploadFile, onCommand, disabled }: Props) => {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!value.trim()) return;
    const content = value.trim();
    setValue("");
    
    // Reset height
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }

    if (content.startsWith("/")) {
      onCommand(content);
      return;
    }
    await onSend(content);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onUploadFile(file);
    event.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const adjustHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  return (
    <section className="max-w-4xl mx-auto w-full">
      <form 
        onSubmit={handleSubmit} 
        className={cn(
            "bg-background border rounded-xl shadow-sm transition-all duration-200 flex flex-col overflow-hidden",
            isFocused ? "ring-2 ring-primary/20 border-primary" : "border-input"
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={adjustHeight}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Escribe un mensaje..."
          className="w-full max-h-[200px] min-h-[50px] bg-transparent p-3 md:p-4 resize-none focus:outline-none text-sm md:text-base"
          rows={1}
          disabled={disabled}
          aria-label="Escribir mensaje"
        />
        
        <div className="flex items-center justify-between px-2 pb-2 bg-muted/10 border-t border-border/50 pt-2">
          <div className="flex items-center gap-1">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors"
              title="Adjuntar archivo"
              aria-label="Adjuntar archivo"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} />
            
            <div className="h-4 w-[1px] bg-border mx-1" />
            
            <div className="hidden sm:block">
                <BotShortcutBar onCommand={onCommand} />
            </div>
          </div>

          <div className="flex items-center gap-2">
             <div className="text-[10px] text-muted-foreground hidden md:block mr-2">
                 <strong>Enter</strong> para enviar
             </div>
             <button 
                type="submit" 
                className={cn(
                    "p-2 rounded-lg transition-all duration-200 flex items-center gap-2",
                    value.trim() 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" 
                        : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                )}
                disabled={disabled || !value.trim()}
                aria-label="Enviar mensaje"
             >
                <Send className="w-4 h-4" />
             </button>
          </div>
        </div>
      </form>
      <div className="sm:hidden mt-2 px-1">
         <BotShortcutBar onCommand={onCommand} />
      </div>
    </section>
  );
};
