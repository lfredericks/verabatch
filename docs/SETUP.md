# Setup

Accounts (all owned by Leslie):

| Service | What it does | Where |
| --- | --- | --- |
| GitHub | Holds the code | github.com/lfredericks/verabatch (an empty Verabatch/verabatch org repo also exists; the Claude GitHub app is installed on both accounts) |
| Vercel | Puts the app online; deploys every push to `main` | Team "verabatch", project "verabatch", live at https://app.verabatch.com (CNAME `app` at Bluehost; the old https://verabatch-six.vercel.app forwards to it with a 308, set in Vercel Nov 6) |
| Supabase | Database and sign-in | Organization "Verabatch", project ref `lbuyjpscimxbawotgzkt`, East US |

Vercel environment variables (already set):

- `NEXT_PUBLIC_SUPABASE_URL` = `https://lbuyjpscimxbawotgzkt.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = the project's publishable key (safe to expose)
- `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET` = the Canva Connect app's keys (secret)
- `RESEND_API_KEY` = Resend key "Verabatch waitlist", full access (secret; added Nov 7)
- `RESEND_WAITLIST_SEGMENT_ID` = optional; a Resend segment id to file waitlist contacts under

Never commit or paste the Supabase secret / service_role key or personal access tokens.

## One-time Supabase setup (milestone 1)

Do these in the Supabase dashboard, or have Claude do them through the Management API
when the session can reach supabase.co / supabase.com.

1. **Database tables:** SQL Editor → New query → paste all of `supabase/migrations/0001_businesses.sql` → Run.
2. **Site URL:** Authentication → URL Configuration → Site URL = `https://app.verabatch.com`.
   Redirect URLs: `https://app.verabatch.com/**` and `https://verabatch-six.vercel.app/**`.
3. **Sign-in email:** Supabase only allows editing email templates once a custom SMTP sender is set up.
   Until then the app uses Supabase's default email, which has a sign-in link (no code); the link
   lands on `/auth/confirm` and works in the same browser that asked for it.
   After setting up SMTP: Authentication → Emails → Templates, paste `supabase/email-templates/sign-in.html`
   into both **Magic link or OTP** and **Confirm sign up**, subject `Your Verabatch sign-in code`,
   and switch the login screen back to the code entry step (`verifyCode` in `app/login/actions.ts`).

Status (Nov 5, 2026): all three done. Custom SMTP is Resend (smtp.resend.com, port 465,
username `resend`, password = a Resend API key, kept only in Supabase). Sender is
hello@verabatch.com: verabatch.com was verified in Resend on Nov 5 (DNS at Bluehost: TXT
resend._domainkey, TXT _dmarc, CNAME send, CNAME rsend), so email reaches anyone. Email limit is 30/hour. The Magic link template has the code and a token_hash link
built from `{{ .SiteURL }}`, so it follows the Site URL setting; the login screen asks
for the code. Template changes can take a few minutes to start being used.

## Later migrations

Run each new file in `supabase/migrations` in the SQL Editor, in order.

- `0002_products.sql`: run Oct 20, 2026.
- `0003_sizes.sql`: run Oct 20, 2026.
- `0004_batches.sql`: run Oct 20, 2026.
- `0005_variations.sql`: run Oct 20, 2026.
- `0006_descriptions.sql`: run Oct 22, 2026.
- `0007_logos.sql`: run Oct 22, 2026 (logo columns, private `logos` storage bucket and its rules).
- `0008_warnings.sql`: run Oct 22, 2026 (warnings picked per product).
- `0009_label_templates.sql`: run Oct 22, 2026 (oval labels, label sheet a size was picked from).
- `0010_supplies.sql`: run Oct 22, 2026 (supplier lots, and which lots each batch line used).

## Before launch

- Copy the sign-in template into **Confirm sign up** too.
- Supabase's free plan pauses the project after about a week unused; move to a paid plan before real users.
- Vercel's free Hobby plan is for non-commercial use; move to Pro before charging customers.

## Google sign-in (Nov 6)

- Google Cloud project `verabatch` → Google Auth Platform. Client "Verabatch web" (Web application):
  JavaScript origin `https://app.verabatch.com`, redirect URI
  `https://lbuyjpscimxbawotgzkt.supabase.co/auth/v1/callback` (change to the custom auth domain later).
- Supabase → Authentication → Sign In / Providers → Google: on, with the client ID and secret.
- Publishing status is Testing (test users only) until Branding has the home page, privacy and terms
  links and the verabatch.com domain; then Audience → Publish app.
