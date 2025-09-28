import React, { useMemo } from 'react';
import { Business, FilterState } from '../../types';
import Card from '../ui/Card';
import StarRating from '../ui/StarRating';
import Button from '../ui/Button';
import { SlidersHorizontal, X } from 'lucide-react';

interface BusinessFiltersProps {
  businesses: Business[];
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onClearFilters: () => void;
}

const BusinessFilters: React.FC<BusinessFiltersProps> = ({ businesses, filters, onFilterChange, onClearFilters }) => {
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    businesses.forEach(b => categories.add(b.category));
    return Array.from(categories).sort();
  }, [businesses]);

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onFilterChange({ categories: newCategories });
  };
  
  const handleRatingChange = (rating: number) => {
      onFilterChange({ minRating: filters.minRating === rating ? 0 : rating });
  }

  const hasActiveFilters = filters.categories.length > 0 || filters.minRating > 0 || filters.maxDeliveryTime > 0 || filters.maxDeliveryFee > 0;

  return (
    <Card className="p-4 mb-8 bg-white/10 border border-white/20">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <Button variant="secondary" className="!px-3 !py-2">
                <SlidersHorizontal className="mr-2 h-5 w-5" />
                Filtros
            </Button>
            
            <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Calificación:</span>
                <StarRating rating={filters.minRating} setRating={handleRatingChange} />
            </div>

            {hasActiveFilters && (
                <Button onClick={onClearFilters} variant="secondary" className="flex items-center gap-1 text-sm !py-1.5 !px-3">
                    <X className="h-4 w-4" />
                    Limpiar
                </Button>
            )}
        </div>
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-4">
             <button
                onClick={() => onFilterChange({ categories: [] })}
                className={`px-4 py-2 text-sm rounded-md transition-colors border-b-2 ${
                    filters.categories.length === 0
                    ? 'border-purple-400 text-white font-semibold'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
                >
                Todos
            </button>
            {uniqueCategories.map(category => (
                <button
                key={category}
                onClick={() => handleCategoryToggle(category)}
                className={`px-4 py-2 text-sm rounded-md transition-colors border-b-2 ${
                    filters.categories.includes(category)
                    ? 'border-purple-400 text-white font-semibold'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
                >
                {category}
                </button>
            ))}
        </div>
      </div>
    </Card>
  );
};

export default BusinessFilters;