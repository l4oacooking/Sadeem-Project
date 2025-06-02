import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sadeem.salla@gmail.com',
    pass: 'fduc utra kgnx svhm'
  }
});

app.post('/api/request-demo', async (req, res) => {
  const { emailOrPhone, storeName, isSalla } = req.body;

  const mailOptions = {
    from: 'sadeem.salla@gmail.com',
    to: 'yam.asd@outlook.com',
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
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});