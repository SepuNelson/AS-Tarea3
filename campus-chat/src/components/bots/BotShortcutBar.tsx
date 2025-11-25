import { Sparkles } from "lucide-react";

interface Props {
  onCommand: (command: string) => void;
}

const shortcuts = [
  { label: "Wiki", command: "/wiki" },
  { label: "Código", command: "/code" },
  { label: "Académico", command: "/faq" },
  { label: "Utilidad", command: "/util" },
  { label: "Cálculo", command: "/calc" },
];

export const BotShortcutBar = ({ onCommand }: Props) => {
  return (
    <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar">
      {shortcuts.map((shortcut) => (
        <button
          key={shortcut.command}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border bg-background hover:bg-accent hover:text-accent-foreground transition-colors whitespace-nowrap"
          onClick={() => onCommand(shortcut.command)}
        >
          <Sparkles className="w-3 h-3 text-primary/70" />
          {shortcut.label}
        </button>
      ))}
    </div>
  );
};
