"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getLocationSuggestions, getLocationDetails, LocationSuggestion, LocationDetail } from '@/services/searchService';

interface LocationSearchProps {
  label: string;
  placeholder?: string;
  defaultValue?: string;
  onLocationSelect: (location: LocationDetail) => void;
}

/**
 * LocationSearch - A component for searching and selecting locations with autocomplete
 */
const LocationSearch: React.FC<LocationSearchProps> = ({
  label,
  placeholder = "Enter address or city",
  defaultValue = "",
  onLocationSelect
}) => {
  const [searchText, setSearchText] = useState<string>(defaultValue);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationDetail | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Debounce timer for search
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a new timer to fetch suggestions after 300ms
    debounceTimerRef.current = setTimeout(async () => {
      if (value.trim().length > 2) {
        setIsLoading(true);
        const results = await getLocationSuggestions(value, {
          limit: 5,
          types: 'address,place,poi'
        });
        setSuggestions(results);
        setShowSuggestions(true);
        setIsLoading(false);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  };
  
  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion: LocationSuggestion) => {
    setIsLoading(true);
    const locationDetail = await getLocationDetails(suggestion.mapbox_id);
    setIsLoading(false);
    
    if (locationDetail) {
      setSelectedLocation(locationDetail);
      setSearchText(suggestion.full_address || suggestion.name);
      onLocationSelect(locationDetail);
    }
    
    setShowSuggestions(false);
  };
  
  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  return (
    <div className="relative">
      <label htmlFor={`location-search-${label}`} className="block mb-1 font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={`location-search-${label}`}
          placeholder={placeholder}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
          value={searchText}
          onChange={handleInputChange}
          onFocus={() => searchText.trim().length > 2 && setSuggestions.length > 0 && setShowSuggestions(true)}
        />
        {isLoading && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-gray-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.mapbox_id}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="font-medium">{suggestion.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {suggestion.full_address || suggestion.place_formatted}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
