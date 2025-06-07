import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.email,
    pass: process.env.pass,
  },
});

// === /api/request-demo ===
app.post('/api/request-demo', async (req, res) => {
  const { emailOrPhone, storeName, isSalla } = req.body;

  const mailOptions = {
    from: `"Sadeem Platform" <${process.env.email}>`,
    to: process.env.myemail,
    subject: 'New Demo Request - Sadeem',
    text: `
A new demo request was submitted:

Email/Phone: ${emailOrPhone}
Store Name: ${storeName}
Is Salla Store?: ${isSalla ? 'Yes' : 'No'}
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send demo email.' });
  }
});

// === /api/support ===
app.post('/api/support', async (req, res) => {
  const {
    type,
    message,
    contactNumber,
    storeId,
    storeName,
    admin,
    socials,
    images
  } = req.body;

  let attachments = [];
  if (images && images.length > 0) {
    attachments = images.map(file => ({
      filename: file.name,
      content: file.data.split(',')[1],
      encoding: 'base64',
    }));
  }

  const mailText = `
نوع الطلب: ${type}
الموضوع: ${message}

رقم التواصل مع العميل: ${contactNumber}

اسم المتجر: ${storeName}
Store ID: ${storeId}
مسؤول المتجر: ${admin}
روابط السوشيال: ${socials}
  `;

  const mailOptions = {
    from: `"Sadeem Support" <${process.env.email}>`,
    to: process.env.myemail,
    subject: `[Sadeem Support] - ${type}`,
    text: mailText,
    attachments,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'تم الإرسال بنجاح' });
  } catch (err) {
    res.status(500).json({ error: 'فشل الإرسال', detail: err.message });
  }
});

// === Start server ===
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
  console.log(`✅ Sadeem API running on port ${PORT}`);
});
