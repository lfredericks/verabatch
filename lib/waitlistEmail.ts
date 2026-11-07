import { brand } from "./brand";
import { defaultTheme } from "./brand/themes/default";

/** The "you're on the list" email sent once, when someone joins the waitlist. */
export function waitlistWelcomeEmail(firstName = ""): { subject: string; text: string; html: string } {
  const name = brand.name;
  const c = defaultTheme.colors.light;
  const [vera, batch] = brand.wordmark ?? [name, ""];
  const subject = `You're on the ${name} waitlist`;
  const hi = firstName ? `Hi ${firstName},` : "Hi there,";
  const paras = [
    hi,
    `Thanks for joining the ${name} waitlist.`,
    `${name} is the all-in-one ledger for small-batch makers. Your recipes and recipe tests, every batch with its lot number, and the supplier lots that went into it, all in one place. When it's time to sell, your labels and product sheets come straight from the recipe.`,
    `Early access opens soon. We'll email you when your spot is ready, and we'll pick our first testers from this list.`,
    `Got a minute? Reply and tell us what you make and what slows you down. I read every reply.`,
  ];
  const sign = `Leslie, founder of ${name}`;
  const foot = `You're getting this because this address was entered on verabatch.com. Not you? Reply and we'll remove it.`;

  const text = [...paras, "", sign, "", foot].join("\n\n");
  const esc = (t: string) =>
    t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const p = (t: string) =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${c.ink}">${esc(t)}</p>`;
  const html = `<!doctype html><html><body style="margin:0;background:${c.paper};font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<p style="margin:0 0 24px;font-family:Georgia,serif;font-size:28px;line-height:1"><span style="color:${c.accent}">${vera}</span><span style="color:${c.ink}">${batch}</span></p>
${paras.map(p).join("\n")}
${p(sign)}
<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:${c.muted}">${esc(foot)}</p>
</div></body></html>`;
  return { subject, text, html };
}
