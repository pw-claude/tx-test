// api/smtp.js
// Sends an email via Campaign Monitor Classic SMTP using Nodemailer.
// CM SMTP details:
//   Host: smtp.transactional.createsend.com
//   Port: 587, STARTTLS
//   Auth: username = SMTP Token, password = SMTP Token (same value for both)
//
// Called by the frontend as: POST /api/smtp
// Body: { smtpToken, from, to, cc, bcc, replyTo, subject, html, text }

import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { smtpToken, from, to, cc, bcc, replyTo, subject, html, text } = req.body || {};

  if (!smtpToken) return res.status(400).json({ error: 'smtpToken is required' });
  if (!from)      return res.status(400).json({ error: 'from is required' });
  if (!to)        return res.status(400).json({ error: 'to is required (array or string)' });
  if (!subject)   return res.status(400).json({ error: 'subject is required' });
  if (!html && !text) return res.status(400).json({ error: 'html or text body is required' });

  // CM SMTP: use the SMTP Token as BOTH username and password
  const transporter = nodemailer.createTransport({
    host: 'smtp.transactional.createsend.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: smtpToken,
      pass: smtpToken,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  const normalise = v => Array.isArray(v) ? v.join(', ') : v;

  const mailOptions = { from, to: normalise(to), subject };
  if (cc)      mailOptions.cc      = normalise(cc);
  if (bcc)     mailOptions.bcc     = normalise(bcc);
  if (replyTo) mailOptions.replyTo = replyTo;
  if (html)    mailOptions.html    = html;
  if (text)    mailOptions.text    = text;

  try {
    const info = await transporter.sendMail(mailOptions);
    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      accepted:  info.accepted,
      rejected:  info.rejected,
      response:  info.response,
    });
  } catch (err) {
    return res.status(502).json({
      error:        'SMTP send failed',
      detail:       err.message,
      code:         err.code || null,
      responseCode: err.responseCode || null,
    });
  }
}
