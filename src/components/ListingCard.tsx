import React from "react";
import { Heart, MapPin, BedDouble, Bath, ArrowUpRight } from "lucide-react";
import { Listing } from "../types";

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
  liked: boolean;
  onWishlistToggle: (e: React.MouseEvent) => void;
  key?: any;
}

export default function ListingCard({ listing, onClick, liked, onWishlistToggle }: ListingCardProps) {
  // Format price helper with English localized currency symbols in Bangladeshi style (Lakh / Crore or comma groupings)
  const formatBDTPrice = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 0
    }).format(value).replace("BDT", "৳");
  };  // Get dynamic category badge colors matching request specifications: rent=blue, sale=green, furniture=orange
  const getCategoryDetails = (cat: string) => {
    switch (cat) {
      case "rent":
        return {
          label: "Rent",
          badgeColor: "bg-blue-600 text-white border-blue-600 font-extrabold uppercase",
        };
      case "sale":
        return {
          label: "Sale",
          badgeColor: "bg-emerald-600 text-white border-emerald-600 font-extrabold uppercase",
        };
      case "furniture":
        return {
          label: "Furniture",
          badgeColor: "bg-amber-600 text-white border-amber-600 font-extrabold uppercase",
        };
      default:
        return {
          label: "Item",
          badgeColor: "bg-gray-800 text-white border-gray-800 font-extrabold uppercase",
        };
    }
  };

  const catDetails = getCategoryDetails(listing.category);

  return (
    <div 
      onClick={onClick}
      className="group relative cursor-pointer flex flex-col justify-between overflow-hidden rounded-sm border border-gray-200 bg-white shadow-xs hover:border-primary-green hover:shadow-md transition-all duration-350"
      id={`listing_card_${listing.id}`}
    >
      {/* Listing Image Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        <img
          src={listing.image}
          alt={listing.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          id={`listing_img_${listing.id}`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800";
          }}
        />

        {/* Category Badges */}
        <div className="absolute top-2 left-2 z-10">
          <span className={`inline-flex items-center px-2 py-1 text-[9px] tracking-widest uppercase rounded-none border shadow-xs ${catDetails.badgeColor}`}>
            {catDetails.label}
          </span>
        </div>

        {/* Heart Wishlist Trigger */}
        <button
          onClick={onWishlistToggle}
          type="button"
          className="absolute top-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-sm bg-white/95 shadow-sm border border-gray-150 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
          title={liked ? "Remove from wishlist" : "Save to wishlist"}
          id={`wishlist_btn_${listing.id}`}
        >
          <Heart 
            className={`h-4 w-4 transition-colors duration-200 ${
              liked ? "fill-red-500 text-red-500" : "text-gray-600"
            }`} 
          />
        </button>

        {/* Dynamic Status Tag (e.g. rented / sold etc) */}
        {listing.status !== "available" && (
          <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="rounded-none bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-lg">
              {listing.status === "rented" ? "Rented Out" : "Sold Out"}
            </span>
          </div>
        )}
      </div>

      {/* Title & Details Container */}
      <div className="flex flex-1 flex-col p-4 justify-between">
        <div className="space-y-1.5">
          {/* Geolocation area metadata */}
          <div className="flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
            <MapPin className="h-3 w-3 text-primary-gold shrink-0" />
            <span className="truncate">{listing.area}</span>
          </div>

          <h3 className="line-clamp-2 text-xs sm:text-sm font-black text-gray-900 group-hover:text-primary-green leading-snug transition duration-200 min-h-[40px] uppercase tracking-tight">
            {listing.title}
          </h3>
        </div>

        {/* Room count parameters ONLY for rent & property sales */}
        {(listing.category === "rent" || listing.category === "sale") && (listing.bedrooms > 0 || listing.bathrooms > 0) ? (
          <div className="mt-3 flex items-center space-x-4 border-t border-gray-100 pt-3 text-[10px] text-gray-500 font-bold uppercase tracking-wider" id={`listing_stats_${listing.id}`}>
            {listing.bedrooms > 0 && (
              <span className="flex items-center space-x-1">
                <BedDouble className="h-3.5 w-3.5 text-gray-400" />
                <span>{listing.bedrooms} Beds</span>
              </span>
            )}
            {listing.bathrooms > 0 && (
              <span className="flex items-center space-x-1">
                <Bath className="h-3.5 w-3.5 text-gray-400" />
                <span>{listing.bathrooms} Baths</span>
              </span>
            )}
          </div>
        ) : (
          listing.category === "furniture" && (
            <div className="mt-3 flex items-center space-x-4 border-t border-gray-100 pt-3 text-[10px] text-gray-400 font-bold tracking-wider" id={`listing_stats_${listing.id}`}>
              <span className="uppercase tracking-widest text-[#c8922a] bg-amber-50 px-2.5 py-0.5 rounded-none border border-amber-100">Premium Wood</span>
            </div>
          )
        )}

        {/* Footer info: details link and price */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-150 pt-3">
          <span className="text-lg font-black text-primary-green leading-none">
            {formatBDTPrice(listing.price)}
            {listing.category === "rent" && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest"> / Mo</span>}
          </span>
          <span className="flex items-center space-x-0.5 text-[10px] font-black uppercase tracking-widest text-primary-gold group-hover:underline">
            <span>View Ad</span>
            <ArrowUpRight className="h-3 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
