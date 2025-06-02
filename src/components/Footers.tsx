import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';

const Footer = () => {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <footer className="py-8 bg-slate-900 border-t border-slate-700/50">
      <PrivacyPolicyModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">س</span>
            </div>
            <span className="text-slate-400">{t('footer.copyright')}</span>
          </div>
          <div className="flex items-center space-x-6">
            <button
              className="text-slate-400 hover:text-white transition-colors"
              onClick={() => setModalOpen(true)}
            >
              {t('footer.privacy')}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
