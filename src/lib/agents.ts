export type AgentKey = "research" | "builder" | "analyst" | "assistant" | "auto";

export interface AgentDef {
  key: AgentKey;
  name: string;
  tagline: string;
  color: string; // tailwind token
  icon: string;
  defaultModel: string;
  systemPrompt: string;
}

export const AGENTS: Record<Exclude<AgentKey, "auto">, AgentDef> = {
  research: {
    key: "research",
    name: "Research Agent",
    tagline: "Web research, summaries, citations",
    color: "agent-research",
    icon: "Search",
    defaultModel: "google/gemini-3-flash-preview",
    systemPrompt:
      "You are the Research Agent of Discoverse AI by Rhinoes Innovation Labs. You break a research goal into steps, gather and synthesize information, cite sources clearly when given, and produce structured reports with sections: Overview, Key Findings, Details, Sources, Next Steps. Be concise and rigorous.",
  },
  builder: {
    key: "builder",
    name: "Builder Agent",
    tagline: "Code, configs, technical artifacts",
    color: "agent-builder",
    icon: "Wrench",
    defaultModel: "openai/gpt-5",
    systemPrompt:
      "You are the Builder Agent of Discoverse AI. You produce production-quality code, configs, and technical artifacts. Always: explain the design briefly, output complete files in fenced code blocks with language tags, list any assumptions, and propose next steps.",
  },
  analyst: {
    key: "analyst",
    name: "Analyst Agent",
    tagline: "Data analysis, charts, comparisons",
    color: "agent-analyst",
    icon: "BarChart3",
    defaultModel: "google/gemini-2.5-pro",
    systemPrompt:
      "You are the Analyst Agent of Discoverse AI. You analyze data and questions analytically. Structure replies as: Question, Approach, Analysis, Findings, Recommendation. Use markdown tables when comparing options. Quantify when possible.",
  },
  assistant: {
    key: "assistant",
    name: "Personal Assistant",
    tagline: "General tasks, drafting, scheduling",
    color: "agent-assistant",
    icon: "Sparkles",
    defaultModel: "google/gemini-3-flash-preview",
    systemPrompt:
      "You are the Personal Assistant of Discoverse AI. You handle general requests warmly and efficiently — drafting messages, planning, summarizing, and answering everyday questions. Be friendly and direct.",
  },
};

export function routeAgent(prompt: string): Exclude<AgentKey, "auto"> {
  const p = prompt.toLowerCase();
  if (/(research|market|competitor|trend|analyze the market|study|whitepaper|sources?)/.test(p)) return "research";
  if (/(code|build|implement|api|function|component|deploy|sql|script|refactor)/.test(p)) return "builder";
  if (/(data|chart|compare|metric|kpi|forecast|statistic|spreadsheet|csv|analy[sz]e)/.test(p)) return "analyst";
  return "assistant";
}
