import React, { useState, useEffect } from "react";
import { Search, MapPin, Sliders, X, Sparkles, Building, ArrowRight, CornerRightDown, RefreshCw, Layers } from "lucide-react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import CategoryCards from "./components/CategoryCards";
import ListingCard from "./components/ListingCard";
import ListingDetail from "./components/ListingDetail";
import AddListingForm from "./components/AddListingForm";
import LoginRegister from "./components/LoginRegister";
import Dashboard from "./components/Dashboard";
import { User, Listing, ViewType, FilterState } from "./types";

const DEFAULT_FILTERS: FilterState = {
  category: "all",
  area: "all",
  minPrice: "",
  maxPrice: "",
  bedrooms: "all",
  search: "",
};

export default function App() {
  const [currentView, setView] = useState<ViewType>("home");
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null);

  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Filter & Feed States
  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTERS);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  
  // Local Wishlist caching to reflect instantaneous Heart toggle transitions
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);

  // Selected Area Selector Options
  const AREAS = [
    { value: "all", label: "All Regions (Bangladesh)" },
    { value: "uttara", label: "Uttara, Dhaka" },
    { value: "dhanmondi", label: "Dhanmondi, Dhaka" },
    { value: "gulshan", label: "Gulshan, Dhaka" },
    { value: "banani", label: "Banani, Dhaka" },
    { value: "mirpur", label: "Mirpur, Dhaka" },
    { value: "bashundhara r/a", label: "Bashundhara R/A, Dhaka" },
    { value: "halishahar", label: "Halishahar, Chattogram" },
  ];

  // Bootstrap session storage
  useEffect(() => {
    const savedToken = localStorage.getItem("bb_token");
    const savedUser = localStorage.getItem("bb_user");

    if (savedToken && savedUser) {
      setAuthToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Sync wishlist representation on login state change
  useEffect(() => {
    if (authToken) {
      fetchUserWishlist();
    } else {
      setWishlistIds([]);
    }
  }, [authToken]);

  // Synchronously fetch feed values on filter shifts automatically!
  useEffect(() => {
    fetchListingsFeed();
  }, [filterState]);

  const fetchUserWishlist = async () => {
    try {
      const res = await fetch("/api/wishlist", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (res.ok) {
        const list: Listing[] = await res.json();
        setWishlistIds(list.map(l => l.id));
      }
    } catch (err) {
      console.error("Could not load wishlist cache:", err);
    }
  };

  const fetchListingsFeed = async () => {
    try {
      setLoadingFeed(true);
      
      const queryParams = new URLSearchParams();
      if (filterState.category !== "all") queryParams.append("category", filterState.category);
      if (filterState.area !== "all") queryParams.append("area", filterState.area);
      if (filterState.minPrice) queryParams.append("minPrice", filterState.minPrice);
      if (filterState.maxPrice) queryParams.append("maxPrice", filterState.maxPrice);
      if (filterState.bedrooms !== "all") queryParams.append("bedrooms", filterState.bedrooms);
      if (filterState.search) queryParams.append("search", filterState.search);

      const res = await fetch(`/api/listings?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      }
    } catch (err) {
      console.error("Failed to load listings stream:", err);
    } finally {
      setLoadingFeed(false);
    }
  };

  const handleAuthSuccess = (token: string, userData: User) => {
    localStorage.setItem("bb_token", token);
    localStorage.setItem("bb_user", JSON.stringify(userData));
    setAuthToken(token);
    setUser(userData);
  };

  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch("/api/logout", {
          method: "POST",
          headers: { "Authorization": `Bearer ${authToken}` }
        });
      } catch (err) {
        console.error(err);
      }
    }
    localStorage.removeItem("bb_token");
    localStorage.removeItem("bb_user");
    setAuthToken(null);
    setUser(null);
    setView("home");
  };

  const handleQuickAddWishlist = async (listingId: number) => {
    if (!authToken || !user) {
      alert("Please sign in to save postings to your wishlist!");
      setView("login");
      return;
    }

    try {
      const res = await fetch("/api/wishlist/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ listingId })
      });

      if (res.ok) {
        setWishlistIds(prev => 
          prev.includes(listingId) ? prev.filter(id => id !== listingId) : [...prev, listingId]
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearFilters = () => {
    setFilterState(DEFAULT_FILTERS);
  };

  // Get Latest Featured Listings for the Homepage (max 6)
  const homeFeaturedListings = listings.slice(0, 6);

  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col font-sans text-gray-900" id="basha_bazar_app">
      
      {/* Sticky Top Navbar */}
      <Navbar
        currentView={currentView}
        setView={(v) => {
          setView(v);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        user={user}
        onLogout={handleLogout}
        setFilterState={setFilterState}
      />

      {/* Main Dynamically Switched Container screens */}
      <main className="flex-1">
        
        {/* VIEW 1: HOME VIEW */}
        {currentView === "home" && (
          <div className="space-y-16 animate-in fade-in-40 duration-300" id="view_home">
            <Hero 
              setFilterState={setFilterState} 
              setView={(v) => {
                setView(v);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }} 
            />
            
            <CategoryCards 
              setFilterState={setFilterState}
              setView={(v) => {
                setView(v);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />

            {/* Featured Listings Stream */}
            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 border-t border-gray-100" id="home_featured_ads">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 flex items-center space-x-1.5">
                    <Sparkles className="h-5 w-5 text-primary-gold" />
                    <span>Featured Fresh Listings</span>
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">The most recently verified flat rentals, plots, and furniture bazar deals.</p>
                </div>

                <button
                  onClick={() => {
                    setFilterState(DEFAULT_FILTERS);
                    setView("listings");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="inline-flex items-center space-x-1 py-2 px-4 rounded-xl border border-gray-200 bg-white text-xs font-bold text-primary-green hover:border-primary-green hover:bg-primary-green-light transition"
                  id="home_view_all_btn"
                >
                  <span>Browse All Active Ads</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {loadingFeed ? (
                <div className="flex h-56 flex-col items-center justify-center space-y-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-green border-t-transparent"></div>
                  <p className="text-xs text-gray-400">Loading listings...</p>
                </div>
              ) : homeFeaturedListings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
                  <p className="text-sm font-semibold text-gray-500">No postings currently on BashaBazar.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" id="home_listings_grid">
                  {homeFeaturedListings.map(listing => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      liked={wishlistIds.includes(listing.id)}
                      onClick={() => {
                        setSelectedListingId(listing.id);
                        setView("detail");
                        window.scrollTo({ top: 0 });
                      }}
                      onWishlistToggle={(e) => {
                        e.stopPropagation();
                        handleQuickAddWishlist(listing.id);
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* VIEW 2: ALL LISTINGS VIEW WITH INTERACTIVE SEARCH & SIDEBAR FILTERS */}
        {currentView === "listings" && (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in-40 duration-300" id="view_all_listings">
            
            {/* Page Header */}
            <div className="mb-8 border-b border-gray-100 pb-5">
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">Search & Filter Marketplace</h1>
              <p className="mt-1 text-sm text-gray-500">Live dynamic listing updates as soon as filters and keywords fluctuate.</p>
            </div>

            {/* Main Listings split-column block */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              
              {/* Filter Sidebar (4 cols) */}
              <div className="lg:col-span-4" id="listings_filter_sidebar">
                <div className="sticky top-20 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
                  
                  {/* Title / Clear Button */}
                  <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                    <span className="text-sm font-extrabold text-gray-900 flex items-center space-x-2">
                      <Sliders className="h-4.5 w-4.5 text-primary-green" />
                      <span>Advanced Filters</span>
                    </span>

                    <button
                      onClick={handleClearFilters}
                      className="text-xs font-semibold text-primary-gold hover:underline"
                    >
                      Reset All
                    </button>
                  </div>

                  {/* Search Bar Input */}
                  <div>
                    <label htmlFor="filter_search" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Search Term</label>
                    <div className="relative">
                      <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        id="filter_search"
                        placeholder="Keyword: Flat, Desk, Sofa..."
                        className="w-full text-xs rounded-lg border border-gray-250 py-2.5 pr-3 pl-9 focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green placeholder-gray-400"
                        value={filterState.search}
                        onChange={(e) => setFilterState({ ...filterState, search: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Category select block */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Category Segment</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "All", value: "all" },
                        { label: "Rent", value: "rent" },
                        { label: "Sale", value: "sale" },
                        { label: "Goods", value: "furniture" }
                      ].map(catTab => (
                        <button
                          key={catTab.value}
                          onClick={() => setFilterState({ ...filterState, category: catTab.value })}
                          className={`rounded-lg py-2 text-xs font-semibold border transition capitalize ${
                            filterState.category === catTab.value
                              ? "bg-primary-green-light border-primary-green text-primary-green"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {catTab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location Area Selection */}
                  <div>
                    <label htmlFor="filter_area" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Living/Trading District</label>
                    <select
                      id="filter_area"
                      className="w-full text-xs rounded-lg border border-gray-250 bg-white p-2.5 focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green text-gray-700"
                      value={filterState.area}
                      onChange={(e) => setFilterState({ ...filterState, area: e.target.value })}
                    >
                      {AREAS.map(ar => (
                        <option key={ar.value} value={ar.value}>{ar.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price budget fields */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Price Budget (BDT Taka)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Min Taka"
                        className="w-full text-xs rounded-lg border border-gray-250 p-2 font-mono focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green placeholder-gray-400"
                        value={filterState.minPrice}
                        onChange={(e) => setFilterState({ ...filterState, minPrice: e.target.value })}
                      />
                      <input
                        type="number"
                        placeholder="Max Taka"
                        className="w-full text-xs rounded-lg border border-gray-250 p-2 font-mono focus:border-primary-green focus:outline-none focus:ring-1 focus:ring-primary-green placeholder-gray-400"
                        value={filterState.maxPrice}
                        onChange={(e) => setFilterState({ ...filterState, maxPrice: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Bedroom counters (Hidden for furniture focus) */}
                  {filterState.category !== "furniture" && (
                    <div className="border-t border-gray-50 pt-4" id="bedroom_filters">
                      <label htmlFor="filter_bedrooms" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bedrooms (BHK Count)</label>
                      <select
                        id="filter_bedrooms"
                        className="w-full text-xs rounded-lg border border-gray-250 bg-white p-2.5 focus:border-primary-green focus:outline-none"
                        value={filterState.bedrooms}
                        onChange={(e) => setFilterState({ ...filterState, bedrooms: e.target.value })}
                      >
                        <option value="all">Any BHK count</option>
                        <option value="1">1 BHK Studio / Single</option>
                        <option value="2">2 BHK Medium Accommodation</option>
                        <option value="3">3 BHK Premium Family Flat</option>
                        <option value="4">4+ BHK Luxury Penthouse</option>
                      </select>
                    </div>
                  )}

                  {/* Interactive Status Indicator helper */}
                  <div className="rounded-lg bg-gray-50 p-3 text-2xs text-gray-500 font-mono flex items-center gap-1.5 border border-gray-100">
                    <CornerRightDown className="h-3.5 w-3.5 text-primary-gold shrink-0" />
                    <span>Real-time DB polling active. On change, values sync automatically.</span>
                  </div>

                </div>
              </div>

              {/* Listings Result Grid (8 cols) */}
              <div className="lg:col-span-8 flex flex-col justify-between min-h-[400px]">
                {loadingFeed ? (
                  <div className="flex h-96 flex-col items-center justify-center space-y-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-green border-t-transparent"></div>
                    <p className="text-sm font-semibold text-gray-500">Querying active list databases...</p>
                  </div>
                ) : listings.length === 0 ? (
                  <div className="flex h-[380px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center" id="listings_empty_state">
                    <Building className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-4 text-sm font-extrabold text-gray-900 uppercase">No Marketplace Hits</h3>
                    <p className="mt-1.5 max-w-sm text-xs text-gray-500">
                      We couldn't locate active postings matching your exact selection. Try clearing terms or expanding budgets.
                    </p>
                    <button
                      onClick={handleClearFilters}
                      className="mt-6 rounded-lg bg-primary-gold px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-primary-gold-dark"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Feed Header statistics */}
                    <div className="mb-5 flex items-center justify-between text-xs text-gray-500">
                      <span>Found <strong className="text-primary-green">{listings.length} matches</strong> matching criteria.</span>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2" id="listings_grid">
                      {listings.map(item => (
                        <ListingCard
                          key={item.id}
                          listing={item}
                          liked={wishlistIds.includes(item.id)}
                          onClick={() => {
                            setSelectedListingId(item.id);
                            setView("detail");
                            window.scrollTo({ top: 0 });
                          }}
                          onWishlistToggle={(e) => {
                            e.stopPropagation();
                            handleQuickAddWishlist(item.id);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: SINGLE LISTING DETAILED VIEW */}
        {currentView === "detail" && selectedListingId && (
          <ListingDetail
            listingId={selectedListingId}
            onBack={() => setView("listings")}
            onSelectListing={(id) => {
              setSelectedListingId(id);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            user={user}
            authToken={authToken}
            liked={wishlistIds.includes(selectedListingId)}
            onWishlistToggle={fetchUserWishlist}
          />
        )}

        {/* VIEW 4: ADD LISTING FORM (SELLERS ONLY) */}
        {currentView === "add-listing" && (
          <AddListingForm
            user={user}
            authToken={authToken}
            onSuccess={() => {
              setView("dashboard");
            }}
            onBack={() => setView("home")}
          />
        )}

        {/* VIEW 5: USER WORKSPACE DASHBOARD */}
        {currentView === "dashboard" && (
          <Dashboard
            user={user}
            authToken={authToken}
            setView={setView}
            onSelectListing={(id) => {
              setSelectedListingId(id);
              setView("detail");
            }}
          />
        )}

        {/* VIEW 6: LOGIN SCREEN REGISTER VIEW */}
        {(currentView === "login" || currentView === "register") && (
          <LoginRegister
            initialMode={currentView}
            setView={setView}
            onAuthSuccess={handleAuthSuccess}
          />
        )}

      </main>

      {/* Modern, high-trust footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white py-12 text-xs text-gray-500 font-sans" id="bb_footer">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
          {/* Brand */}
          <div className="space-y-3">
            <span className="block text-sm font-black tracking-tight text-primary-green uppercase">BashaBazar <span className="text-primary-gold">BD</span></span>
            <p className="max-w-xs text-gray-400">
              Bangladesh's ultimate classifieds directory for high-efficiency house rents, properties, and quality wood furniture.
            </p>
          </div>

          {/* Quick Help */}
          <div className="space-y-2">
            <span className="block font-bold text-gray-400 uppercase tracking-widest text-[10px]">Contact Desk</span>
            <ul className="space-y-1">
              <li>📞 Direct Helpline: +880 9612 111 222</li>
              <li>✉️ Client Support: support@bashabazarbd.com</li>
              <li>📍 Corporate Office: Sector 4, Uttara, Dhaka</li>
            </ul>
          </div>

          {/* License Terms */}
          <div className="space-y-2 text-center sm:text-right">
            <span className="block font-bold text-gray-400 uppercase tracking-widest text-[10px]">Portal Stats</span>
            <p className="text-gray-400">
              Session Sync &bull; Secure Password Crypt &bull; JSON-Relational Data Core. <br />
              &copy; {new Date().getFullYear()} BashaBazar BD. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
