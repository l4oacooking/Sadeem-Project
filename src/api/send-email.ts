// src/api/send-email.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'sadeem.salla@gmail.com',
        pass: 'fduc utra kgnx svhm'
      }
    });

    await transporter.sendMail({
      from: '"Sadeem Bot" <sadeem.salla@gmail.com>',
      to,
      subject,
      text,
    });

    return res.status(200).json({ message: 'Email sent' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ message: 'Failed to send email' });
  }
}
