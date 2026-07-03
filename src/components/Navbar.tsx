import React from "react";
import { Home, LogOut, LayoutDashboard, PlusCircle, Search, UserCheck } from "lucide-react";
import { User, ViewType, FilterState } from "../types";

interface NavbarProps {
  currentView: ViewType;
  setView: (v: ViewType) => void;
  user: User | null;
  onLogout: () => void;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
}

export default function Navbar({ currentView, setView, user, onLogout, setFilterState }: NavbarProps) {
  const handleLogoClick = () => {
    setFilterState({
      category: "all",
      area: "all",
      minPrice: "",
      maxPrice: "",
      bedrooms: "all",
      search: ""
    });
    setView("home");
  };

  const handleCategoryNav = (cat: string) => {
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-xs" id="bb_navbar">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo Section */}
        <div 
          onClick={handleLogoClick}
          className="flex cursor-pointer items-center space-x-2 text-primary-green focus:outline-none"
          id="bb_logo_container"
        >
          <div className="w-8 h-8 bg-primary-green rounded flex items-center justify-center shadow-sm">
            <div className="w-4 h-4 bg-primary-gold rotate-45"></div>
          </div>
          <div>
            <span className="block text-2xl font-black tracking-tighter text-primary-green uppercase leading-none">BashaBazar <span className="text-primary-gold">BD</span></span>
            <span className="block text-[8px] uppercase tracking-widest text-gray-400 font-bold">Bangladesh classifieds</span>
          </div>
        </div>

        {/* Desktop Quick Nav Links */}
        <nav className="hidden md:flex items-center space-x-6 text-xs font-black uppercase tracking-widest text-gray-500">
          <button 
            onClick={handleLogoClick}
            className={`transition border-b-2 py-1 ${currentView === "home" ? "text-primary-green border-primary-green" : "border-transparent hover:text-primary-green"}`}
          >
            Home
          </button>
          <button 
            onClick={() => handleCategoryNav("rent")}
            className={`transition border-b-2 py-1 ${currentView === "listings" ? "text-primary-green border-primary-green" : "border-transparent hover:text-primary-green"}`}
          >
            Rentals
          </button>
          <button 
            onClick={() => handleCategoryNav("sale")}
            className="transition border-b-2 py-1 border-transparent hover:text-primary-green"
          >
            Property
          </button>
          <button 
            onClick={() => handleCategoryNav("furniture")}
            className="transition border-b-2 py-1 border-transparent hover:text-primary-green"
          >
            Furniture
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setView("listings");
            }}
            className="p-1 px-2 text-gray-400 hover:text-primary-green transition md:hidden border-2 border-transparent"
            title="Browse all listings"
          >
            <Search className="h-5 w-5" />
          </button>

          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* If user is seller, show a "Post Add" button */}
              {user.role === "seller" && (
                <button
                  id="nav_add_listing_btn"
                  onClick={() => setView("add-listing")}
                  className="flex items-center space-x-1 border-2 border-primary-green bg-primary-green px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-md hover:brightness-110 transition rounded-sm"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Post Ad</span>
                </button>
              )}

              {/* Dashboard Button */}
              <button
                id="nav_dashboard_btn"
                onClick={() => setView("dashboard")}
                className={`flex items-center space-x-1 px-4 py-2 text-xs font-black uppercase tracking-wider transition border-2 rounded-sm ${
                  currentView === "dashboard"
                    ? "bg-primary-green/10 border-primary-green text-primary-green"
                    : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>

              {/* Logout Button */}
              <button
                id="nav_logout_btn"
                onClick={onLogout}
                className="rounded-sm border-2 border-gray-150 p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-650 transition"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                id="nav_login_btn"
                onClick={() => setView("login")}
                className="px-4 py-2 text-xs font-black uppercase tracking-wider text-primary-green hover:underline decoration-2 transition"
              >
                Login
              </button>
              <button
                id="nav_register_btn"
                onClick={() => setView("register")}
                className="rounded-sm bg-primary-green border-2 border-primary-green px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-md hover:brightness-110 transition shrink-0"
              >
                Post Ad
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
