import { Search } from "lucide-react";

export const SearchAutocomplete = ({ searchQuery, onSearchInput, suggestions, onSuggestionClick }: any) => (
  <div className="relative">
    <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
    <input 
      type="text" 
      value={searchQuery}
      onChange={onSearchInput}
      placeholder="Шукати місто, готель, пам'ятку..." 
      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
    />
    {suggestions.length > 0 && (
      <ul className="absolute z-[2001] top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
        {suggestions.map((suggestion: any) => (
          <li 
            key={suggestion.mapbox_id}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors flex flex-col"
          >
            <span className="font-bold text-gray-800 text-sm">{suggestion.name}</span>
            <span className="text-xs text-gray-500 truncate">{suggestion.place_formatted || suggestion.full_address}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);