import { useState, useEffect, useRef } from 'react';
import { Search, Database, Table, BarChart2, Settings, MessageCircle, History, Command, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Get recent queries from localStorage
  const recentQueries = JSON.parse(localStorage.getItem('recentQueries') || '[]').slice(0, 5);
  const activeDb = localStorage.getItem('activeDatabase');

  // Define all available commands
  const allCommands = [
    // Navigation
    { id: 'nav-chat', label: 'Go to Chat', icon: MessageCircle, category: 'Navigation', action: () => navigate('/agent') },
    { id: 'nav-explorer', label: 'Go to Data Explorer', icon: Database, category: 'Navigation', action: () => navigate('/data-explorer') },
    { id: 'nav-analytics', label: 'Go to Analytics', icon: BarChart2, category: 'Navigation', action: () => navigate('/analytics') },
    { id: 'nav-sources', label: 'Go to Data Sources', icon: Table, category: 'Navigation', action: () => navigate('/data-sources') },
    { id: 'nav-history', label: 'Go to History', icon: History, category: 'Navigation', action: () => navigate('/control-center') },
    { id: 'nav-settings', label: 'Go to Settings', icon: Settings, category: 'Navigation', action: () => navigate('/settings') },
    
    // Quick Actions
    { id: 'action-new-query', label: 'New Query', icon: MessageCircle, category: 'Actions', action: () => { navigate('/agent'); onClose(); } },
    { id: 'action-generate-report', label: 'Generate Analytics Report', icon: BarChart2, category: 'Actions', action: () => navigate('/analytics') },
    
    // Recent queries
    ...recentQueries.map((q, i) => ({
      id: `recent-${i}`,
      label: q.query?.substring(0, 50) + (q.query?.length > 50 ? '...' : ''),
      icon: History,
      category: 'Recent Queries',
      action: () => {
        // Copy to clipboard or navigate to chat
        navigate('/agent');
      }
    }))
  ];

  // Filter commands based on query
  const filteredCommands = query.trim()
    ? allCommands.filter(cmd => 
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.category.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands;

  // Group by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    setQuery('');
    setSelectedIndex(0);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-xl bg-gray-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Search commands, pages, databases..."
            className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-gray-500"
          />
          <kbd className="px-2 py-1 text-xs text-gray-400 bg-white/5 rounded border border-white/10">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {Object.entries(groupedCommands).map(([category, commands]) => (
            <div key={category} className="mb-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                {category}
              </div>
              {commands.map((cmd) => {
                const isSelected = flatIndex === selectedIndex;
                const currentIndex = flatIndex;
                flatIndex++;
                
                return (
                  <button
                    key={cmd.id}
                    onClick={() => { cmd.action(); onClose(); }}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isSelected ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <cmd.icon className="w-4 h-4" />
                    <span className="flex-1 text-left text-sm">{cmd.label}</span>
                    {isSelected && <ArrowRight className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          ))}
          
          {filteredCommands.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              No commands found for "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded">↵</kbd> Select
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span>K to open</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
