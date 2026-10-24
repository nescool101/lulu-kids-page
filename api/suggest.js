import nodemailer from 'nodemailer';

// POST {msg, from?, website?} -> mails a suggestion. `website` is a honeypot for bots.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { msg = '', from = '', website = '' } = req.body ?? {};
  if (website) return res.status(204).end();
  const m = String(msg).trim(), f = String(from).trim();
  if (m.length < 5 || m.length > 2000 || f.length > 200) return res.status(400).end();
  const { SMTP_USER, SMTP_PASS, SMTP_HOST = 'smtp.gmail.com', SUGGEST_TO = SMTP_USER } = process.env;
  const replyTo = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(f) ? f : undefined;
  try {
    await nodemailer
      .createTransport({ host: SMTP_HOST, port: 465, secure: true, auth: { user: SMTP_USER, pass: SMTP_PASS } })
      .sendMail({ from: SMTP_USER, to: SUGGEST_TO, replyTo, subject: 'Lulu Kids suggestion', text: `${m}\n\n— ${f || 'anonymous'}` });
    res.status(204).end();
  } catch {
    res.status(500).end();
  }
}
