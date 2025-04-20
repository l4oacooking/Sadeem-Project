// /routes/sallaInstall.js
import express from 'express';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const router = express.Router();

const supabase = createClient(
  'https://rrmrownqurlhnngqeoqm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJybXJvd25xdXJsaG5uZ3Flb3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NDkxMDUsImV4cCI6MjA1OTEyNTEwNX0.sMBDivG_y_EHyChuAEIMz1mz20GPXGHKL2anEMli00E'
);

const sendWelcomeEmail = async (toEmail, storeName, storeId, password) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'sadeem.salla@gmail.com',
      pass: 'fduc utra kgnx svhm'
    }
  });

  const mailOptions = {
    from: 'Sadeem Platform <sadeem.salla@gmail.com>',
    to: toEmail,
    subject: '🎉 مرحبًا بك في منصة سديم',
    html: `
      <h2>أهلًا بك ${storeName} 👋</h2>
      <p>تم تثبيت تطبيق <strong>سديم</strong> بنجاح على متجرك.</p>
      <p>سديم هي منصة تقوم بتوصيل المنتجات الرقمية لعملائك بشكل تلقائي دون أي تدخل منك.</p>

      <h3>بيانات تسجيل الدخول:</h3>
        <ul>
        <li><strong>معرّف المتجر (Store ID):</strong> ${storeId}</li>
        <li><strong>كلمة المرور:</strong> <span dir="ltr">${password}</span></li>
        </ul>


      <p>لتسجيل الدخول إلى لوحة التحكم، يُرجى زيارة:</p>
      <p><a href="soon">soon</a></p>

      <h3>📚 للتعرّف على منصة سديم</h3>
      <p>يمكنك زيارة قاعدة المعرفة داخل الموقع لمعرفة المزيد حول كيفية استخدام المنصة.</p>

      <h3>📞 الدعم الفني</h3>
      <p>لأي استفسار أو مساعدة، لا تتردد في التواصل معنا:</p>
      <ul>
        <li>📧 الإيميل: <a href="mailto:sadeem.salla@gmail.com">sadeem.salla@gmail.com</a></li>
        <li>📱 واتساب: <a href="https://wa.me/966550379037">+966550379037</a></li>
      </ul>

      <hr />
      <p>لا تشارك هذه البيانات مع أي طرف ثالث حفاظًا على أمان متجرك.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

router.all('/webhook', async (req, res) => {
  console.log('--- Incoming Webhook ---');
  const event = req.body.event;
  const merchantId = String(req.body.merchant);
  const data = req.body.data;

  if (event === 'app.store.authorize') {
    const access_token = data.access_token;
    const refresh_token = data.refresh_token;

    try {
      await supabase.from('stores').upsert({
        id: merchantId,
        access_token,
        refresh_token
      });

      const infoRes = await axios.get('https://api.salla.dev/admin/v2/store/info', {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      const info = infoRes.data.data;

      await supabase.from('stores').update({
        name: info.name || null,
        email: info.email || null,
        domain: info.domain || null,
        avatar: info.avatar || null,
        socials: info.social || {}
      }).eq('id', merchantId);

      const generatedPassword = Math.random().toString(36).slice(-8);

        await supabase.from('admins').insert({
        email: info.email,
        password: generatedPassword,
        store_id: merchantId,
        role: 'owner'
        });

    await sendWelcomeEmail(info.email, info.name, merchantId, generatedPassword);

      res.status(200).send('Store saved and email sent');
    } catch (err) {
      console.error('Install error:', err.message);
      res.status(500).send('Install failed');
    }
  } else if (event === 'app.uninstalled') {
    try {
      // Get product IDs first
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('store_id', merchantId);

      if (productsError) throw productsError;

      const productIds = products.map(p => p.id);

      if (productIds.length > 0) {
        const { error: accountsError } = await supabase
          .from('accounts')
          .delete()
          .in('product_id', productIds);
        if (accountsError) throw accountsError;
      }

      await supabase.from('products').delete().eq('store_id', merchantId);
      await supabase.from('users').delete().eq('store_id', merchantId);
      await supabase.from('admins').delete().eq('store_id', merchantId);
      await supabase.from('stores').delete().eq('id', merchantId);

      console.log(`✅ Store ${merchantId} deleted successfully`);
      res.status(200).send('Store cleanup completed');
    } catch (err) {
      console.error('Uninstall cleanup failed:', err.message);
      res.status(500).send('Cleanup failed');
    }
  } else {
    console.log(`Other event: ${event}`);
    res.status(200).send('Received');
  }
});

export default router;
