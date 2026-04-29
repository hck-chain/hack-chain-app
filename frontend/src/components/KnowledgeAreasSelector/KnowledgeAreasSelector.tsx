import { useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { KNOWLEDGE_AREAS, MAX_KNOWLEDGE_AREAS } from '@/lib/constants/knowledgeAreas';

interface KnowledgeAreasSelectorProps {
  selected: string[];
  onChange: (areas: string[]) => void;
  disabled?: boolean;
}

export function KnowledgeAreasSelector({ selected, onChange, disabled }: KnowledgeAreasSelectorProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const CATEGORY_LABELS: Record<string, string> = {
    security: t('knowledgeAreas.categorySecurity'),
    development: t('knowledgeAreas.categoryDevelopment'),
    infrastructure: t('knowledgeAreas.categoryInfrastructure'),
  };

  const toggle = (label: string) => {
    if (disabled) return;
    if (selected.includes(label)) {
      onChange(selected.filter((a) => a !== label));
    } else if (selected.length < MAX_KNOWLEDGE_AREAS) {
      onChange([...selected, label]);
    }
  };

  const filtered = search.trim()
    ? KNOWLEDGE_AREAS.filter((a) => a.label.toLowerCase().includes(search.toLowerCase()))
    : KNOWLEDGE_AREAS;

  const grouped = filtered.reduce<Record<string, typeof KNOWLEDGE_AREAS[number][]>>(
    (acc, area) => {
      if (!acc[area.category]) acc[area.category] = [];
      acc[area.category].push(area);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
          {t('knowledgeAreas.label')}
        </span>
        <span className={`text-xs font-mono ${selected.length >= MAX_KNOWLEDGE_AREAS ? 'text-amber-400' : 'text-slate-500'}`}>
          {selected.length}/{MAX_KNOWLEDGE_AREAS}
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('knowledgeAreas.searchPlaceholder')}
          disabled={disabled}
          className="pl-9 h-9 text-sm bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500/50"
        />
      </div>

      <div className="max-h-56 overflow-y-auto pr-1 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {(Object.keys(grouped) as Array<keyof typeof CATEGORY_LABELS>).map((cat) => (
          <div key={cat}>
            <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2 font-semibold">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="flex flex-wrap gap-2">
              {grouped[cat].map((area) => {
                const isSelected = selected.includes(area.label);
                const isDisabled = disabled || (!isSelected && selected.length >= MAX_KNOWLEDGE_AREAS);
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => toggle(area.label)}
                    disabled={isDisabled}
                    className={`
                      px-3 py-1 rounded-full text-xs font-medium transition-all border
                      ${isSelected
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/10'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200'
                      }
                      ${isDisabled && !isSelected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {area.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-slate-600 text-sm text-center py-4">No areas match your search.</p>
        )}
      </div>
    </div>
  );
}
