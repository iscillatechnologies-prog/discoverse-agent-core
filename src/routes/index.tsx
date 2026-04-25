import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Brain, Layers, Workflow, ArrowRight, Zap, Shield, Network } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard" });
  }, [session, loading, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/20 blur-[160px]" />
      <div className="absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full bg-accent/15 blur-[140px]" />

      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent glow-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide">Discoverse AI</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Rhinoes Innovation Labs
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            to="/login"
            search={{ mode: "signup" }}
            className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-medium text-primary-foreground glow-primary transition hover:opacity-90"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-5xl px-8 pt-20 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-glass-border bg-glass px-4 py-1.5 text-xs"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-ring" />
          Next-generation autonomous AI
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl"
        >
          The AI operating system
          <br />
          <span className="text-gradient">that thinks, plans, and executes.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
        >
          Discoverse AI breaks goals into steps, routes work to specialized agents, picks the right model,
          remembers context, and shows every decision transparently.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/login"
            search={{ mode: "signup" }}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-semibold text-primary-foreground glow-primary transition hover:scale-[1.02]"
          >
            Launch Discoverse <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-glass-border bg-glass px-6 py-3 text-sm font-medium hover:bg-secondary"
          >
            Sign in
          </Link>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-8 pb-32">
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass rounded-2xl p-6 transition hover:bg-secondary/40"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-glass-border px-8 py-6 text-center text-xs text-muted-foreground">
        Discoverse AI · Rhinoes Innovation Labs
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Brain,
    title: "Multi-agent cognition",
    desc: "Research, Builder, Analyst, and Personal Assistant agents collaborate, delegate, and share memory.",
  },
  {
    icon: Workflow,
    title: "Plan → Execute → Verify",
    desc: "Every task is decomposed and tracked. Reasoning is logged so you see exactly what happened.",
  },
  {
    icon: Network,
    title: "Smart model routing",
    desc: "Routes between GPT-5, Gemini 2.5 Pro, and Gemini 3 Flash based on complexity, latency, and cost.",
  },
  {
    icon: Layers,
    title: "Working + long-term memory",
    desc: "Conversation context, user preferences, and reusable workflows — persisted securely.",
  },
  {
    icon: Shield,
    title: "Enterprise security",
    desc: "Row-level access, encrypted secrets, audit trails. Your data, isolated to your account.",
  },
  {
    icon: Zap,
    title: "Live action feed",
    desc: "Watch the AI think — tools used, models picked, memories accessed — in real time.",
  },
];
