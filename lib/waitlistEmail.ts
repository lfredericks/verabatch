import { brand } from "./brand";
import { defaultTheme } from "./brand/themes/default";

/** The "you're on the list" email sent once, when someone joins the waitlist. */
export function waitlistWelcomeEmail(): { subject: string; text: string; html: string } {
  const name = brand.name;
  const c = defaultTheme.colors.light;
  const [vera, batch] = brand.wordmark ?? [name, ""];
  const subject = `You're on the ${name} waitlist`;
  const paras = [
    `Thanks for joining the ${name} waitlist.`,
    `${name} takes the recipe you already use and drafts your label from it: official ingredient names, the right order, net contents and lettering sizes. It also keeps a record of every batch, down to the supplier lots you used.`,
    `Early access opens soon. We'll email you when your spot is ready, and we'll pick our first testers from this list.`,
    `Got a minute? Reply and tell us what you make and what slows you down. A real person reads every reply.`,
  ];
  const sign = `The ${name} team`;
  const foot = `You're getting this because this address was entered on verabatch.com. Not you? Reply and we'll remove it.`;

  const text = [...paras, "", sign, "", foot].join("\n\n");
  const p = (t: string) =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${c.ink}">${t}</p>`;
  const html = `<!doctype html><html><body style="margin:0;background:${c.paper};font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<p style="margin:0 0 24px;font-family:Georgia,serif;font-size:28px;line-height:1"><span style="color:${c.accent}">${vera}</span><span style="color:${c.ink}">${batch}</span></p>
${paras.map(p).join("\n")}
${p(sign)}
<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:${c.muted}">${foot}</p>
</div></body></html>`;
  return { subject, text, html };
}
