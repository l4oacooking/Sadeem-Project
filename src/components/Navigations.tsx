import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom'; // ✅ Don't forget this
import sadeemLogo from '@/assets/logo.png';

const Navigation = () => {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate(); // ✅ Needed for navigation

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img
              src={sadeemLogo}
              alt="Sadeem Logo"
              className="w-20 h-20 object-contain"
              style={{ borderRadius: '0.5rem' }}
            />
            <span className="text-white font-bold text-xl">
              {language === 'ar' ? 'سديم' : 'Sadeem'}
            </span>
          </div>

          {/* Right section: Language + Login */}
          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <div className="flex items-center space-x-2 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setLanguage('ar')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  language === 'ar'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {t('nav.ar')}
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {t('nav.en')}
              </button>
            </div>

            {/* Login Button */}
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition"
            >
              {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
