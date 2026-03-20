import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ = () => {
  const { t } = useTranslation();
  const items = t('faq.items', { returnObjects: true }) as FaqItem[];

  return (
    <section id="faq" className="py-24 px-4">
      <div className="max-w-3xl mx-auto">

        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-exo font-bold text-white mb-4">
            {t('faq.title')}{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {t('faq.titleHighlight')}
            </span>
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {items.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="glass border border-white/10 rounded-xl px-6 hover:border-blue-500/30 transition-colors duration-300"
            >
              <AccordionTrigger className="font-exo text-left text-white hover:text-blue-400 hover:no-underline py-5 text-base md:text-lg transition-colors duration-200">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="font-lato text-gray-300 text-sm md:text-base pb-5 leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
