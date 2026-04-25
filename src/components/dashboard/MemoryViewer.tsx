import { useEffect, useState } from "react";
import { Brain, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

interface Memory {
  id: string;
  kind: string;
  content: string;
  created_at: string;
}

export function MemoryViewer() {
  const { user } = useAuth();
  const [items, setItems] = useState<Memory[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("memories")
      .select("id, kind, content, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setItems((data as Memory[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const add = async () => {
    if (!user || !text.trim()) return;
    const { data, error } = await supabase
      .from("memories")
      .insert({ user_id: user.id, content: text.trim(), kind: "fact" })
      .select("id, kind, content, created_at")
      .single();
    if (!error && data) {
      setItems((prev) => [data as Memory, ...prev]);
      setText("");
    }
  };

  const remove = async (id: string) => {
    await supabase.from("memories").delete().eq("id", id);
    setItems((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <Brain className="h-3.5 w-3.5" /> Long-term memory
      </div>

      <div className="glass mb-3 flex items-center gap-2 rounded-xl p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Teach Discoverse something…"
          className="flex-1 bg-transparent px-2 py-1 text-xs outline-none placeholder:text-muted-foreground/60"
        />
        <button
          onClick={add}
          disabled={!text.trim()}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="text-xs text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="glass rounded-xl p-4 text-xs text-muted-foreground">
          No memories yet. Add facts, preferences, or workflows here so Discoverse remembers them.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((m) => (
            <li key={m.id} className="glass group flex items-start gap-2 rounded-lg p-2.5 text-xs">
              <span className="mt-0.5 rounded bg-primary/20 px-1.5 py-0.5 font-mono text-[9px] uppercase text-primary">
                {m.kind}
              </span>
              <span className="flex-1">{m.content}</span>
              <button
                onClick={() => remove(m.id)}
                className="opacity-0 transition group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
