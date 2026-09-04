import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { FaqEntry } from "@/types/presale";
import { FAQ_ITEMS } from "@/data/presaleMocks";

interface FaqItemProps {
  item: FaqEntry;
  isOpen: boolean;
  onToggle: () => void;
}

function FaqItem({ item, isOpen, onToggle }: FaqItemProps) {
  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span className={`font-title text-sm font-bold transition-colors ${isOpen ? "gradient-text" : "text-white/80 group-hover:text-white"}`}>
          {item.q}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-white/30 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 font-body text-sm leading-relaxed text-white/50 font-medium">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <section className="border-b border-white/10 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6 }}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/25 font-bold">
          Dudas
        </span>
        <h2 className="mt-3 font-title text-2xl sm:text-3xl font-black text-white mb-6">
          Preguntas <span className="gradient-text">frecuentes</span>
        </h2>
        <div>
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem
              key={item.q}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}