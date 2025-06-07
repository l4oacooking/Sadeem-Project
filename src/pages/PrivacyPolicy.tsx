import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Effective Date: June 7, 2025
      </p>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">1. Information We Collect</h2>
        <p>
          We collect personal information such as phone numbers, email
          addresses, order details, and product interaction logs to ensure
          accurate and secure digital product delivery.
        </p>

        <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
        <p>
          We use your data to deliver digital products, verify orders, prevent
          misuse, notify users of issues, and provide store owners with
          analytics.
        </p>

        <h2 className="text-xl font-semibold">3. Data Security</h2>
        <p>
          Sensitive fields like passwords and codes are encrypted using AES. Only
          authorized users can access this data.
        </p>

        <h2 className="text-xl font-semibold">4. Data Sharing</h2>
        <p>
          We do not sell or rent your data. Your data is only shared with store
          owners, WhatsApp APIs, and our secure hosting provider Supabase.
        </p>

        <h2 className="text-xl font-semibold">5. Your Rights</h2>
        <p>
          You may request access, correction, or deletion of your data by
          contacting us at <a className="text-blue-600 underline" href="mailto:sadeem.salla@gmail.com">sadeem.salla@gmail.com</a>.
        </p>

        <h2 className="text-xl font-semibold">6. WhatsApp Bot</h2>
        <p>
          Our bot is limited to product delivery only. It does not handle general
          questions. All delivery interactions are logged for analytics and
          support.
        </p>

        <h2 className="text-xl font-semibold">7. International Users</h2>
        <p>
          Your data may be stored or processed in secure international data
          centers operated by trusted partners like Supabase.
        </p>

        <h2 className="text-xl font-semibold">8. Policy Changes</h2>
        <p>
          We may revise this policy. Changes will be posted here with the updated
          date.
        </p>

        <h2 className="text-xl font-semibold">Contact</h2>
        <p>
          For questions or concerns:  
          <br />
          📧 <a className="text-blue-600 underline" href="mailto:sadeem.salla@gmail.com">sadeem.salla@gmail.com</a>  
          <br />
          📱 +966 550 379 037  
          <br />
          🌐 <a className="text-blue-600 underline" href="https://sadeem.site" target="_blank" rel="noopener noreferrer">https://sadeem.site</a>
        </p>
      </section>
    </div>
  );
}
