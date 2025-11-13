import React, { useState, useEffect, useRef } from 'react';

interface CategoryDropdownProps {
  categories: string[];
  selectedCategory: string | 'all';
  onSelectCategory: (category: string | 'all') => void;
  label?: string; // Optional label for context
  displayAsIconButton?: boolean;
}

const FilterIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 12.414V17a1 1 0 01-1.447.894l-2-1A1 1 0 018 16v-3.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
    </svg>
);

const ChevronDownIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({ categories, selectedCategory, onSelectCategory, label, displayAsIconButton = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (category: string | 'all') => {
    onSelectCategory(category);
    setIsOpen(false);
  };

  const selectedCategoryLabel = selectedCategory === 'all' ? 'Все категории' : selectedCategory;

  const dropdownMenuClasses = "absolute z-10 mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm";
  const dropdownMenuPosition = displayAsIconButton ? "right-0 w-56" : "w-full";

  return (
    <div className={`relative ${displayAsIconButton ? '' : 'w-full sm:w-64'}`} ref={dropdownRef}>
      {label && !displayAsIconButton && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      
      {displayAsIconButton ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label="Фильтр по категориям"
          title="Фильтр по категориям"
        >
          <FilterIcon className="w-6 h-6" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="block truncate">{selectedCategoryLabel}</span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          </span>
        </button>
      )}

      {isOpen && (
        <div className={`${dropdownMenuClasses} ${dropdownMenuPosition}`}>
          <ul role="listbox">
             <li
                onClick={() => handleSelect('all')}
                className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white"
                role="option"
                aria-selected={selectedCategory === 'all'}
             >
                <span className={`font-normal block truncate ${selectedCategory === 'all' ? 'font-semibold' : ''}`}>
                    Все категории
                </span>
             </li>
            {categories.map(category => (
              <li
                key={category}
                onClick={() => handleSelect(category)}
                className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white"
                role="option"
                aria-selected={selectedCategory === category}
              >
                <span className={`font-normal block truncate ${selectedCategory === category ? 'font-semibold' : ''}`}>
                  {category}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CategoryDropdown;