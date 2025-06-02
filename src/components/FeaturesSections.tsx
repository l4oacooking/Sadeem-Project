
import React from 'react';
import { Zap, Shield, Activity, Store } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const FeaturesSection = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Activity,
      title: t('features.automation'),
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Shield,
      title: t('features.security'),
      gradient: 'from-purple-500 to-blue-500'
    },
    {
      icon: Zap,
      title: t('features.speed'),
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Store,
      title: t('features.multistore'),
      gradient: 'from-green-500 to-teal-500'
    }
  ];

  return (
    <section className="py-20 bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
