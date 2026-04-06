import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import Navbar from '@/components/Navbar';

interface LegalLayoutProps {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

const LegalLayout: React.FC<LegalLayoutProps> = ({ title, lastUpdated, children }) => {
  return (
    <Layout>
      <Navbar />
      <main className="pt-32 pb-24 min-h-screen relative overflow-hidden bg-[#0B0B0F]">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-purple-900/10 blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 glass rounded-3xl p-8 sm:p-12 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 border-b border-white/10 pb-8"
          >
            <h1 className="text-3xl md:text-5xl font-title font-bold text-white mb-4 tracking-tighter drop-shadow-md">
              {title}
            </h1>
            {lastUpdated && (
              <p className="text-gray-400 font-body text-sm bg-black/40 inline-flex px-3 py-1 rounded-full border border-white/5">
                Última actualización: {lastUpdated}
              </p>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="prose prose-invert prose-purple max-w-none font-body text-gray-300
              prose-headings:font-title prose-headings:text-white prose-headings:tracking-tight
              prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-purple-300
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
              prose-p:leading-relaxed prose-p:mb-6
              prose-ul:my-6 prose-li:my-2 prose-ul:list-disc prose-ul:pl-6
              prose-a:text-purple-400 hover:prose-a:text-purple-300 prose-a:transition-colors"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </Layout>
  );
};

export default LegalLayout;
