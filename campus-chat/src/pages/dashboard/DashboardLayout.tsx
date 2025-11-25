import { useDashboardLogic } from "./useDashboardLogic";
import { ChannelSidebar } from "@/components/layout/ChannelSidebar";
import { ThreadList } from "@/components/layout/ThreadList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { MessageComposer } from "@/components/chat/MessageComposer";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { AdvancedThreadSearch } from "@/components/search/AdvancedThreadSearch";
import type { Message } from "@/types";
import { cn } from "@/lib/utils";
import { ArrowLeft, X, Info, Shield, FileText } from "lucide-react";
import { useState } from "react";

export const DashboardLayout = () => {
  const {
    user,
    channels,
    selectedChannelId,
    threads,
    selectedThread,
    selectedThreadId,
    messages,
    messagesQuery,
    typingState,
    moderationNotes,
    presenceStats,
    bannedUsers,
    sharedFilesQuery,
    messageActions,
    updateRoute,
    handleSendMessage,
    handleUpload,
    handleCommand,
    handleCreateChannel,
    handleCreateThread,
    presignDownload,
    // Paginación de canales
    channelPage,
    hasMoreChannels,
    handleNextChannelPage,
    handlePrevChannelPage,
  } = useDashboardLogic();

  const [isMobileInfoOpen, setIsMobileInfoOpen] = useState(false);

  // Determinar vista activa en mobile basado en la ruta
  // 0: Channels, 1: Threads, 2: Chat
  const mobileViewLevel = selectedThreadId ? 2 : selectedChannelId ? 1 : 0;

  const handleEditMessage = async (message: Message) => {
    const newContent = window.prompt("Editar mensaje", message.content ?? "");
    if (!newContent) return;
    await messageActions.edit.mutateAsync({ messageId: message.id, payload: { content: newContent } });
  };

  const handleDeleteMessage = async (message: Message) => {
    if (!window.confirm("¿Eliminar mensaje?")) return;
    await messageActions.remove.mutateAsync(message.id);
  };

  const handleBack = () => {
    if (mobileViewLevel === 2) {
      updateRoute({ threadId: undefined, channelId: selectedChannelId ?? undefined });
    } else if (mobileViewLevel === 1) {
      updateRoute({ channelId: undefined, threadId: undefined });
    }
  };

  return (
    <div className="h-screen w-full bg-background text-foreground overflow-hidden flex flex-col md:grid md:grid-cols-[280px_300px_1fr_300px]">
      
      {/* Mobile Header Navigation (Solo visible en mobile) */}
      <div className="md:hidden flex items-center justify-between p-3 border-b bg-card shrink-0">
        <div className="flex items-center gap-2">
          {mobileViewLevel > 0 && (
            <button 
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-accent"
              aria-label="Volver"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-lg font-semibold truncate">
             {mobileViewLevel === 2 ? selectedThread?.title : mobileViewLevel === 1 ? channels.find(c => c.id === selectedChannelId)?.name : "Campus Chat"}
          </h1>
        </div>
        {mobileViewLevel === 2 && (
          <button 
            onClick={() => setIsMobileInfoOpen(!isMobileInfoOpen)}
            className="p-2 -mr-2 rounded-full hover:bg-accent"
            aria-label="Ver información"
          >
             {isMobileInfoOpen ? <X className="w-5 h-5" /> : <Info className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Panel 1: Channel Sidebar */}
      <aside className={cn(
        "h-full border-r bg-muted/30 min-h-0",
        // Desktop: siempre visible
        "hidden md:block",
        // Mobile: solo visible si mobileViewLevel === 0
        mobileViewLevel === 0 && "block flex-1 md:flex-none"
      )}>
        <ChannelSidebar
          channels={channels}
          selectedChannelId={selectedChannelId}
          onSelectChannel={(channelId) => updateRoute({ channelId, threadId: undefined })}
          onCreateChannel={handleCreateChannel}
          presenceStats={presenceStats}
          currentPage={channelPage}
          hasMore={hasMoreChannels}
          onNextPage={handleNextChannelPage}
          onPrevPage={handlePrevChannelPage}
        />
      </aside>

      {/* Panel 2: Thread List */}
      <section className={cn(
        "h-full border-r bg-background min-h-0",
        // Desktop: siempre visible
        "hidden md:block",
        // Mobile: solo visible si mobileViewLevel === 1
        mobileViewLevel === 1 && "block flex-1 md:flex-none"
      )}>
        <ThreadList
          threads={threads}
          selectedThreadId={selectedThreadId}
          onSelectThread={(threadId) => updateRoute({ channelId: selectedChannelId ?? undefined, threadId })}
          onCreateThread={handleCreateThread}
        />
      </section>

      {/* Panel 3: Main Chat Area */}
      <main className={cn(
        "h-full flex-col relative bg-background min-h-0 overflow-hidden",
        // Desktop: siempre visible
        "hidden md:flex",
        // Mobile: solo visible si mobileViewLevel === 2 y no está abierto el info panel
        mobileViewLevel === 2 && !isMobileInfoOpen && "flex flex-1 md:flex-none"
      )}>
        {/* Desktop Header (Hidden on mobile usually, but kept for context if needed) */}
        <header className="hidden md:flex justify-between items-center p-4 border-b h-16 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Hilo activo
            </div>
            <h2 className="text-lg font-semibold leading-tight">{selectedThread?.title ?? "Selecciona un hilo"}</h2>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/50 px-2 py-1 rounded">
            <Shield className="w-3 h-3" />
            {bannedUsers?.total ?? 0} baneados
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col relative min-h-0">
          <ChatWindow
            messages={messages}
            currentUserId={user?.id}
            typingUsers={Object.keys(typingState[selectedThreadId ?? ""] ?? {})}
            onLoadMore={() => messagesQuery.fetchNextPage()}
            hasMore={Boolean(messagesQuery.hasNextPage)}
            isLoading={messagesQuery.isFetchingNextPage}
            onEdit={handleEditMessage}
            onDelete={handleDeleteMessage}
            moderationMap={moderationNotes}
          />
        </div>

        <div className="p-4 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
          <MessageComposer
            onSend={handleSendMessage}
            onUploadFile={handleUpload}
            onCommand={handleCommand}
            disabled={messageActions.send.isPending}
          />
        </div>
      </main>

      {/* Panel 4: Info Sidebar (Responsive Drawer/Column) */}
      <aside className={cn(
        "md:border-l bg-muted/10 flex-col h-full overflow-y-auto min-h-0",
        "md:flex",
        isMobileInfoOpen ? "flex flex-1 fixed inset-0 z-50 bg-background md:static" : "hidden"
      )}>
         {/* Mobile Close Button for Info Panel */}
         <div className="md:hidden flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Detalles</h2>
            <button onClick={() => setIsMobileInfoOpen(false)} className="p-2"><X className="w-5 h-5"/></button>
         </div>

        <div className="p-4 space-y-4">
          {/* Búsqueda Global */}
          <GlobalSearch
            onNavigate={({ channelId, threadId }) => {
              updateRoute({
                channelId: channelId ?? selectedChannelId ?? undefined,
                threadId: threadId ?? selectedThreadId ?? undefined,
              });
              setIsMobileInfoOpen(false);
            }}
          />

          {/* Búsqueda Avanzada de Threads */}
          <AdvancedThreadSearch
            onSelectThread={(thread) => {
              updateRoute({
                channelId: thread.channel_id ?? selectedChannelId ?? undefined,
                threadId: thread.id,
              });
              setIsMobileInfoOpen(false);
            }}
          />

          {/* Moderación */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Shield className="w-4 h-4" />
              <h3>Moderación</h3>
            </div>
            <div className="bg-card border rounded-lg p-4 text-sm text-muted-foreground shadow-sm">
              <ul className="space-y-2 pl-4 list-disc">
                <li>Strikes automáticos activados.</li>
                <li>Protección anti-spam activa.</li>
              </ul>
              <button
                className="mt-3 text-xs font-medium text-primary hover:underline flex items-center gap-1"
                onClick={() => window.open("/api/v1/admin/banned-users", "_blank")}
              >
                Ver panel completo <ArrowLeft className="w-3 h-3 rotate-180" />
              </button>
            </div>
          </section>

          {/* Archivos Compartidos */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <FileText className="w-4 h-4" />
              <h3>Archivos</h3>
            </div>
            
            {sharedFilesQuery.isLoading && <div className="h-20 animate-pulse bg-muted rounded-lg"/>}
            
            {!sharedFilesQuery.isLoading && sharedFilesQuery.data && sharedFilesQuery.data.length === 0 && (
              <div className="text-sm text-muted-foreground italic text-center py-8 border rounded-lg border-dashed">
                No hay archivos compartidos
              </div>
            )}

            <div className="space-y-2">
              {sharedFilesQuery.data?.map((file) => (
                <button
                  key={file.id}
                  onClick={async () => {
                    const { url } = await presignDownload(file.id);
                    window.open(url, "_blank");
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground transition-all text-left group"
                >
                  <div className="p-2 bg-muted rounded group-hover:bg-background transition-colors">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-sm font-medium truncate">{file.filename}</div>
                    <div className="text-xs text-muted-foreground">
                      {file.mime_type} · {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
};
