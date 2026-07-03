import React from "react";
import { Key, LandPlot, Sofa } from "lucide-react";
import { FilterState, ViewType } from "../types";

interface CategoryCardsProps {
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  setView: (v: ViewType) => void;
}

export default function CategoryCards({ setFilterState, setView }: CategoryCardsProps) {
  const handleSelectCategory = (cat: string) => {
    setFilterState({
      category: cat,
      area: "all",
      minPrice: "",
      maxPrice: "",
      bedrooms: "all",
      search: ""
    });
    setView("listings");
  };

  const categories = [
    {
      id: "rent",
      title: "House Rental",
      description: "Find flats, bachelor messes, sub-lets, and executive apartments for rent.",
      badge: "Rentals Available",
      borderClass: "border-l-4 border-blue-500",
      textClass: "text-blue-500",
      tag: "rent",
    },
    {
      id: "sale",
      title: "Property & Lands",
      description: "Buy and sell commercial or residential plots, lands, and permanent homes.",
      badge: "Properties for Sale",
      borderClass: "border-l-4 border-emerald-500",
      textClass: "text-emerald-500",
      tag: "sale",
    },
    {
      id: "furniture",
      title: "Furniture Bazar",
      description: "Buy and sell new or used wood sofas, dining sets, cupboard, and decor.",
      badge: "New & Used Deals",
      borderClass: "border-l-4 border-amber-500",
      textClass: "text-amber-500",
      tag: "furniture",
    }
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" id="bb_categories_section">
      <div className="text-center">
        <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#c8922a] mb-1">
          BashaBazar Categories
        </span>
        <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900 sm:text-4xl">
          Explore by Core Category
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-500 font-medium">
          Tailored market hubs with professional local checks. Select to search.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => handleSelectCategory(cat.tag)}
            className={`group h-48 cursor-pointer bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between rounded-sm ${cat.borderClass}`}
            id={`cat_card_${cat.id}`}
          >
            <div>
              <h3 className={`text-xs font-black uppercase tracking-widest mb-2 ${cat.textClass}`}>
                {cat.title}
              </h3>
              <p className="text-lg font-bold text-gray-900 leading-snug group-hover:text-primary-green transition duration-200">
                {cat.description}
              </p>
            </div>

            {/* Bottom Callout */}
            <div className="text-xs font-black text-gray-400 uppercase tracking-wider group-hover:text-gray-600 transition">
              {cat.badge} &rarr;
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
