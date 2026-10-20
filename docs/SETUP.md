# Setup

Accounts (all owned by Leslie):

| Service | What it does | Where |
| --- | --- | --- |
| GitHub | Holds the code | github.com/lfredericks/verabatch (an empty Verabatch/verabatch org repo also exists; the Claude GitHub app is installed on both accounts) |
| Vercel | Puts the app online; deploys every push to `main` | Team "verabatch", project "verabatch", live at https://verabatch-six.vercel.app |
| Supabase | Database and sign-in | Organization "Verabatch", project ref `lbuyjpscimxbawotgzkt`, East US |

Vercel environment variables (already set):

- `NEXT_PUBLIC_SUPABASE_URL` = `https://lbuyjpscimxbawotgzkt.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = the project's publishable key (safe to expose)

Never commit or paste the Supabase secret / service_role key or personal access tokens.

## One-time Supabase setup (milestone 1)

Do these in the Supabase dashboard, or have Claude do them through the Management API
when the session can reach supabase.co / supabase.com.

1. **Database tables:** SQL Editor → New query → paste all of `supabase/migrations/0001_businesses.sql` → Run.
2. **Site URL:** Authentication → URL Configuration → Site URL = `https://verabatch-six.vercel.app`.
   Add `https://verabatch-six.vercel.app/**` under Redirect URLs. (Update both when verabatch.com is live.)
3. **Sign-in email:** Authentication → Emails → Templates. Paste `supabase/email-templates/sign-in.html`
   into both **Magic Link** and **Confirm signup**. Subject: `Your Verabatch sign-in code`.

## Before launch

- Supabase's built-in email sender is limited to a few emails an hour. Set up a custom SMTP sender before real users.
- Vercel's free Hobby plan is for non-commercial use; move to Pro before charging customers.
