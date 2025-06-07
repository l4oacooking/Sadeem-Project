import React from "react";
import sadeemLogo from "../assets/logo.png"; // عدل المسار إذا تغير
import { FaRegStar, FaEnvelope, FaWhatsapp, FaPhone } from "react-icons/fa";

const SUPPORT_WHATSAPP = "966550379037"; // رقم الواتساب بدون "+"
const SUPPORT_EMAIL = "sadeem.salla@gmail.com";
const SUPPORT_PHONE = "0550379037"; // رقم الهاتف بدون "+" أو أي رموز أخرى

const Support: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#102046] via-[#1d294e] to-[#0a101d]">
    <div className="w-full max-w-4xl bg-[#141622] rounded-3xl shadow-2xl flex overflow-hidden">
      <div className="w-1/2 p-10 flex flex-col items-center justify-center bg-gradient-to-br from-[#0b2845] to-[#07142b]">
        <img src={sadeemLogo} alt="Sadeem Logo" className="w-24 mb-8 drop-shadow-xl" />
        <h2 className="text-white text-3xl font-bold flex items-center gap-2 mb-4">
          سديم خيار التاجر الأول <FaRegStar className="text-yellow-400" />
        </h2>
        <p className="text-white/80 text-lg text-center">
          منصة سديم - بوت واتساب لإدارة وتسليم المنتجات الرقمية بسهولة وأمان.
        </p>
      </div>
      <div className="w-1/2 p-12 flex flex-col justify-center items-center bg-[#1a1d29]">
        <h2 className="text-2xl font-bold text-[#96a8f8] mb-2">الدعم الفني</h2>
        <p className="text-white/70 mb-6">فريقنا جاهز لمساعدتك في أي وقت عبر وسائل التواصل التالية:</p>
        <div className="space-y-4 w-full">
          <a
            href={`https://wa.me/${SUPPORT_WHATSAPP}`}
            className="flex items-center gap-3 py-3 px-5 rounded-xl bg-[#25d366]/20 hover:bg-[#25d366]/40 text-[#25d366] font-bold text-lg transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaWhatsapp /> تواصل عبر واتساب
          </a>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-3 py-3 px-5 rounded-xl bg-[#2b83fa]/20 hover:bg-[#2b83fa]/40 text-[#2b83fa] font-bold text-lg transition"
          >
            <FaEnvelope /> راسلنا على الإيميل
          </a>
          <a
            href={`tel:${SUPPORT_PHONE}`}
            className="flex items-center gap-3 py-3 px-5 rounded-xl bg-[#3c4250]/20 hover:bg-[#3c4250]/40 text-[#fff] font-bold text-lg transition"
          >
            <FaPhone /> اتصال مباشر: {SUPPORT_PHONE}
          </a>
        </div>
        <a href="/login" className="text-[#3094fa] hover:underline mt-8 block text-center">
          الرجوع لتسجيل الدخول
        </a>
      </div>
    </div>
  </div>
);

export default Support;
