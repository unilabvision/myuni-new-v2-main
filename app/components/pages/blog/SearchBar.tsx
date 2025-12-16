// app/components/pages/blog/SearchBar.tsx
import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  locale: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, locale }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };
  
  const clearSearch = () => {
    setQuery('');
    onSearch('');
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    // Real-time search as user types
    onSearch(value);
  };
  
  return (
    <div className="w-full mb-8">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          {/* Search Icon */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <Search className={`h-5 w-5 transition-colors duration-200 ${
              isFocused 
                ? 'text-red-500 dark:text-red-400' 
                : 'text-neutral-400 dark:text-neutral-500'
            }`} />
          </div>
          
          {/* Input Field */}
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={locale === 'tr' ? 'Blog yazılarında ara...' : 'Search blog posts...'}
            className={`
              w-full py-4 pl-12 pr-12 
              bg-white dark:bg-neutral-800 
              border border-neutral-200 dark:border-neutral-700 
              rounded-xl 
              text-neutral-900 dark:text-neutral-100 
              placeholder-neutral-500 dark:placeholder-neutral-400
              focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:focus:ring-red-400/20 
              focus:border-red-500 dark:focus:border-red-400
              transition-all duration-200
              shadow-sm hover:shadow-md
              ${isFocused ? 'shadow-md' : ''}
            `}
          />
          
          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
              aria-label={locale === 'tr' ? 'Aramayı temizle' : 'Clear search'}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Search Results Counter */}
        {query && (
          <div className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
            <span className="font-medium">
              {locale === 'tr' ? 'Arama:' : 'Searching for:'} 
            </span>
            <span className="ml-2 px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-md font-medium text-neutral-700 dark:text-neutral-300">
              &ldquo;{query}&rdquo;
            </span>
          </div>
        )}
      </form>
      
      {/* Search Tips */}
      {!query && (
        <div className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
          <p>
            {locale === 'tr' 
              ? 'Başlık, içerik veya kategorilerde arama yapabilirsiniz.' 
              : 'Search through titles, content, or categories.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;