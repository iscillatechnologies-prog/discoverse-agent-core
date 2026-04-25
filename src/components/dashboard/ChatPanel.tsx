import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { AGENTS, type AgentKey } from "@/lib/agents";
import type { useChatStream } from "@/lib/useChatStream";

type ChatHook = ReturnType<typeof useChatStream>;

const SUGGESTIONS = [
  "Research the AI agent platform market and create a report.",
  "Build a Postgres schema for a multi-agent task queue.",
  "Compare GPT-5 vs Gemini 2.5 Pro for long-context reasoning.",
  "Draft a launch announcement for an enterprise AI product.",
];

export function ChatPanel({
  chat,
  agent,
  model,
}: {
  chat: ChatHook;
  agent: AgentKey;
  model?: string;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.messages]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || chat.isStreaming) return;
    setInput("");
    await chat.send(text, { agent, model });
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-glass-border px-6 py-3">
        <div>
          <div className="text-sm font-semibold">Discoverse Chat</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {agent === "auto" ? "Auto-routing enabled" : `Routed to ${AGENTS[agent].name}`}
          </div>
        </div>
        {chat.isStreaming && (
          <div className="flex items-center gap-2 rounded-full border border-glass-border bg-glass px-3 py-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            Thinking…
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        {chat.messages.length === 0 ? (
          <Welcome onPick={(s) => setInput(s)} />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {chat.messages.map((m) => (
              <Message key={m.id} m={m} />
            ))}
            {chat.error && (
              <div className="rounded-lg bg-destructive/15 px-4 py-2 text-sm text-destructive">
                {chat.error}
              </div>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={submit}
        className="shrink-0 border-t border-glass-border bg-background/40 px-4 py-4 backdrop-blur"
      >
        <div className="mx-auto max-w-3xl">
          <div className="glass-strong flex items-end gap-2 rounded-2xl px-3 py-2 transition focus-within:ring-2 focus-within:ring-primary/40">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Give Discoverse a goal — research, build, analyze, anything…"
              rows={1}
              className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <button
              type="submit"
              disabled={!input.trim() || chat.isStreaming}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground glow-primary transition hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 px-2 text-[10px] text-muted-foreground">
            Discoverse may make mistakes. Verify outputs that matter. Powered by Lovable AI Gateway.
          </div>
        </div>
      </form>
    </div>
  );
}

function Welcome({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="mx-auto mt-10 max-w-3xl text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent glow-primary">
        <Sparkles className="h-6 w-6 text-primary-foreground" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">
        What should we <span className="text-gradient">discover</span> today?
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Discoverse plans, picks the right agent and model, and shows every step in the right panel.
      </p>
      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="glass rounded-xl px-4 py-3 text-left text-sm transition hover:bg-secondary/50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function Message({ m }: { m: ChatHook["messages"][number] }) {
  if (m.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="self-end max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-to-br from-primary/90 to-accent/90 px-4 py-2.5 text-sm text-primary-foreground shadow-lg"
      >
        {m.content}
      </motion.div>
    );
  }

  const agent = m.agent && m.agent !== "auto" ? AGENTS[m.agent as keyof typeof AGENTS] : undefined;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-[92%]">
      <AnimatePresence>
        {(m.agentName || m.model) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-1.5 flex items-center gap-2 text-[11px] text-muted-foreground"
          >
            {agent && (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-glass-border bg-glass px-2 py-0.5"
                style={{ color: `var(--${agent.color})` }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `var(--${agent.color})` }} />
                {m.agentName}
              </span>
            )}
            {m.model && (
              <span className="rounded-full border border-glass-border bg-glass px-2 py-0.5 font-mono text-[10px]">
                {m.model}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
        {m.content ? (
          <article className="prose prose-sm prose-invert max-w-none prose-pre:bg-black/40 prose-pre:border prose-pre:border-glass-border prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
          </article>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Planning…
          </div>
        )}
        {m.streaming && m.content && <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-primary align-middle" />}
      </div>
    </motion.div>
  );
}
