"use client";

import React, { useState, useEffect, useRef } from "react";

export interface PlaceSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lng?: string;
  lon: string;
  type?: string;
}

interface LocationSearchInputProps {
  label: string;
  currentName: string;
  onSelectPlace: (place: { name: string; lat: number; lng: number }) => void;
  placeholder?: string;
}

export default function LocationSearchInput({
  label,
  currentName,
  onSelectPlace,
  placeholder = "Search real street, landmark, or area...",
}: LocationSearchInputProps) {
  const [prevCurrentName, setPrevCurrentName] = useState(currentName);
  const [query, setQuery] = useState(currentName);
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (currentName !== prevCurrentName) {
    setPrevCurrentName(currentName);
    setQuery(currentName);
  }

  useEffect(() => {
    if (!query || query.length < 3 || query === currentName) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        // Search Nominatim OpenStreetMap within India / Bengaluru bias
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&limit=5&countrycodes=in`;

        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            "Accept-Language": "en",
          },
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data: PlaceSearchResult[] = await res.json();
          setResults(data || []);
          setIsOpen(true);
        }
      } catch {
        // Ignore network abort
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, currentName]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: PlaceSearchResult) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    // Shorten long display name to first 2-3 segments
    const shortened = item.display_name.split(",").slice(0, 3).join(", ");

    setQuery(shortened);
    setIsOpen(false);
    setResults([]);
    onSelectPlace({
      name: shortened,
      lat,
      lng,
    });
  };

  return (
    <div ref={containerRef} className="relative space-y-1">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-[#18231D]">{label}</label>
        {loading && <span className="text-[10px] text-[#245A43] animate-pulse">Searching OSM...</span>}
      </div>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            if (val.length < 3) {
              setResults([]);
            }
            setIsOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full border border-[#D6DCD2] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#245A43] bg-white pr-7 shadow-sm text-[#18231D]"
        />
        {query && query !== currentName && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs"
          >
            &times;
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#D6DCD2] rounded-lg shadow-lg z-[2000] max-h-56 overflow-y-auto divide-y divide-gray-100 text-xs">
          {results.map((item) => (
            <button
              key={item.place_id}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left p-2.5 hover:bg-[#F4F3ED] transition-colors flex items-start gap-2"
            >
              <span className="text-[#245A43] mt-0.5">📍</span>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-[#18231D] block truncate">
                  {item.display_name.split(",")[0]}
                </span>
                <span className="text-[10px] text-[#68746C] block truncate">
                  {item.display_name}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
