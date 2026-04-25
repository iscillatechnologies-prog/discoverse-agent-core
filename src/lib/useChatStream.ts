import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AgentKey } from "@/lib/agents";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  agent?: string;
  agentName?: string;
  model?: string;
  plan?: PlanStep[];
  streaming?: boolean;
}

export interface PlanStep {
  tool: string;
  label: string;
  status: "queued" | "running" | "done" | "error";
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const send = useCallback(
    async (input: string, opts: { agent?: AgentKey; model?: string } = {}) => {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: input,
      };
      const assistantId = crypto.randomUUID();
      setError(null);
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: "assistant", content: "", streaming: true },
      ]);
      setIsStreaming(true);

      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
            agent: opts.agent ?? "auto",
            model: opts.model,
          }),
        });

        if (!resp.ok || !resp.body) {
          let msg = "Request failed";
          try {
            const j = await resp.json();
            msg = j.error ?? msg;
          } catch {}
          throw new Error(msg);
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let acc = "";
        let done = false;

        while (!done) {
          const r = await reader.read();
          if (r.done) break;
          buf += decoder.decode(r.value, { stream: true });

          let idx: number;
          while ((idx = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, idx);
            buf = buf.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith("event:")) continue;
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") {
              done = true;
              break;
            }
            try {
              const parsed = JSON.parse(json);
              // Meta event from our server
              if (parsed.type === "meta") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          agent: parsed.agent,
                          agentName: parsed.agentName,
                          model: parsed.model,
                          plan: parsed.plan,
                        }
                      : m,
                  ),
                );
                continue;
              }
              const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (delta) {
                acc += delta;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
                );
              }
            } catch {
              buf = line + "\n" + buf;
              break;
            }
          }
        }

        // Mark plan steps done + stop streaming
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  streaming: false,
                  plan: m.plan?.map((s) => ({ ...s, status: "done" as const })),
                }
              : m,
          ),
        );
      } catch (e: any) {
        setError(e.message ?? "Stream failed");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, streaming: false, content: m.content || `Error: ${e.message}` }
              : m,
          ),
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [messages],
  );

  return { messages, send, isStreaming, error, reset };
}
