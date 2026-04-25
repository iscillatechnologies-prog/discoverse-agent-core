import { Cpu } from "lucide-react";
import type { ChatMessage } from "@/lib/useChatStream";

export function ModelUsage({ messages }: { messages: ChatMessage[] }) {
  const usage = new Map<string, number>();
  let totalChars = 0;
  messages.forEach((m) => {
    if (m.role === "assistant") {
      if (m.model) usage.set(m.model, (usage.get(m.model) ?? 0) + 1);
      totalChars += m.content.length;
    }
  });
  const totalCalls = [...usage.values()].reduce((a, b) => a + b, 0);
  const approxTokens = Math.round(totalChars / 4);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <Cpu className="h-3.5 w-3.5" /> Model usage
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Calls" value={totalCalls} />
        <Stat label="≈ Tokens out" value={approxTokens.toLocaleString()} />
      </div>

      <div className="mt-3 space-y-2">
        {usage.size === 0 ? (
          <div className="glass rounded-xl p-4 text-xs text-muted-foreground">
            No model calls yet. Discoverse routes between Gemini and GPT-5 based on the task.
          </div>
        ) : (
          [...usage.entries()].map(([model, count]) => {
            const pct = Math.round((count / totalCalls) * 100);
            return (
              <div key={model} className="glass rounded-xl p-3">
                <div className="flex items-center justify-between text-xs">
                  <code className="font-mono text-[11px]">{model}</code>
                  <span className="text-muted-foreground">
                    {count} · {pct}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-semibold">{value}</div>
    </div>
  );
}
