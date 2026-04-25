import { Link } from "@tanstack/react-router";
import { Sparkles, Plus, LogOut, Settings, Bot } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AGENTS, type AgentKey } from "@/lib/agents";

const MODELS = [
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash · fast" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro · deep" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash · balanced" },
  { id: "openai/gpt-5", label: "GPT-5 · premium" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini" },
];

export function Sidebar({
  agent,
  onAgent,
  model,
  onModel,
  onNewChat,
}: {
  agent: AgentKey;
  onAgent: (a: AgentKey) => void;
  model: string | undefined;
  onModel: (m: string | undefined) => void;
  onNewChat: () => void;
}) {
  const { user, signOut } = useAuth();

  return (
    <aside className="hidden w-[260px] shrink-0 flex-col border-r border-glass-border md:flex">
      <Link to="/" className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent glow-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-wide">Discoverse AI</div>
          <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            Rhinoes Labs
          </div>
        </div>
      </Link>

      <div className="px-3">
        <button
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-3 py-2 text-xs font-semibold text-primary-foreground glow-primary transition hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> New conversation
        </button>
      </div>

      <div className="mt-6 px-4">
        <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          Agent
        </div>
        <button
          onClick={() => onAgent("auto")}
          className={`mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
            agent === "auto" ? "bg-secondary/80 text-foreground" : "text-muted-foreground hover:bg-secondary/40"
          }`}
        >
          <Bot className="h-3.5 w-3.5" /> Auto-route
        </button>
        {Object.values(AGENTS).map((a) => (
          <button
            key={a.key}
            onClick={() => onAgent(a.key)}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
              agent === a.key
                ? "bg-secondary/80 text-foreground"
                : "text-muted-foreground hover:bg-secondary/40"
            }`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: `var(--${a.color})` }}
            />
            {a.name}
          </button>
        ))}
      </div>

      <div className="mt-6 px-4">
        <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          Model
        </div>
        <select
          value={model ?? ""}
          onChange={(e) => onModel(e.target.value || undefined)}
          className="w-full rounded-md border border-glass-border bg-input/40 px-2 py-1.5 text-xs outline-none focus:border-primary"
        >
          <option value="">Auto (per agent)</option>
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-auto border-t border-glass-border p-3">
        <div className="mb-2 truncate px-1 text-xs text-muted-foreground">
          {user?.email}
        </div>
        <div className="flex gap-1">
          <button
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-secondary/40 px-2 py-1.5 text-xs hover:bg-secondary"
            title="Settings"
          >
            <Settings className="h-3.5 w-3.5" /> Settings
          </button>
          <button
            onClick={signOut}
            className="flex items-center justify-center rounded-md bg-secondary/40 px-2 py-1.5 text-xs hover:bg-destructive/30"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
