import Layout from '@/components/Layout';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import PhoneOrbit from '@/components/PhoneOrbit';
import ScreenMarquee from '@/components/ScreenMarquee';
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
        <PhoneOrbit />
        <FeatureBlocks />
        <ValueProposition />
        <CallToAction />

        {/* Partner Section */}
        <section className="pb-32 md:pb-48 relative text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            <p className="font-body text-sm md:text-base text-white/40 mb-10 max-w-xl select-none uppercase tracking-[0.2em] font-semibold">
              {t('partner.text')}
            </p>
            <a
              href="https://tokenconsulting.group/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-opacity duration-500 opacity-50 hover:opacity-90"
            >
              <img
                src="/images/TGC.webp"
                alt="Token Consulting Group"
                loading="lazy"
                width={400}
                height={150}
                className="h-20 sm:h-24 object-contain"
              />
            </a>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default Index;
