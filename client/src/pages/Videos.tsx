import React, { useState } from 'react';
import { Search, ExternalLink, Play } from 'lucide-react';

export default function Videos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const bjjCategories = [
    { name: 'Guard', query: 'BJJ guard techniques' },
    { name: 'Submissions', query: 'BJJ submissions armbars chokes' },
    { name: 'Sweeps', query: 'BJJ sweeps from guard' },
    { name: 'Escapes', query: 'BJJ escapes defense' },
    { name: 'Takedowns', query: 'BJJ takedowns wrestling' },
    { name: 'Passing', query: 'BJJ guard passing' },
    { name: 'Mount', query: 'BJJ mount position attacks' },
    { name: 'Side Control', query: 'BJJ side control techniques' },
    { name: 'Back Control', query: 'BJJ back control rear naked choke' },
    { name: 'Leg Locks', query: 'BJJ leg locks heel hooks' },
    { name: 'Gi Techniques', query: 'BJJ gi techniques grips' },
    { name: 'No-Gi', query: 'BJJ no gi techniques' }
  ];

  const handleSearch = (query: string) => {
    setIsSearching(true);
    const searchQuery = query || searchTerm;
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery + ' BJJ brazilian jiu jitsu')}`;
    window.open(youtubeSearchUrl, '_blank');
    setIsSearching(false);
  };

  const handleCategoryClick = (query: string) => {
    handleSearch(query);
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Play className="text-red-600" size={28} />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">BJJ Videos</h1>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search BJJ techniques..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-black dark:text-white bg-white dark:bg-gray-800"
          />
        </div>
        <button
          onClick={() => handleSearch(searchTerm)}
          disabled={isSearching || !searchTerm.trim()}
          className="w-full mt-3 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Search size={20} />
          {isSearching ? 'Searching...' : 'Search on YouTube'}
        </button>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Categories</h2>
        <div className="grid grid-cols-2 gap-3">
          {bjjCategories.map((category) => (
            <button
              key={category.name}
              onClick={() => handleCategoryClick(category.query)}
              className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50 hover:border-red-300 transition-colors shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-black">{category.name}</span>
                <ExternalLink size={16} className="text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="font-medium text-black">YouTube Search</span>
        </div>
        <p className="text-sm text-black">
          Search results will open in YouTube where you can find the best BJJ instructional videos from top practitioners and academies.
        </p>
      </div>
    </div>
  );
}