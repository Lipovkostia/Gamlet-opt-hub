
import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | 'all';
  onSelectCategory: (category: string | 'all') => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selectedCategory, onSelectCategory }) => {
  const baseStyle = "px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex-shrink-0 whitespace-nowrap";
  const activeStyle = "bg-indigo-600 text-white";
  const inactiveStyle = "bg-gray-200 text-gray-700 hover:bg-gray-300";

  return (
    <div className="flex items-center space-x-3 overflow-x-auto pb-2 -mx-4 px-4" role="tablist" aria-orientation="horizontal">
      <button
        role="tab"
        aria-selected={selectedCategory === 'all'}
        onClick={() => onSelectCategory('all')}
        className={`${baseStyle} ${selectedCategory === 'all' ? activeStyle : inactiveStyle}`}
      >
        Все
      </button>
      {categories.map(category => (
        <button
          role="tab"
          aria-selected={selectedCategory === category}
          key={category}
          onClick={() => onSelectCategory(category)}
          className={`${baseStyle} ${selectedCategory === category ? activeStyle : inactiveStyle}`}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
