# WHG Team Portal — Setup Guide

This guide takes you from zero to a live, deployed app. Follow the steps in order.
Estimated total time: **30–45 minutes**.

---

## What You'll Need

- ✅ Supabase account — supabase.com (you already have this)
- ✅ Vercel account — vercel.com (you already have this)
- ✅ OpenAI account — platform.openai.com (you already have this)
- ✅ GitHub account — to connect with Vercel
- ✅ Node.js installed on your computer (v18+) — nodejs.org

---

## Step 1 — Create a Supabase Project

1. Go to supabase.com → **New Project**
2. Name it: `whg-team-portal`
3. Choose a strong database password (save it somewhere)
4. Region: **US East** (closest to Louisiana)
5. Wait 1–2 minutes for it to provision

---

## Step 2 — Run the Database Schema

1. In your Supabase project → click **SQL Editor** (left sidebar)
2. Click **New query**
3. Open the file `supabase/schema.sql` from this project
4. Paste the entire contents into the SQL Editor
5. Click **Run**
6. You should see: "Success. No rows returned."

This creates all your tables, policies, and restaurant seed data.

---

## Step 3 — Get Your Supabase API Keys

1. In Supabase → **Project Settings** → **API** (left sidebar)
2. Copy these three values — you'll need them shortly:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` *(keep this secret — server only)*

---

## Step 4 — Get Your OpenAI API Key

1. Go to platform.openai.com → **API Keys**
2. Click **Create new secret key** → name it `whg-team-portal`
3. Copy it → `OPENAI_API_KEY`

---

## Step 5 — Set Up the Project Locally

Open your terminal and run these commands:

```bash
# 1. Go into the project folder
cd whg-team-portal

# 2. Install dependencies
npm install

# 3. Copy the environment file
cp .env.example .env.local
```

Open `.env.local` and fill in your four values:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app  ← update this after deploying
```

---

## Step 6 — Ingest the Employee Handbook

This is the step that "teaches" the AI your handbook. Run this from the project folder:

```bash
node scripts/ingest.mjs --file /path/to/WHG_Team_Handbook.pdf --source employee --clear
```

**Replace `/path/to/WHG_Team_Handbook.pdf` with the actual path to your handbook PDF.**

Example on Mac:
```bash
node scripts/ingest.mjs --file ~/Downloads/WHG_Team_Handbook_MASTER_3_5_2026_Final.pdf --source employee --clear
```

This takes 2–5 minutes. You'll see a progress bar. When it says "Done!" the AI is ready.

---

## Step 7 — Ingest the Manager Handbook (when ready)

When you have the Manager Handbook Reference PDF ready:

```bash
node scripts/ingest.mjs --file /path/to/Manager_Handbook.pdf --source manager --clear
```

---

## Step 8 — Push to GitHub

```bash
# Initialize git in the project folder
git init
git add .
git commit -m "Initial WHG Team Portal"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/whg-team-portal.git
git push -u origin main
```

---

## Step 9 — Deploy to Vercel

1. Go to vercel.com → **Add New Project**
2. Import your `whg-team-portal` GitHub repo
3. **Before clicking Deploy**, click **Environment Variables** and add all four:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
4. Click **Deploy**
5. Wait ~2 minutes. Vercel gives you a URL like `whg-team-portal.vercel.app`
6. Copy that URL → update `NEXT_PUBLIC_APP_URL` in Vercel's environment variables

---

## Step 10 — Set Up Supabase Auth Redirect URL

1. In Supabase → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL: `https://whg-team-portal.vercel.app`
3. Add to **Redirect URLs**: `https://whg-team-portal.vercel.app/api/auth/callback`
4. Click Save

---

## Step 11 — Create Your Admin Account

You need to create the first account (yours) directly in Supabase:

1. In Supabase → **Authentication** → **Users** → **Add User**
2. Enter your email and a password → click **Create User**
3. Copy the **User UUID** shown in the users list
4. Go to **SQL Editor** → run this query (replace the values):

```sql
insert into profiles (id, full_name, restaurant_id, role, status)
values (
  'PASTE-YOUR-UUID-HERE',
  'Randy Wong',
  (select id from restaurants where slug = 'ichiban'),  -- or any restaurant
  'admin',
  'active'
);
```

5. You can now log in at your Vercel URL with your email and password

---

## Step 12 — Create Manager and Employee Accounts

Once logged in as admin:

1. Click **Manage Team** in the top-right corner
2. Click **+ Add Member**
3. Fill in their name, email, restaurant, role, and a temporary password
4. Share the login URL and their credentials with them directly
5. They log in and can use the handbook assistant immediately

---

## Ongoing: Updating the Handbook

When you release a new version of the handbook:

```bash
node scripts/ingest.mjs --file /path/to/New_Handbook.pdf --source employee --clear
```

The `--clear` flag removes the old version before ingesting the new one.
The app reflects the update **instantly** — no redeployment needed.

---

## Adding a New Restaurant

1. In Supabase → **SQL Editor**, run:
```sql
insert into restaurants (name, slug) values ('New Restaurant Name', 'new-slug');
```

2. Add any location-specific policies:
```sql
insert into restaurant_policies (restaurant_id, policy_key, policy_value)
values (
  (select id from restaurants where slug = 'new-slug'),
  'meal_discount',
  'Description of their specific meal policy'
);
```

The new restaurant will appear in the dropdown when adding team members immediately.

---

## Archiving an Employee

In the app → **Manage Team** → find the employee → click **Archive**.

Their access is revoked immediately. Their account data is retained for records.

---

## Estimated Monthly Costs

| Service | Cost |
|---------|------|
| Vercel | Free (Hobby plan) |
| Supabase | Free (up to 500MB, 50K users) |
| OpenAI | ~$5–15/month depending on usage |
| **Total** | **~$5–15/month** |

---

## Questions?

If anything breaks during setup, the most common issues are:
1. Wrong API keys in `.env.local` or Vercel environment variables
2. Forgot to run the SQL schema in Supabase
3. Redirect URL not set in Supabase Auth settings

All three are easy to fix by going back to the relevant step.
