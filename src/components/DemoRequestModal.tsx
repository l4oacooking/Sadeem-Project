import React, { useState } from 'react';

interface DemoRequestModalProps {
  open: boolean;
  onClose: () => void;
}

const DemoRequestModal: React.FC<DemoRequestModalProps> = ({ open, onClose }) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [isSalla, setIsSalla] = useState(true);
  const [submitted, setSubmitted] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await fetch('http://localhost:5001/api/request-demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrPhone,
        storeName,
        isSalla,
      }),
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  } catch {
    alert('Failed to send request.');
  }
};

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-md w-full relative border border-blue-800">
        <button className="absolute top-3 right-4 text-slate-400 hover:text-white text-xl" onClick={onClose}>
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-white text-center">Request a Demo</h2>
        {submitted ? (
          <div className="text-center text-green-400 py-6 text-lg font-semibold">
            Thank you!<br />We'll contact you soon.
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Email or Phone <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={emailOrPhone}
                onChange={e => setEmailOrPhone(e.target.value)}
                required
                className="w-full p-3 rounded-lg bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com or +966..."
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Store Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                required
                className="w-full p-3 rounded-lg bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your Store Name"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-2 font-medium">Are you a Salla store?</label>
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    isSalla ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                  onClick={() => setIsSalla(true)}
                >Yes</button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    !isSalla ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                  onClick={() => setIsSalla(false)}
                >No</button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:scale-[1.02] transition"
            >
              Send Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default DemoRequestModal;
