
import React from 'react';
import { Mail, Phone, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const ContactSection = () => {
  const { t } = useLanguage();

  const contactInfo = [
    {
      icon: Mail,
      value: t('contact.email'),
      href: `mailto:${t('contact.email')}`
    },
    {
      icon: Phone,
      value: t('contact.phone'),
      href: `tel:${t('contact.phone')}`
    },
    {
      icon: Globe,
      value: t('contact.instagram'),
      href: `https://instagram.com/${t('contact.instagram')}`
    }
  ];

  return (
    <section className="py-20 bg-slate-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {contactInfo.map((contact, index) => (
            <a
              key={index}
              href={contact.href}
              className="flex items-center justify-center space-x-3 p-6 bg-slate-800/50 rounded-2xl hover:bg-slate-700/50 transition-colors group"
            >
              <contact.icon className="w-6 h-6 text-blue-400 group-hover:text-blue-300" />
              <span className="text-white font-medium">{contact.value}</span>
            </a>
          ))}
        </div>
        
        {/* Powered by Salla Badge */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-full">
            <span className="text-emerald-400 font-medium">{t('footer.powered')}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
