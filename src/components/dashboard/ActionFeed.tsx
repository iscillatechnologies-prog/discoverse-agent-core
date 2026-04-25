import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Circle, AlertCircle, Activity } from "lucide-react";
import type { ChatMessage, PlanStep } from "@/lib/useChatStream";

export function ActionFeed({ messages }: { messages: ChatMessage[] }) {
  // Flatten plan steps from all assistant messages
  const events: { mid: string; step: PlanStep; idx: number }[] = [];
  messages.forEach((m) => {
    if (m.role === "assistant" && m.plan) {
      m.plan.forEach((step, idx) => events.push({ mid: m.id, step, idx }));
    }
  });

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <Activity className="h-3.5 w-3.5" /> Live action feed
      </div>

      {events.length === 0 ? (
        <div className="glass rounded-xl p-4 text-xs text-muted-foreground">
          Send a message to see Discoverse plan, pick tools, and execute step by step.
        </div>
      ) : (
        <ol className="relative ml-3 space-y-3 border-l border-glass-border pl-5">
          {events.map(({ mid, step, idx }) => (
            <motion.li
              key={`${mid}-${idx}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="relative"
            >
              <span className="absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-background">
                <StatusIcon status={step.status} />
              </span>
              <div className="glass rounded-lg px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <code className="font-mono text-[10px] text-primary">{step.tool}</code>
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {step.status}
                  </span>
                </div>
                <div className="mt-0.5 text-xs">{step.label}</div>
              </div>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: PlanStep["status"] }) {
  if (status === "done") return <CheckCircle2 className="h-3.5 w-3.5 text-primary" />;
  if (status === "running") return <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />;
  if (status === "error") return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
  return <Circle className="h-3.5 w-3.5 text-muted-foreground" />;
}
