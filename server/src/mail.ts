// Sends email sign-in codes: Resend (https://resend.com) in production, a stdout line in development.
import type { L1 } from '@linguasea/contract';

export type LoginCodeMail = { to: string; code: string; l1: L1 };

export interface Mailer {
  sendLoginCode(mail: LoginCodeMail): Promise<void>;
}

export class MailError extends Error {}

/** Minutes a code stays valid (the message tells the learner). */
export const LOGIN_CODE_MINUTES = 10;

const MESSAGES: Record<L1, (code: string) => { subject: string; text: string }> = {
  th: (code) => ({
    subject: `รหัสเข้าสู่ระบบ LinguaSEA: ${code}`,
    text: `รหัสเข้าสู่ระบบของคุณคือ ${code}\nรหัสนี้ใช้ได้ ${LOGIN_CODE_MINUTES} นาที`,
  }),
};

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

export class ResendMailer implements Mailer {
  constructor(
    private apiKey: string,
    private from: string,
    private fetchImpl: typeof fetch = fetch,
  ) {}

  async sendLoginCode({ to, code, l1 }: LoginCodeMail) {
    const { subject, text } = (MESSAGES[l1] ?? MESSAGES.th)(code);
    const html = text
      .split('\n')
      .map((line) => `<p>${escapeHtml(line).replace(code, `<strong style="font-size:24px;letter-spacing:4px">${code}</strong>`)}</p>`)
      .join('');
    const res = await this.fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: this.from, to: [to], subject, text, html }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new MailError(`resend answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}

/** Development and e2e: the code is printed as one line that tools read back. */
export const consoleMailer: Mailer = {
  async sendLoginCode({ to, code }) {
    process.stdout.write(`[mail] login code for ${to}: ${code}\n`);
  },
};

/**
 * Resend when configured; otherwise the console in development and nothing in production
 * (email sign-in then answers 503).
 */
export function createMailer(opts: { resend?: { apiKey: string; from: string }; production: boolean }): Mailer | undefined {
  if (opts.resend) return new ResendMailer(opts.resend.apiKey, opts.resend.from);
  return opts.production ? undefined : consoleMailer;
}
