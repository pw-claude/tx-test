// api/smtp.js
// Sends email via Campaign Monitor Classic SMTP using Nodemailer.
// CM SMTP: smtp.transactional.createsend.com
// Auth:    SMTP Token used as BOTH username and password
//
// Vercel (and many cloud hosts) block port 587. We try port 2525 first
// (non-standard, widely unblocked), then fall back to 465 (SSL), then 587.

import nodemailer from 'nodemailer';

const CM_HOST = 'smtp.transactional.createsend.com';

// Ports to try in order. 2525 is most likely to work on Vercel/cloud hosts.
const PORTS = [
  { port: 2525, secure: false, requireTLS: true  },
  { port: 465,  secure: true,  requireTLS: false },
  { port: 587,  secure: false, requireTLS: true  },
];

async function trySend(smtpToken, mailOptions, portConfig) {
  const transporter = nodemailer.createTransport({
    host: CM_HOST,
    port: portConfig.port,
    secure: portConfig.secure,
    requireTLS: portConfig.requireTLS,
    auth: { user: smtpToken, pass: smtpToken },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
  return transporter.sendMail(mailOptions);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { smtpToken, from, to, cc, bcc, replyTo, subject, html, text } = req.body || {};

  if (!smtpToken) return res.status(400).json({ error: 'smtpToken is required' });
  if (!from)      return res.status(400).json({ error: 'from is required' });
  if (!to)        return res.status(400).json({ error: 'to is required' });
  if (!subject)   return res.status(400).json({ error: 'subject is required' });
  if (!html && !text) return res.status(400).json({ error: 'html or text body is required' });

  const normalise = v => Array.isArray(v) ? v.join(', ') : v;
  const mailOptions = { from, to: normalise(to), subject };
  if (cc)      mailOptions.cc      = normalise(cc);
  if (bcc)     mailOptions.bcc     = normalise(bcc);
  if (replyTo) mailOptions.replyTo = replyTo;
  if (html)    mailOptions.html    = html;
  if (text)    mailOptions.text    = text;

  const attempts = [];

  for (const portConfig of PORTS) {
    try {
      const info = await trySend(smtpToken, mailOptions, portConfig);
      return res.status(200).json({
        success:   true,
        port_used: portConfig.port,
        messageId: info.messageId,
        accepted:  info.accepted,
        rejected:  info.rejected,
        response:  info.response,
      });
    } catch (err) {
      attempts.push({
        port:   portConfig.port,
        error:  err.message,
        code:   err.code || null,
      });
      // If it's an auth failure (not a connection issue), no point retrying other ports
      if (err.responseCode === 535 || err.code === 'EAUTH') {
        return res.status(401).json({
          error:    'SMTP authentication failed — check your SMTP Token',
          attempts,
        });
      }
    }
  }

  // All ports failed
  return res.status(502).json({
    error:    'SMTP send failed on all ports (2525, 465, 587)',
    detail:   'Vercel may be blocking outbound SMTP. Consider using the Classic API tab instead.',
    attempts,
  });
}
