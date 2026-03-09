import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, User, ClipboardList, Truck, FileText, Loader2 } from 'lucide-react';
import { searchService, type SearchResult, type SearchResultType } from '../services/searchService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_LABEL: Record<SearchResultType, string> = {
  driver: 'Drivers',
  task: 'Tasks',
  equipment: 'Equipment',
  document: 'Documents',
};

const TYPE_ICON: Record<SearchResultType, React.ReactNode> = {
  driver: <User className="w-4 h-4" />,
  task: <ClipboardList className="w-4 h-4" />,
  equipment: <Truck className="w-4 h-4" />,
  document: <FileText className="w-4 h-4" />,
};

const TYPE_ORDER: SearchResultType[] = ['driver', 'task', 'equipment', 'document'];

const SearchPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setActiveIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      searchService.search(query).then((res) => {
        setResults(res);
        setActiveIndex(-1);
      }).catch(() => setResults([])).finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback((result: SearchResult) => {
    navigate(result.href);
    onClose();
  }, [navigate, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        handleSelect(results[activeIndex]);
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, results, activeIndex, handleSelect, onClose]);

  if (!isOpen) return null;

  // Group results by type in display order
  const grouped = TYPE_ORDER.map((type) => ({
    type,
    items: results.filter((r) => r.type === type),
  })).filter((g) => g.items.length > 0);

  // Build flat list for keyboard navigation index mapping
  const flatList: SearchResult[] = grouped.flatMap((g) => g.items);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-label="Global search"
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          {loading ? (
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin flex-shrink-0" />
          ) : (
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search drivers, tasks, equipment, documents…"
            className="flex-1 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            aria-label="Search"
          />
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-400" aria-label="Close search">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length < 2 && (
            <p className="text-center text-sm text-slate-400 py-10">Type at least 2 characters to search</p>
          )}

          {query.trim().length >= 2 && !loading && results.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-10">No results for "{query}"</p>
          )}

          {grouped.map((group) => (
            <div key={group.type}>
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-100">
                {TYPE_LABEL[group.type]}
              </div>
              {group.items.map((result) => {
                const flatIdx = flatList.indexOf(result);
                const isActive = flatIdx === activeIndex;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setActiveIndex(flatIdx)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isActive ? 'bg-emerald-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className={`flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {TYPE_ICON[result.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400">
            <span><kbd className="font-mono bg-slate-100 px-1 rounded">↑↓</kbd> navigate</span>
            <span><kbd className="font-mono bg-slate-100 px-1 rounded">↵</kbd> select</span>
            <span><kbd className="font-mono bg-slate-100 px-1 rounded">esc</kbd> close</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;
