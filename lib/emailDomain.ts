import { resolve4, resolve6, resolveMx } from "node:dns/promises";

/**
 * Can this email address's domain receive mail? Looks for a mail server (MX), falling back to a
 * plain address record, as mail servers do. Says no only when the domain clearly has neither;
 * if the lookup is slow or fails for another reason it says yes, so real people aren't turned away.
 */
export async function domainTakesMail(email: string, timeoutMs = 3000): Promise<boolean> {
  const domain = email.slice(email.lastIndexOf("@") + 1);
  if (!domain) return false;
  const missing = (e: unknown) => {
    const code = (e as { code?: string })?.code;
    return code === "ENOTFOUND" || code === "ENODATA" || code === "ESERVFAIL" || code === "EBADNAME";
  };
  const check = async (): Promise<boolean> => {
    try {
      const mx = await resolveMx(domain);
      if (mx.some((r) => r.exchange && r.exchange !== ".")) return true;
    } catch (e) {
      if (!missing(e)) return true;
    }
    for (const look of [resolve4, resolve6]) {
      try {
        if ((await look(domain)).length) return true;
      } catch (e) {
        if (!missing(e)) return true;
      }
    }
    return false;
  };
  const timeout = new Promise<boolean>((r) => setTimeout(() => r(true), timeoutMs));
  return Promise.race([check(), timeout]);
}
