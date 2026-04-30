import Layout from '@/components/Layout';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import FeatureBlocks from '@/components/FeatureBlocks';
import ValueProposition from '@/components/ValueProposition';
import CallToAction from '@/components/CallToAction';
import { useTranslation } from 'react-i18next';

const Index = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      {/* Navigation */}
      <Navbar />
      {/* Main Content */}
      <main>
        <HeroSection />
        <FeatureBlocks />
        <ValueProposition />
        <CallToAction />
        
        {/* Partner Section */}
        <section className="pb-20 relative text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            <p className="text-gray-400 font-body text-base sm:text-lg mb-6 max-w-2xl select-none">
              {t('partner.text')}
            </p>
            <a 
              href="https://tokenconsulting.group/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-block transition-transform hover:scale-105"
            >
              <img 
                src="/images/TGC.webp" 
                alt="Token Consulting Group" 
                loading="lazy"
                width={400}
                height={150}
                className="h-20 sm:h-24 object-contain drop-shadow-lg opacity-80 hover:opacity-100 transition-opacity" 
              />
            </a>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default Index;
