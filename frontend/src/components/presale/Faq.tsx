import { useState } from "react";
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
    <div className="border-b border-zinc-800 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium text-zinc-100">{item.q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && <p className="pb-4 text-sm leading-relaxed text-zinc-400">{item.a}</p>}
    </div>
  );
}

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <section className="border-b border-zinc-800 py-10">
      <p className="font-mono text-xs uppercase tracking-wide text-zinc-500">Dudas</p>
      <h2 className="mt-2 text-xl font-semibold text-zinc-50">Preguntas frecuentes</h2>
      <div className="mt-5">
        {FAQ_ITEMS.map((item, i) => (
          <FaqItem
            key={item.q}
            item={item}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
          />
        ))}
      </div>
    </section>
  );
}
