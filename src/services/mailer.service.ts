import fs from 'fs';
import path from 'path';
import nodemailer, { Transporter } from 'nodemailer';
import Handlebars from 'handlebars';
import { ENV, isInTestMode } from '../config';
import { LANGUAGES } from '../types/consts';

let transporterPromise: Promise<Transporter> | null = null;

/**
 * Lazily builds a nodemailer transport. If SMTP_* env vars are not configured we fall
 * back to an Ethereal test account so the app still runs end-to-end in dev without real
 * SMTP — the preview URL for each sent message is logged to the console.
 */
function getTransporter(): Promise<Transporter> {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (ENV.SMTP_HOST) {
      return nodemailer.createTransport({
        host: ENV.SMTP_HOST,
        port: ENV.SMTP_PORT,
        secure: ENV.SMTP_PORT === 465,
        auth: ENV.SMTP_USER ? { user: ENV.SMTP_USER, pass: ENV.SMTP_PASS } : undefined,
      });
    }

    const testAccount = await nodemailer.createTestAccount();
    console.warn('[mailer] No SMTP_HOST configured — using an Ethereal test account for outgoing email.');
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  })();

  return transporterPromise;
}

const templateCache = new Map<string, HandlebarsTemplateDelegate>();

function renderTemplate(templateName: string, lang: LANGUAGES, data: Record<string, unknown>): string {
  const cacheKey = `${lang}/${templateName}`;
  let compiled = templateCache.get(cacheKey);

  if (!compiled) {
    const templatePath = path.join(__dirname, '..', 'templates', lang, `${templateName}.hbs`);
    const source = fs.readFileSync(templatePath, 'utf-8');
    compiled = Handlebars.compile(source);
    templateCache.set(cacheKey, compiled);
  }

  return compiled(data);
}

export type MailTemplate = 'welcome' | 'orderCreated' | 'orderConfirmed' | 'orderCancelled';

export interface SendTemplateEmailArgs {
  to: string;
  subject: string;
  template: MailTemplate;
  lang?: LANGUAGES | string;
  data: Record<string, unknown>;
}

export async function sendTemplateEmail({ to, subject, template, lang, data }: SendTemplateEmailArgs) {
  const resolvedLang = (Object.values(LANGUAGES) as string[]).includes(lang as string) ? (lang as LANGUAGES) : LANGUAGES.en;

  const html = renderTemplate(template, resolvedLang, data);

  // Tests mock this module entirely, so no real SMTP/Ethereal call happens under `yarn test`.
  if (isInTestMode) {
    return { messageId: 'test-mode-noop', previewUrl: undefined };
  }

  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: ENV.SMTP_FROM,
    to,
    subject,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[mailer] Preview URL for "${subject}" -> ${to}: ${previewUrl}`);
  }

  return { messageId: info.messageId, previewUrl: previewUrl || undefined };
}

/**
 * Password-reset emails don't have a dedicated .hbs template in the required set
 * (welcome/orderCreated/orderConfirmed) — sent as a minimal inline HTML string instead.
 */
export async function sendRawEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (isInTestMode) {
    return { messageId: 'test-mode-noop', previewUrl: undefined };
  }

  const transporter = await getTransporter();
  const info = await transporter.sendMail({ from: ENV.SMTP_FROM, to, subject, html });
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[mailer] Preview URL for "${subject}" -> ${to}: ${previewUrl}`);
  }
  return { messageId: info.messageId, previewUrl: previewUrl || undefined };
}

export const mailerService = {
  sendWelcomeEmail(to: string, lang: LANGUAGES | string, data: { name?: string }) {
    return sendTemplateEmail({ to, subject: 'Welcome to DeLAPLAK', template: 'welcome', lang, data });
  },
  sendOrderCreatedEmail(to: string, lang: LANGUAGES | string, data: Record<string, unknown>) {
    return sendTemplateEmail({ to, subject: 'Your DeLAPLAK order has been received', template: 'orderCreated', lang, data });
  },
  sendOrderConfirmedEmail(to: string, lang: LANGUAGES | string, data: Record<string, unknown>) {
    return sendTemplateEmail({ to, subject: 'Your DeLAPLAK order has been confirmed', template: 'orderConfirmed', lang, data });
  },
  sendOrderCancelledEmail(to: string, lang: LANGUAGES | string, data: Record<string, unknown>) {
    return sendTemplateEmail({ to, subject: 'Your DeLAPLAK order has been cancelled', template: 'orderCancelled', lang, data });
  },
  sendPasswordResetEmail(to: string, resetUrl: string) {
    const html = `<p>You requested a password reset.</p><p><a href="${resetUrl}">Click here to reset your password</a> (valid for 1 hour).</p><p>If you did not request this, you can safely ignore this email.</p>`;
    return sendRawEmail({ to, subject: 'Reset your DeLAPLAK password', html });
  },
};
