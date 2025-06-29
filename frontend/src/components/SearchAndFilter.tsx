import React from 'react';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface SearchAndFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: Array<{
    key: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }>;
  className?: string;
  showResults?: boolean;
  resultsCount?: number;
  totalCount?: number;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = '検索...',
  filters = [],
  className = '',
  showResults = false,
  resultsCount = 0,
  totalCount = 0
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const clearAllFilters = () => {
    onSearchChange('');
    filters.forEach(filter => filter.onChange(''));
  };

  const hasActiveFilters = searchValue || filters.some(filter => filter.value);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchValue}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg
              className="h-4 w-4 text-gray-400 hover:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Filters */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-4 items-center">
          {filters.map((filter) => (
            <div key={filter.key} className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                {filter.label}:
              </label>
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">すべて</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                    {option.count !== undefined && ` (${option.count})`}
                  </option>
                ))}
              </select>
            </div>
          ))}
          
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              フィルターをクリア
            </button>
          )}
        </div>
      )}

      {/* Results Summary */}
      {showResults && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {hasActiveFilters ? (
              <>
                <span className="font-medium">{resultsCount}</span> 件の検索結果
                （全<span className="font-medium">{totalCount}</span>件中）
              </>
            ) : (
              <>
                全<span className="font-medium">{totalCount}</span>件
              </>
            )}
          </div>
          
          {hasActiveFilters && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">アクティブなフィルター:</span>
              <div className="flex flex-wrap gap-1">
                {searchValue && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    検索: "{searchValue}"
                    <button
                      onClick={() => onSearchChange('')}
                      className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {filters.filter(f => f.value).map((filter) => (
                  <span
                    key={filter.key}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {filter.label}: {filter.options.find(o => o.value === filter.value)?.label}
                    <button
                      onClick={() => filter.onChange('')}
                      className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-600"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;