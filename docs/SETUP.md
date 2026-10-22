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
3. **Sign-in email:** Supabase only allows editing email templates once a custom SMTP sender is set up.
   Until then the app uses Supabase's default email, which has a sign-in link (no code); the link
   lands on `/auth/confirm` and works in the same browser that asked for it.
   After setting up SMTP: Authentication → Emails → Templates, paste `supabase/email-templates/sign-in.html`
   into both **Magic link or OTP** and **Confirm sign up**, subject `Your Verabatch sign-in code`,
   and switch the login screen back to the code entry step (`verifyCode` in `app/login/actions.ts`).

Status (Oct 20, 2026): steps 1 and 2 done. Step 3 waits on custom SMTP.

## Later migrations

Run each new file in `supabase/migrations` in the SQL Editor, in order.

- `0002_products.sql`: run Oct 20, 2026.
- `0003_sizes.sql`: run Oct 20, 2026.
- `0004_batches.sql`: run Oct 20, 2026.
- `0005_variations.sql`: run Oct 20, 2026.
- `0006_descriptions.sql`: NOT RUN YET (Oct 22). Descriptions won't save until it is.

## Before launch

- Supabase's built-in email sender is limited to a few emails an hour. Set up a custom SMTP sender before real users.
- Vercel's free Hobby plan is for non-commercial use; move to Pro before charging customers.
