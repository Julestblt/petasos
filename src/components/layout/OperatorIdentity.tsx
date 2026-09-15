import { GazeHero, type GazeState } from "@/components/gaze/GazeHero";
import { Button } from "@/components/ui/button";
import { OPERATOR_NAME, OPERATOR_ROLE } from "@/lib/constants";
import { useChatStore } from "@/stores/chatStore";
import { useConnectionStore } from "@/stores/connectionStore";
import { useThemeStore } from "@/stores/themeStore";
import { Moon, Sun } from "lucide-react";

export function OperatorIdentity() {
  const isSending = useChatStore((state) => state.isSending);
  const hermes = useConnectionStore((state) => state.hermes);
  const theme = useThemeStore((state) => state.theme);
  const toggle = useThemeStore((state) => state.toggle);
  const state: GazeState = isSending
    ? "thinking"
    : hermes === "degraded" || hermes === "offline"
      ? "attention"
      : "idle";

  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <GazeHero size={36} state={state} interactive className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium tracking-tight text-foreground">
          {OPERATOR_NAME}
        </div>
        <div className="text-xs text-muted-foreground">{OPERATOR_ROLE}</div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={
          theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
        }
        className="h-8 w-8 shrink-0"
        onClick={toggle}
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
