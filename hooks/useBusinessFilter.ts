
import { useState, useEffect } from 'react';
import { Business, FilterState } from '../types';

const initialFilters: FilterState = {
    categories: [],
    minRating: 0,
    maxDeliveryTime: 0,
    maxDeliveryFee: 0,
    openNow: false,
};

export const useBusinessFilter = (businesses: Business[]) => {
    const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>(businesses);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<FilterState>(initialFilters);

    const handleFilterChange = (newFilters: Partial<FilterState>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleClearFilters = () => {
        setFilters(initialFilters);
        setSearchQuery('');
    };

    useEffect(() => {
        let filtered = [...businesses];

        // 1. Filter by Search Query
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(business =>
                business.name.toLowerCase().includes(lowercasedQuery) ||
                business.category.toLowerCase().includes(lowercasedQuery)
            );
        }
        
        // 2. Filter by Categories
        if (filters.categories.length > 0) {
            filtered = filtered.filter(business => filters.categories.includes(business.category));
        }

        // 3. Filter by Rating
        if (filters.minRating > 0) {
            filtered = filtered.filter(business => business.rating >= filters.minRating);
        }

        // 4. Filter by Delivery Time
        if (filters.maxDeliveryTime > 0) {
            filtered = filtered.filter(business => {
                const timeParts = business.delivery_time.match(/\d+/g);
                if (!timeParts) return true;
                const maxTime = parseInt(timeParts[timeParts.length - 1], 10);
                return maxTime <= filters.maxDeliveryTime;
            });
        }

        // 5. Filter by Delivery Fee
        if (filters.maxDeliveryFee > 0) {
            if (filters.maxDeliveryFee === 1) { // Special case for "Gratis"
                filtered = filtered.filter(business => business.delivery_fee === 0);
            } else {
                filtered = filtered.filter(business => business.delivery_fee <= filters.maxDeliveryFee);
            }
        }

        // 6. Filter by Open Now
        if (filters.openNow) {
            filtered = filtered.filter(business => business.is_open);
        }

        setFilteredBusinesses(filtered);
    }, [searchQuery, filters, businesses]);
    
    useEffect(() => {
        setFilteredBusinesses(businesses);
    }, [businesses]);


    return {
        filteredBusinesses,
        searchQuery,
        setSearchQuery,
        filters,
        handleFilterChange,
        handleClearFilters
    };
};