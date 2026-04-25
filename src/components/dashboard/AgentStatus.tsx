import { motion } from "framer-motion";
import { AGENTS } from "@/lib/agents";
import type { ChatMessage } from "@/lib/useChatStream";

export function AgentStatus({ messages }: { messages: ChatMessage[] }) {
  // Count usage by agent
  const usage = new Map<string, number>();
  messages.forEach((m) => {
    if (m.role === "assistant" && m.agent) {
      usage.set(m.agent, (usage.get(m.agent) ?? 0) + 1);
    }
  });
  const activeAgent = [...messages].reverse().find((m) => m.role === "assistant" && m.streaming)?.agent;

  return (
    <div>
      <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Agent network
      </div>
      <div className="space-y-2">
        {Object.values(AGENTS).map((a) => {
          const count = usage.get(a.key) ?? 0;
          const isActive = activeAgent === a.key;
          return (
            <motion.div
              key={a.key}
              animate={{ scale: isActive ? 1.02 : 1 }}
              className={`glass rounded-xl p-3 transition ${isActive ? "ring-1 ring-primary" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <span
                      className="block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: `var(--${a.color})` }}
                    />
                    {isActive && (
                      <span
                        className="absolute inset-0 animate-pulse-ring rounded-full"
                        style={{ backgroundColor: `var(--${a.color})` }}
                      />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold">{a.name}</div>
                    <div className="text-[10px] text-muted-foreground">{a.tagline}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold">{count}</div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">runs</div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="font-mono">{a.defaultModel}</span>
                <span className={isActive ? "text-primary" : ""}>{isActive ? "● active" : "○ idle"}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
