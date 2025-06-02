
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import sadeemLogo from '@/assets/logo.png';
import DemoRequestModal from '../components/DemoRequestModal';
import { useState } from 'react';

const HeroSection = () => {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16">
            <DemoRequestModal open={modalOpen} onClose={() => setModalOpen(false)} />
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              {t('hero.headline')}
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
              {t('hero.subheadline')}
            </p>
            
      <button
        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-full text-lg hover:scale-105 transform transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
        onClick={() => setModalOpen(true)}
      >
        {t('hero.cta')}
      </button>

          </div>

          {/* iPhone Mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* iPhone Frame */}
              <div className="w-80 h-[600px] bg-black rounded-[3rem] p-3 shadow-2xl">
                <div className="w-full h-full bg-slate-900 rounded-[2.5rem] overflow-hidden relative">
                  {/* Status Bar */}
                  <div className="flex justify-between items-center px-6 py-3 text-white text-sm">
                    <span>9:41</span>
                    <div className="flex space-x-1">
                      <div className="w-4 h-2 bg-white rounded-sm"></div>
                      <div className="w-1 h-2 bg-white rounded-sm"></div>
                      <div className="w-6 h-2 bg-white rounded-sm"></div>
                    </div>
                  </div>
{/* WhatsApp Header */}
<div className="flex items-center px-4 py-3 bg-teal-600 text-white">
<div className="w-8 h-8 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 rounded-full flex items-center justify-center mr-3 overflow-hidden">
  <img
    src={sadeemLogo}
    alt="Sadeem Logo"
    className="w-7 h-7 object-contain"
    draggable={false}
  />
</div>
  <span className="font-semibold">Sadeem</span>
  <div className="ml-auto">...</div>
</div>

<div className="p-4 space-y-3">
  {/* Bot: Ask for order ID */}
  <div className="flex">
    <div className="bg-slate-700 text-white p-3 rounded-2xl rounded-tl-md max-w-xs">
      <p className="text-sm">{t('whatsapp.bot.message')}</p>
      <span className="text-xs text-slate-400 mt-1 block">10:30</span>
    </div>
  </div>

  {/* User: Sends order ID */}
  <div className="flex justify-end">
    <div className="bg-teal-600 text-white p-3 rounded-2xl rounded-tr-md max-w-xs">
      <p className="text-sm">{t('whatsapp.user.orderid')}</p>
      <span className="text-xs text-teal-200 mt-1 block">10:31</span>
    </div>
  </div>

  {/* Bot: Sends account details */}
  <div className="flex">
    <div className="bg-slate-700 text-white p-3 rounded-2xl rounded-tl-md max-w-xs">
      <p className="text-sm">
        {t('whatsapp.bot.accountdetails')}
      </p>
      <div className="mt-2">
        <div className="bg-slate-800 rounded-lg p-2 text-xs">
          <div>
            <span className="font-semibold">{t('whatsapp.bot.email')}:</span> example@email.com
          </div>
          <div>
            <span className="font-semibold">{t('whatsapp.bot.password')}:</span> 123456abc
          </div>
        </div>
      </div>
      <span className="text-xs text-slate-400 mt-1 block">10:32</span>
    </div>
  </div>
</div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
