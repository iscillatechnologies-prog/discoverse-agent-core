# Deploy Discoverse AI Backend — Step by Step

**Audience:** non-technical. No terminal needed. Browser only.

---

## Part 1 — Send this code to GitHub (one time, ~2 minutes)

1. In Lovable, click the **GitHub** button (top right of the editor) **or** open **Connectors → GitHub → Connect project**.
2. Click **Authorize Lovable** in the popup.
3. Pick the GitHub account where the repo should live.
4. Click **Create Repository**.

That's it. Every change Lovable makes (including this `/backend` folder) is now in your GitHub repo automatically.

---

## Part 2 — Get your AI API keys (~5 minutes)

You need at least **one** of these. Get them from the provider's site, copy the key, keep it in a notepad for Part 3.

| Key | Where to get it | Required? |
|---|---|---|
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys | Recommended |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey | Recommended |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys | Optional |

> Tip: Gemini has a generous free tier — start there if you want to test free.

---

## Part 3 — Deploy on Render (~5 minutes, free tier works)

1. Go to https://render.com → **Sign up with GitHub** (use the same account from Part 1).
2. Click **New +** (top right) → **Blueprint**.
3. Pick your repo from the list (the one Lovable just created).
4. Render reads `backend/render.yaml` automatically and shows you:
   - 1 web service (the API)
   - 1 Postgres database
   - 1 Redis instance
5. Render will ask you to fill in the API keys from Part 2 — paste them in.
6. Click **Apply**.

Render takes ~5 minutes to build. When it's green, copy the URL it gives you (e.g. `https://discoverse-ai-api.onrender.com`).

---

## Part 4 — Connect your Lovable frontend to the new backend

1. In Lovable chat, paste:
   > Switch the chat panel to use my Render backend at `https://YOUR-URL.onrender.com` instead of the Supabase edge function.

I'll update `src/lib/useChatStream.ts` for you.

---

## Troubleshooting

**Build fails on Render?**
- Open the Render service → **Logs** tab → copy the red error → paste it back to me in Lovable chat. I'll fix it.

**API works but agents don't respond?**
- Check `OPENAI_API_KEY` / `GEMINI_API_KEY` are set in Render → Service → **Environment** tab.

**Want to add the optional Weaviate vector memory?**
- Sign up at https://console.weaviate.cloud (free sandbox), then add `WEAVIATE_URL` + `WEAVIATE_API_KEY` to Render env.

**Free tier sleeps after 15 min of no traffic?**
- That's Render's free plan. Upgrade to Starter ($7/mo) for always-on.
