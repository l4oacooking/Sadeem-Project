import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// إعداد SMTP مع جيميل
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sadeem.salla@gmail.com',
    pass: 'fduc utra kgnx svhm',
  },
});

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

  // تجهيز المرفقات (صور base64)
  let attachments = [];
  if (images && images.length > 0) {
    attachments = images.map(file => ({
      filename: file.name,
      content: file.data.split(',')[1], // base64 فقط بدون prefix
      encoding: 'base64',
    }));
  }

  // بناء الرسالة النصية
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
    from: '"Sadeem Support" <sadeem.salla@gmail.com>',
    to: 'yam.asd@outlook.com',
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

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => console.log(`Support API running on port ${PORT}`));
