// Discoverse AI — streaming chat with agent routing
// Uses Lovable AI Gateway. Streams SSE back to the client.
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AGENT_PROMPTS: Record<string, { name: string; system: string; defaultModel: string }> = {
  research: {
    name: "Research Agent",
    defaultModel: "google/gemini-3-flash-preview",
    system:
      "You are the Research Agent of Discoverse AI by Rhinoes Innovation Labs. Break the goal into steps, synthesize information, and produce a structured report with sections: Overview, Key Findings, Details, Sources (with notes on what would be searched), Next Steps. Be concise and rigorous. Use markdown.",
  },
  builder: {
    name: "Builder Agent",
    defaultModel: "openai/gpt-5",
    system:
      "You are the Builder Agent of Discoverse AI. Produce production-quality code, configs, and technical artifacts. Explain the design briefly, output complete files in fenced code blocks with language tags, list assumptions, and propose next steps.",
  },
  analyst: {
    name: "Analyst Agent",
    defaultModel: "google/gemini-2.5-pro",
    system:
      "You are the Analyst Agent of Discoverse AI. Structure replies as: Question, Approach, Analysis, Findings, Recommendation. Use markdown tables when comparing. Quantify when possible.",
  },
  assistant: {
    name: "Personal Assistant",
    defaultModel: "google/gemini-3-flash-preview",
    system:
      "You are the Personal Assistant of Discoverse AI by Rhinoes Innovation Labs. Handle general requests warmly and efficiently. Be friendly and direct. Use markdown.",
  },
};

function routeAgent(prompt: string): keyof typeof AGENT_PROMPTS {
  const p = prompt.toLowerCase();
  if (/(research|market|competitor|trend|study|whitepaper|sources?)/.test(p)) return "research";
  if (/(code|build|implement|api|function|component|deploy|sql|script|refactor)/.test(p)) return "builder";
  if (/(data|chart|compare|metric|kpi|forecast|statistic|spreadsheet|csv|analy[sz]e)/.test(p)) return "analyst";
  return "assistant";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, agent: requestedAgent, model: requestedModel } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
    const agentKey =
      requestedAgent && requestedAgent !== "auto" && AGENT_PROMPTS[requestedAgent]
        ? requestedAgent
        : routeAgent(lastUser?.content ?? "");
    const agent = AGENT_PROMPTS[agentKey];
    const model = requestedModel || agent.defaultModel;

    // Build a synthetic action plan for the live action feed
    const userText = lastUser?.content ?? "";
    const planSteps = buildPlan(agentKey, userText);

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [{ role: "system", content: agent.system }, ...messages],
      }),
    });

    if (!upstream.ok) {
      if (upstream.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (upstream.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Add funds in Settings → Workspace → Usage.",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await upstream.text();
      console.error("Gateway error", upstream.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Inject a meta event before forwarding the upstream stream.
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const meta = {
          type: "meta",
          agent: agentKey,
          agentName: agent.name,
          model,
          plan: planSteps,
        };
        controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify(meta)}\n\n`));
        const reader = upstream.body!.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("chat error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function buildPlan(agent: string, userText: string) {
  const t = userText.slice(0, 80);
  switch (agent) {
    case "research":
      return [
        { tool: "memory.recall", label: "Recall related memories", status: "done" },
        { tool: "planner.decompose", label: `Plan research for: "${t}"`, status: "done" },
        { tool: "browser.search", label: "Search the open web (simulated)", status: "running" },
        { tool: "synth.report", label: "Synthesize structured report", status: "queued" },
      ];
    case "builder":
      return [
        { tool: "planner.decompose", label: `Decompose build task: "${t}"`, status: "done" },
        { tool: "code.scaffold", label: "Scaffold artifact structure", status: "running" },
        { tool: "code.generate", label: "Generate implementation", status: "queued" },
      ];
    case "analyst":
      return [
        { tool: "planner.decompose", label: `Frame analysis: "${t}"`, status: "done" },
        { tool: "data.inspect", label: "Inspect available signals", status: "running" },
        { tool: "report.compile", label: "Compile findings & recommendation", status: "queued" },
      ];
    default:
      return [
        { tool: "planner.respond", label: "Compose response", status: "running" },
      ];
  }
}
