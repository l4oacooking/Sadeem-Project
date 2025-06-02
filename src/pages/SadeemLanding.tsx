import React from 'react';
import { LanguageProvider } from '../contexts/LanguageContext';
import SadeemNavigation from '../components/Navigations';
import HeroSection from '../components/HeroSections';
import FeaturesSection from '../components/FeaturesSections';
import ContactSection from '../components/ContactSections';
import Footer from '../components/Footers';

const SadeemLanding = () => (
  <LanguageProvider>
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      <SadeemNavigation />
      <HeroSection />
      <FeaturesSection />
      <ContactSection />
      <Footer />
    </div>
  </LanguageProvider>
);

export default SadeemLanding;
