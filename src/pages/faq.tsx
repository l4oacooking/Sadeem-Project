import React from "react";

export default function faq() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Frequently Asked Questions (FAQ)</h1>

      <div className="space-y-6">

        <div>
          <h2 className="text-lg font-semibold">Q: Can I deliver products manually?</h2>
          <p>A: Yes, you can manually deliver products through WhatsApp if needed.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Q: Does Sadeem work with all eCommerce platforms?</h2>
          <p>A: Currently, Sadeem is primarily integrated with the Salla platform.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Q: Is there any complex setup required?</h2>
          <p>A: Not at all. Sadeem is easy to set up and activates immediately upon app installation.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Q: Does Sadeem support WhatsApp message templates?</h2>
          <p>A: Currently, Sadeem uses flexible custom message formats. Template support is planned for the future.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Q: Can the WhatsApp bot respond to customer questions?</h2>
          <p>A: No. The bot is strictly designed for product delivery only. General inquiries must be handled manually.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Q: What kind of analytics are provided?</h2>
          <p>
            A: You can track order count, product deliveries, and top-selling products directly from your Sadeem dashboard.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Q: Which product types does Sadeem support?</h2>
          <p>
            A: Sadeem supports accounts (Steam, GPT, PlayStation), activation codes, gift cards, and digital files like PDFs.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Q: Does Sadeem support 2FA verification?</h2>
          <p>
            A: Yes, Sadeem supports both TOTP-based and Gmail-based 2FA verification (for Steam, Xbox, Epic Games, etc).
          </p>
        </div>

      </div>
    </div>
  );
}
