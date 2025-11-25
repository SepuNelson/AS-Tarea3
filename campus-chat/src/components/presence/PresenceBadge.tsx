import { cn } from "@/lib/utils";

interface Props {
  status: "online" | "offline" | "busy" | "away";
  label?: string;
}

export const PresenceBadge = ({ status, label }: Props) => {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        aria-hidden
        className={cn(
          "w-2 h-2 rounded-full",
          status === "online" && "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]",
          status === "busy" && "bg-destructive",
          status === "away" && "bg-yellow-500",
          status === "offline" && "bg-slate-400"
        )}
      />
      {label}
    </div>
  );
};
