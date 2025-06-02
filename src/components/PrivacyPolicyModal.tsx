import React from "react";

const policyText = `
Sadeem Privacy Policy

1. Information Collection:
We collect only the necessary data (such as email, phone number, and store information) required to deliver our service and support.

2. Use of Information:
Your information is used solely for providing our digital product delivery services via WhatsApp and Salla integration. We do not sell or share your data with third parties.

3. Data Security:
All sensitive data is encrypted and stored securely. Only authorized staff can access your information.

4. Communication:
We may contact you for demo requests, service updates, or support. You can opt-out at any time.

5. Contact:
For privacy inquiries, please contact sadeem.salla@gmail.com.

6. Updates:
This policy may be updated from time to time. Please review periodically.

By using Sadeem, you agree to this privacy policy.
`;

const PrivacyPolicyModal = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-slate-900 max-w-lg w-full p-8 rounded-2xl shadow-2xl border border-blue-800 relative">
        <button onClick={onClose} className="absolute top-4 right-6 text-white text-2xl font-bold">&times;</button>
        <h2 className="text-2xl font-bold mb-4 text-white">Privacy Policy</h2>
        <div className="text-slate-200 text-sm whitespace-pre-line max-h-96 overflow-y-auto">
          {policyText}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
