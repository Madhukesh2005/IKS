import { useEffect, useMemo, useRef, useState } from 'react';
import { Calculator, Landmark, Moon, Search, Sparkles, Sun, Trophy, Volume2, VolumeX, X } from 'lucide-react';
import { playClick } from '../utils/sfx';

export type PaletteTab = 'snap' | 'sutras' | 'scriptures' | 'quiz';

type CommandItem = {
  id: string;
  title: string;
  subtitle: string;
  group: string;
  icon: 'snap' | 'sutras' | 'scriptures' | 'quiz' | 'theme' | 'sfx';
  keywords: string;
  run: () => void;
};

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  onSelectTab: (tab: PaletteTab) => void;
  onSendToAI: (prompt: string, sutraName: string) => void;
  onToggleTheme: () => void;
  onToggleSfx: () => void;
  theme: 'light' | 'dark';
  sfxEnabled: boolean;
  sutras: [string, string, string][];
  subSutras: { name: string; meaning: string; prompt: string }[];
};

export default function CommandPalette({
  open,
  onClose,
  onSelectTab,
  onSendToAI,
  onToggleTheme,
  onToggleSfx,
  theme,
  sfxEnabled,
  sutras,
  subSutras,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<CommandItem[]>(() => {
    const base: CommandItem[] = [
      {
        id: 'tab-snap',
        title: 'AI Snap & Solve',
        subtitle: 'Solve arithmetic, Lilavati riddles, or handwritten math images',
        group: 'Module',
        icon: 'snap',
        keywords: 'home ai solver image ocr riddle',
        run: () => onSelectTab('snap'),
      },
      {
        id: 'tab-sutras',
        title: 'Vedic Sutras Lab',
        subtitle: 'Interactive deterministic calculators & 16 Sutras explorer',
        group: 'Module',
        icon: 'sutras',
        keywords: 'calculator lab nikhilam ekadhikena urdhva',
        run: () => onSelectTab('sutras'),
      },
      {
        id: 'tab-scriptures',
        title: 'Ancient Scriptures Lab',
        subtitle: 'Baudhayana, Madhava Pi, Vilokanam, Kaprekar, Katapayadi, Meru',
        group: 'Module',
        icon: 'scriptures',
        keywords: 'sulba pi kerala pingala meru kaprekar katapayadi',
        run: () => onSelectTab('scriptures'),
      },
      {
        id: 'tab-quiz',
        title: 'Dynamic Speed Quiz',
        subtitle: 'Non-repeating Vedic math sprint with keyboard shortcuts',
        group: 'Module',
        icon: 'quiz',
        keywords: 'quiz sprint test game practice',
        run: () => onSelectTab('quiz'),
      },
      {
        id: 'pref-theme',
        title: `Switch to ${theme === 'light' ? 'Obsidian Dark' : 'Optical Light'} Theme`,
        subtitle: 'Toggle display polarity across canvas and cards',
        group: 'Preference',
        icon: 'theme',
        keywords: 'dark light mode theme appearance',
        run: onToggleTheme,
      },
      {
        id: 'pref-sfx',
        title: `${sfxEnabled ? 'Mute' : 'Enable'} Tactile Sound Effects`,
        subtitle: 'Toggle WebAudio UI clicks and chimes',
        group: 'Preference',
        icon: 'sfx',
        keywords: 'sound audio sfx mute unmute',
        run: onToggleSfx,
      },
    ];

    const sutraItems: CommandItem[] = sutras.map(([name, meaning, example]) => ({
      id: `sutra-${name}`,
      title: name,
      subtitle: meaning,
      group: '16 Sutras',
      icon: 'sutras',
      keywords: `${name} ${meaning} ${example}`,
      run: () => onSendToAI(example, name),
    }));

    const subItems: CommandItem[] = subSutras.map(sub => ({
      id: `sub-${sub.name}`,
      title: sub.name,
      subtitle: sub.meaning,
      group: 'Upasutra',
      icon: 'sutras',
      keywords: `${sub.name} ${sub.meaning}`,
      run: () => onSendToAI(sub.prompt, sub.name),
    }));

    return [...base, ...sutraItems, ...subItems];
  }, [onSelectTab, onSendToAI, onToggleSfx, onToggleTheme, sfxEnabled, subSutras, sutras, theme]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 14);
    return items.filter(item => `${item.title} ${item.subtitle} ${item.keywords}`.toLowerCase().includes(q)).slice(0, 18);
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 10);
    return () => window.clearTimeout(id);
  }, [open]);

  if (!open) return null;

  const clampedIndex = Math.min(selectedIndex, Math.max(0, filtered.length - 1));

  function executeItem(item: CommandItem) {
    playClick();
    item.run();
    onClose();
  }

  function renderIcon(kind: CommandItem['icon']) {
    if (kind === 'snap') return <Sparkles size={15} />;
    if (kind === 'sutras') return <Calculator size={15} />;
    if (kind === 'scriptures') return <Landmark size={15} />;
    if (kind === 'quiz') return <Trophy size={15} />;
    if (kind === 'theme') return theme === 'light' ? <Moon size={15} /> : <Sun size={15} />;
    return sfxEnabled ? <VolumeX size={15} /> : <Volume2 size={15} />;
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Quick command palette"
      onClick={onClose}
    >
      <div className="cmd-modal" onClick={e => e.stopPropagation()}>
        <div className="cmd-input-row">
          <Search size={16} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(i => Math.min(filtered.length - 1, i + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(i => Math.max(0, i - 1));
              } else if (e.key === 'Enter' && filtered[clampedIndex]) {
                e.preventDefault();
                executeItem(filtered[clampedIndex]);
              }
            }}
            placeholder="Jump to a Sutra, Scripture tool, module, or preference..."
          />
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close palette">
            <X size={14} />
          </button>
        </div>
        <div className="cmd-list" role="listbox">
          {filtered.length ? (
            filtered.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={idx === clampedIndex}
                className={`cmd-item ${idx === clampedIndex ? 'selected' : ''}`}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => executeItem(item)}
              >
                <div className="cmd-item-main">
                  {renderIcon(item.icon)}
                  <div>
                    <strong>{item.title}</strong>
                    <div>
                      <span>{item.subtitle}</span>
                    </div>
                  </div>
                </div>
                <span className="cmd-item-group">{item.group}</span>
              </button>
            ))
          ) : (
            <div className="cmd-empty">No matching Sutras or tools for "{query}"</div>
          )}
        </div>
      </div>
    </div>
  );
}
