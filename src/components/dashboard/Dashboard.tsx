import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { ChatPanel } from "./ChatPanel";
import { ActionFeed } from "./ActionFeed";
import { AgentStatus } from "./AgentStatus";
import { ArtifactViewer } from "./ArtifactViewer";
import { MemoryViewer } from "./MemoryViewer";
import { ModelUsage } from "./ModelUsage";
import { useChatStream } from "@/lib/useChatStream";
import type { AgentKey } from "@/lib/agents";

export type RightPanel = "actions" | "agents" | "artifacts" | "memory" | "models";

export function Dashboard() {
  const [agent, setAgent] = useState<AgentKey>("auto");
  const [model, setModel] = useState<string | undefined>(undefined);
  const [right, setRight] = useState<RightPanel>("actions");
  const chat = useChatStream();

  return (
    <div className="flex h-screen w-screen overflow-hidden text-foreground">
      <Sidebar
        agent={agent}
        onAgent={setAgent}
        model={model}
        onModel={setModel}
        onNewChat={chat.reset}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        <ChatPanel chat={chat} agent={agent} model={model} />
      </main>

      <aside className="hidden w-[380px] shrink-0 border-l border-glass-border lg:flex lg:flex-col">
        <div className="flex shrink-0 items-center gap-1 border-b border-glass-border px-3 py-2">
          {(
            [
              ["actions", "Actions"],
              ["agents", "Agents"],
              ["artifacts", "Artifacts"],
              ["memory", "Memory"],
              ["models", "Models"],
            ] as [RightPanel, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setRight(key)}
              className={`relative rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                right === key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {right === key && (
                <motion.div
                  layoutId="rightTab"
                  className="absolute inset-0 rounded-md bg-secondary/70"
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                />
              )}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={right}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="p-4"
            >
              {right === "actions" && <ActionFeed messages={chat.messages} />}
              {right === "agents" && <AgentStatus messages={chat.messages} />}
              {right === "artifacts" && <ArtifactViewer messages={chat.messages} />}
              {right === "memory" && <MemoryViewer />}
              {right === "models" && <ModelUsage messages={chat.messages} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </aside>
    </div>
  );
}
