# Deploy Discoverse AI Backend to Railway — No Credit Card, No Gemini Account Needed

**Audience:** non-technical. Browser only. ~10 minutes total.

Railway gives you **$5 free credit** every month with **no credit card required**. That's enough to run this backend 24/7 on the smallest plan.

This guide uses **Lovable AI** as the model provider — one key, all models (Gemini, GPT-5, Claude), no separate signup.

---

## Part 1 — Push code to GitHub (one time, ~2 min)

1. In Lovable, click the **GitHub** button (top-right) **or** open **Connectors → GitHub → Connect project**.
2. Click **Authorize Lovable** in the popup.
3. Pick your GitHub account.
4. Click **Create Repository**.

Done. The `/backend` folder is now in your GitHub repo.

---

## Part 2 — Get your Lovable AI API key (~1 min, free)

1. Inside Lovable, open this project.
2. Open **Connectors** (sidebar) → **Lovable AI** → **Enable** (if not already).
3. Click **Copy API key**. It looks like `lov_...`.

That's it — no Google/OpenAI/Anthropic account needed. Lovable AI gives you free monthly usage and routes to Gemini, GPT-5, and Claude through one key.

> **Note:** The `LOVABLE_API_KEY` shown in your Lovable Cloud secrets is the same key — you can copy it from there too.

---

## Part 3 — Deploy on Railway (~5 min, no card)

1. Go to https://railway.com → click **Login** → **Login with GitHub**.
2. Authorize Railway to read your repos.
3. On the dashboard, click **New Project** → **Deploy from GitHub repo**.
4. Pick the repo Lovable created in Part 1.
5. Railway will detect the project. In **Settings → Root Directory**, type: `backend`
6. Railway reads `backend/railway.json` and starts building the Docker image automatically.

### Add the database + Redis (free, in same project)

7. In your Railway project, click **+ New** (top right) → **Database** → **Add PostgreSQL**.
8. Click **+ New** again → **Database** → **Add Redis**.

Railway auto-creates `DATABASE_URL` and `REDIS_URL` variables — but you must link them to your service:

9. Click your **API service** (the one built from your repo) → **Variables** tab → **+ New Variable** → **Add Reference**.
10. Pick `DATABASE_URL` from the Postgres service. Repeat for `REDIS_URL` from Redis.

### Add your secrets

11. Still in **Variables**, click **+ New Variable** → **Raw Editor** and paste:

```
ENVIRONMENT=production
JWT_SECRET=paste-any-long-random-string-here-min-32-chars
SUPABASE_URL=https://ztllrzlkdnlxjipxmhff.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bGxyemxrZG5seGppcHhtaGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjU1ODMsImV4cCI6MjA5MjcwMTU4M30.zCgciuID9vMYwcoVGmC5mWfGtacctvrwFkJ0NMHoq0k
LOVABLE_API_KEY=paste-your-lov_-key-from-part-2
```

Click **Update Variables**. Railway redeploys automatically.

### Get your public URL

12. Click your service → **Settings** → **Networking** → **Generate Domain**.
13. Copy the URL (e.g. `https://discoverse-ai-production.up.railway.app`).

---

## Part 4 — Connect this Lovable app to your live backend

Paste this into Lovable chat:

> Switch the chat panel to use my Railway backend at `https://YOUR-URL.up.railway.app` instead of the Supabase edge function.

I'll update `src/lib/useChatStream.ts` for you.

---

## Troubleshooting

**Build fails on Railway?**
Open the service → **Deployments** tab → click the failed build → copy the red error → paste into Lovable chat.

**App builds but `/health` fails?**
Make sure both `DATABASE_URL` and `REDIS_URL` are linked as **References** (not typed manually) — they need to point to the Railway-managed Postgres/Redis.

**Chat says "Lovable AI credits exhausted"?**
Go to Lovable → Settings → Workspace → Usage → top up. Free tier resets monthly.

**Out of $5 free Railway credit?**
Railway gives $5 every month free. If you run out, sleep the service (Settings → "Pause") when not testing. Each pause/resume cycle costs $0.

**Want to use your own Gemini/OpenAI key instead?**
Add `GEMINI_API_KEY` or `OPENAI_API_KEY` to Railway Variables and remove `LOVABLE_API_KEY`. The router will fall back to direct providers automatically.

**Want vector memory (Weaviate)?**
Sign up at https://console.weaviate.cloud (free sandbox), then add `WEAVIATE_URL` + `WEAVIATE_API_KEY` to Railway Variables.
