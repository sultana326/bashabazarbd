import React, { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { FilterState, ViewType } from "../types.js";

interface HeroProps {
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  setView: (v: ViewType) => void;
}

export default function Hero({ setFilterState, setView }: HeroProps) {
  const [searchInput, setSearchInput] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilterState(prev => ({
      ...prev,
      search: searchInput,
      category: "all"
    }));
    setView("listings");
  };

  const handleQuickArea = (areaName: string) => {
    setFilterState(prev => ({
      ...prev,
      area: areaName,
      search: "",
      category: "all"
    }));
    setView("listings");
  };

  return (
    <div className="relative overflow-hidden bg-primary-green text-white" id="bb_hero">
      {/* Decorative vector overlays */}
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          {/* Badge */}
          <span className="inline-flex items-center rounded-full bg-primary-green-dark px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-gold border border-primary-gold/30">
            🥇 Bangladesh's Leading Portal
          </span>

          <h1 className="mt-6 text-6xl sm:text-7xl lg:text-8xl font-black leading-[0.85] tracking-tighter mb-6 uppercase">
            Everything<br />
            for your <span className="text-primary-gold">Space.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-md text-gray-100/90 leading-snug">
            Discover comfortable rent flats, lands & properties, and high-quality wooden furniture all in Bangladesh's leading portal.
          </p>

          {/* Core Search Form */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="mx-auto mt-10 max-w-2xl"
            id="hero_search_form"
          >
            <div className="flex flex-col sm:flex-row sm:items-center overflow-hidden rounded-xl bg-white p-2.5 shadow-2xl text-left border-2 border-gray-100">
              <div className="flex-1 px-3 py-1.5 min-w-0">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Search Keyword</label>
                <div className="relative">
                  <Search className="absolute top-2 left-0 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search: flat, plot, segun wood bed..."
                    className="w-full bg-transparent border-0 py-1.5 pr-4 pl-7 text-sm font-semibold text-gray-900 placeholder-gray-300 focus:outline-none"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    id="hero_search_input"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="mt-2 w-full sm:mt-0 rounded-lg bg-primary-gold px-8 py-4.5 text-xs font-black uppercase tracking-widest text-white shadow-md hover:brightness-110 focus:outline-none transition sm:w-auto shrink-0"
                id="hero_search_submit_btn"
              >
                Search
              </button>
            </div>
          </form>

          {/* Popular Areas Quick Links */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="text-gray-200">Popular Locations:</span>
            {["Uttara, Dhaka", "Dhanmondi, Dhaka", "Bashundhara R/A, Dhaka", "Banani, Dhaka", "Halishahar, Chattogram"].map((areaLoc) => (
              <button
                key={areaLoc}
                onClick={() => handleQuickArea(areaLoc)}
                className="flex items-center space-x-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs text-white hover:bg-white/20 transition border border-white/10"
              >
                <MapPin className="h-3 w-3 text-primary-gold" />
                <span>{areaLoc.split(",")[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
