import { useState, useEffect } from 'react';
import { Star, BookOpen, Plus, Trash2, ChevronDown, Sparkles } from 'lucide-react';

// Predefined query templates
const TEMPLATES = [
  { id: 't1', name: 'Show All Tables', query: 'Show me all tables in the database', category: 'Basic' },
  { id: 't2', name: 'Table Structure', query: 'Show the structure of [table_name]', category: 'Basic' },
  { id: 't3', name: 'Count Rows', query: 'How many rows are in [table_name]?', category: 'Basic' },
  { id: 't4', name: 'Top 10 Records', query: 'Show me the first 10 rows from [table_name]', category: 'Basic' },
  { id: 't5', name: 'Group By Count', query: 'Count records grouped by [column_name]', category: 'Analytics' },
  { id: 't6', name: 'Find Duplicates', query: 'Find duplicate values in [column_name]', category: 'Analytics' },
  { id: 't7', name: 'Date Range', query: 'Show records from [date_column] between [start] and [end]', category: 'Filters' },
  { id: 't8', name: 'Search Text', query: 'Find all records where [column] contains "[text]"', category: 'Filters' },
  { id: 't9', name: 'Max Value', query: 'What is the maximum [column_name] value?', category: 'Analytics' },
  { id: 't10', name: 'Average/Sum', query: 'Calculate the average and sum of [column_name]', category: 'Analytics' },
];

const QueryTemplates = ({ onSelectTemplate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' or 'favorites'
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('query_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [newFavName, setNewFavName] = useState('');
  const [showAddFav, setShowAddFav] = useState(false);
  const [pendingQuery, setPendingQuery] = useState('');

  // Persist favorites
  useEffect(() => {
    localStorage.setItem('query_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (name, query) => {
    if (!name.trim() || !query.trim()) return;
    const newFav = {
      id: `fav-${Date.now()}`,
      name: name.trim(),
      query: query.trim()
    };
    setFavorites(prev => [...prev, newFav]);
    setNewFavName('');
    setShowAddFav(false);
    setPendingQuery('');
  };

  const removeFavorite = (id) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  // Group templates by category
  const groupedTemplates = TEMPLATES.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/10"
      >
        <BookOpen className="w-4 h-4" />
        <span className="text-sm">Templates</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-gray-900/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'templates' ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Templates
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'favorites' ? 'text-yellow-400 bg-yellow-500/10' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Star className="w-4 h-4" />
              Favorites ({favorites.length})
            </button>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto p-2">
            {activeTab === 'templates' ? (
              <>
                {Object.entries(groupedTemplates).map(([category, templates]) => (
                  <div key={category} className="mb-3">
                    <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase">{category}</div>
                    {templates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { onSelectTemplate(t.query); setIsOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                ))}
              </>
            ) : (
              <>
                {favorites.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-sm">
                    No favorites yet.<br/>
                    <span className="text-xs">Star queries you use often!</span>
                  </div>
                ) : (
                  favorites.map(fav => (
                    <div key={fav.id} className="flex items-center gap-2 group">
                      <button
                        onClick={() => { onSelectTemplate(fav.query); setIsOpen(false); }}
                        className="flex-1 text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors truncate"
                      >
                        {fav.name}
                      </button>
                      <button
                        onClick={() => removeFavorite(fav.id)}
                        className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}

                {/* Add Favorite */}
                {showAddFav ? (
                  <div className="mt-2 p-2 bg-white/5 rounded-lg space-y-2">
                    <input
                      type="text"
                      value={newFavName}
                      onChange={(e) => setNewFavName(e.target.value)}
                      placeholder="Favorite name..."
                      className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={pendingQuery}
                      onChange={(e) => setPendingQuery(e.target.value)}
                      placeholder="Query..."
                      className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => addFavorite(newFavName, pendingQuery)}
                        className="flex-1 px-3 py-1.5 bg-yellow-600/20 text-yellow-400 rounded text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setShowAddFav(false); setNewFavName(''); setPendingQuery(''); }}
                        className="px-3 py-1.5 bg-white/5 text-gray-400 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddFav(true)}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Favorite
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryTemplates;
