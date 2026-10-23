import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getSmtpConfig() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : undefined;
  return { host, port, user, pass };
}

function getTransporter(): nodemailer.Transporter | null {
  const { host, port, user, pass } = getSmtpConfig();
  if (!user || !pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
    });
  }
  return transporter;
}

export function isSmtpConfigured(): boolean {
  const { user, pass } = getSmtpConfig();
  return Boolean(user && pass);
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${'*'.repeat(Math.max(name.length - 2, 1))}@${domain}`;
}

const BRAND = '#059669';

function buildEmail(code: string, purpose: 'login' | 'reset') {
  const isReset = purpose === 'reset';
  const title = isReset ? 'Réinitialisation du mot de passe' : 'Code de connexion';
  const intro = isReset
    ? 'Vous avez demandé à réinitialiser votre mot de passe sur VServicesRDC. Saisissez le code ci-dessous pour continuer.'
    : 'Voici votre code de connexion à 6 chiffres pour accéder à votre compte VServicesRDC.';
  const subject = isReset ? 'VServicesRDC — Code de réinitialisation' : 'VServicesRDC — Votre code de connexion';
  const text = `${title}\n\n${intro}\n\nCode : ${code}\n\nCe code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`;
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f7f6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="background:${BRAND};padding:24px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;letter-spacing:0.5px;">VSERVICESRDC</h1>
          <p style="margin:6px 0 0;color:#d1fae5;font-size:13px;">La marketplace des services en RDC</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 12px;font-size:18px;color:#111827;">${title}</h2>
          <p style="margin:0 0 24px;font-size:14px;color:#4b5563;line-height:1.6;">${intro}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="background:#ecfdf5;border:1px dashed ${BRAND};border-radius:10px;padding:20px 0;">
            <span style="font-family:'Courier New',monospace;font-size:38px;font-weight:bold;letter-spacing:12px;color:${BRAND};">${code}</span>
          </td></tr></table>
          <p style="margin:20px 0 0;font-size:13px;color:#6b7280;">Ce code expire dans <strong>10 minutes</strong>. Il ne sera jamais demandé par téléphone.</p>
        </td></tr>
        <tr><td style="padding:16px 32px 28px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Votre mot de passe reste inchangé.</p>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
  return { subject, text, html };
}

export async function sendOtpEmail(to: string, code: string, purpose: 'login' | 'reset'): Promise<void> {
  const tx = getTransporter();
  if (!tx) throw new Error('SMTP non configuré (SMTP_USER / SMTP_PASS manquants)');
  const { subject, text, html } = buildEmail(code, purpose);
  const { user } = getSmtpConfig();
  await tx.sendMail({
    from: `"VServicesRDC" <${user}>`,
    to,
    subject,
    text,
    html,
    headers: { 'X-Priority': '1', 'X-Mail-Class': 'Transactional' },
  });
}

export { maskEmail };
