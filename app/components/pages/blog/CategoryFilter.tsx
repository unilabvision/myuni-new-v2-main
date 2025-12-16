// app/components/pages/blog/CategoryFilter.tsx
import React from 'react';
import { Check, X } from 'lucide-react';

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onChange: (category: string) => void;
  locale: string;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  categories, 
  activeCategory, 
  onChange, 
  locale 
}) => {
  const handleCategoryClick = (category: string) => {
    onChange(category === 'all' ? '' : category);
  };

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          {locale === 'tr' ? 'Kategoriler' : 'Categories'}
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {locale === 'tr' 
            ? 'İlgilendiğiniz konuya göre yazıları filtreleyin'
            : 'Filter posts by your area of interest'}
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {/* All Categories Button */}
        <button
          onClick={() => handleCategoryClick('all')}
          className={`
            inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
            transition-all duration-200 relative
            ${
              activeCategory === '' || activeCategory === 'all'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/25 dark:bg-red-500 dark:shadow-red-500/25'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
            }
          `}
        >
          {(activeCategory === '' || activeCategory === 'all') && (
            <Check className="w-4 h-4" />
          )}
          <span>{locale === 'tr' ? 'Tümü' : 'All'}</span>
          {(activeCategory === '' || activeCategory === 'all') && (
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {categories.length + 1}
            </span>
          )}
        </button>
        
        {/* Individual Category Buttons */}
        {categories.map((category, index) => (
          <button
            key={index}
            onClick={() => handleCategoryClick(category)}
            className={`
              inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
              transition-all duration-200 relative group
              ${
                activeCategory === category
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/25 dark:bg-red-500 dark:shadow-red-500/25'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 hover:border-red-200 dark:hover:border-red-800'
              }
            `}
          >
            {activeCategory === category && (
              <Check className="w-4 h-4" />
            )}
            <span>{category}</span>
            
            {/* Hover effect indicator */}
            {activeCategory !== category && (
              <div className="absolute inset-0 rounded-lg bg-red-50 dark:bg-red-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10" />
            )}
          </button>
        ))}
      </div>

      {/* Active Filter Indicator */}
      {activeCategory && activeCategory !== 'all' && (
        <div className="mt-4 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
          <span>{locale === 'tr' ? 'Aktif filtre:' : 'Active filter:'}</span>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md font-medium">
            {activeCategory}
            <button
              onClick={() => handleCategoryClick('all')}
              className="ml-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded p-0.5 transition-colors"
              aria-label={locale === 'tr' ? 'Filtreyi kaldır' : 'Remove filter'}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

      {/* Results Summary */}
      <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
        {locale === 'tr' 
          ? `${categories.length} kategori mevcut`
          : `${categories.length} categories available`}
      </div>
    </div>
  );
};

export default CategoryFilter;