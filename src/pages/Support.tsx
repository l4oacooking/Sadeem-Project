import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip } from 'lucide-react';

const SUPPORT_TYPES = [
  'اقتراح',
  'شكوى',
  'خطأ',
  'طلب دعم فني'
];

export default function Support() {
  const [type, setType] = useState('');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
const [contactNumber, setContactNumber] = useState('');
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setImages(Array.from(e.target.files));
  };

  // Helper to convert files to base64
  const filesToBase64 = (files: File[]) => {
    return Promise.all(files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, data: reader.result });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const storeId = localStorage.getItem('store_id') || '';
    const session = JSON.parse(localStorage.getItem('session') || '{}');
    const storeName = session?.store_name || '---';
    const admin = session?.email || '---';
    const socials = localStorage.getItem('store_socials') || '';

    let imagesBase64: any[] = [];
    if (images.length > 0) {
      imagesBase64 = await filesToBase64(images);
    }

    try {
      const res = await fetch('http://localhost:5500/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message,
          storeId,
          storeName,
          admin,
          socials,
          images: imagesBase64,
        }),
      });
      if (res.ok) {
        alert('تم إرسال الطلب بنجاح ✨');
        setType('');
        setMessage('');
        setImages([]);
      } else {
        alert('حصل خطأ أثناء الإرسال!');
      }
    } catch {
      alert('فشل الاتصال بالسيرفر!');
    }
    setLoading(false);
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-10">
        <div className="bg-[#181f2c] rounded-2xl shadow-xl border border-[#25304a] p-8">
          <h1 className="text-2xl font-bold text-white mb-6">الدعم الفني</h1>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">نوع الطلب:</label>
              <div className="flex gap-2 flex-wrap">
                {SUPPORT_TYPES.map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={type === t ? 'default' : 'outline'}
                    onClick={() => setType(t)}
                    className={`rounded-xl px-6 py-2 font-bold transition ${type === t ? "bg-blue-700 text-white" : "bg-[#23293d] text-gray-200 hover:bg-[#202538]"}`}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">وصف المشكلة:</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full border-0 rounded-xl p-4 bg-[#23293d] text-gray-100 focus:ring-2 focus:ring-blue-600 focus:outline-none shadow-md"
                placeholder="صف المشكلة بالتفصيل"
                style={{ resize: 'vertical', minHeight: 100 }}
              />
            </div>
<div>
  <label className="block text-sm font-medium text-gray-200 mb-2">رقم التواصل (جوال):</label>
  <input
    type="tel"
    value={contactNumber}
    onChange={e => setContactNumber(e.target.value)}
    required
    pattern="^[0-9+\s()-]{8,}$"
    className="w-full border-0 rounded-xl p-4 bg-[#23293d] text-gray-100 focus:ring-2 focus:ring-blue-600 focus:outline-none shadow-md"
    placeholder="مثال: 05xxxxxxxx أو 9665xxxxxxx"
  />
</div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2 flex items-center gap-2">
                <Paperclip size={18} /> رفع صور (اختياري):
              </label>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="border-0 bg-[#23293d] text-gray-100 rounded-xl"
              />
              {images.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {images.map((img, idx) => (
                    <span key={idx} className="text-xs bg-blue-800/40 px-2 py-1 rounded text-blue-200">{img.name}</span>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl py-3 font-bold text-lg bg-blue-600 hover:bg-blue-700 transition"
              disabled={loading || !type || !message}
            >
              {loading ? 'جاري الإرسال...' : 'إرسال إلى الدعم'}
            </Button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
