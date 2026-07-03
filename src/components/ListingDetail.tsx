import React, { useState, useEffect } from "react";
import { ArrowLeft, Heart, Phone, Mail, MessageSquare, Calendar, Compass, UserCheck, AlertCircle, Sparkles } from "lucide-react";
import { Listing, User, ViewType } from "../types";

interface ListingDetailProps {
  listingId: number;
  onBack: () => void;
  onSelectListing: (id: number) => void;
  user: User | null;
  authToken: string | null;
  onWishlistToggle: () => void;
  liked: boolean;
}

interface SellerDetail {
  name: string;
  phone: string;
  email: string;
}

export default function ListingDetail({
  listingId,
  onBack,
  onSelectListing,
  user,
  authToken,
  onWishlistToggle,
  liked
}: ListingDetailProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    listing: Listing;
    seller: SellerDetail;
    similar: Listing[];
    isSaved: boolean;
  } | null>(null);

  // Message Form State
  const [messageText, setMessageText] = useState("");
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    fetchListingDetails();
  }, [listingId, authToken]);

  const fetchListingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessageSuccess(null);
      setMessageError(null);

      const headers: HeadersInit = {};
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/listings/${listingId}`, { headers });
      if (!res.ok) {
        throw new Error("Could not retrieve detailed information for this listing.");
      }

      const data = await res.json();
      setDetail(data);
    } catch (err: any) {
      setError(err.message || "Failed to load details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessageError("You must sign in to send messages to this seller.");
      return;
    }

    if (!messageText.trim()) {
      setMessageError("Please enter a non-empty message text.");
      return;
    }

    try {
      setSendingMsg(true);
      setMessageError(null);
      setMessageSuccess(null);

      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          listingId,
          message: messageText
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Message sending failed.");
      }

      setMessageSuccess("Your message was sent to the seller successfully!");
      setMessageText("");
    } catch (err: any) {
      setMessageError(err.message || "Could not execute send action.");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      alert("Please login first to save listings to your wishlist!");
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
        onWishlistToggle();
        // Update local saved state representations
        if (detail) {
          setDetail({ ...detail, isSaved: !detail.isSaved });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper formatting money in BDT
  const formatBDTPrice = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 0
    }).format(value).replace("BDT", "৳");
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4" id="detail_loading">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-green border-t-transparent"></div>
        <p className="text-sm font-medium text-gray-500">Retrieving marketplace specifications...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center" id="detail_error">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-bold text-gray-900">Oops! Failed to retrieve details</h3>
        <p className="mt-2 text-sm text-gray-500">{error || "Something went wrong."}</p>
        <button
          onClick={onBack}
          className="mt-6 inline-flex items-center space-x-2 rounded-lg bg-primary-green px-4 py-2 text-sm font-semibold text-white hover:bg-primary-green-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Feed</span>
        </button>
      </div>
    );
  }

  const { listing, seller, similar, isSaved } = detail;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id={`listing_detail_page_${listing.id}`}>
      {/* Back button and quick actions header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-sm font-semibold text-gray-600 hover:text-primary-green transition"
          id="detail_back_btn"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Listings</span>
        </button>

        <button
          onClick={handleToggleWishlist}
          className={`inline-flex items-center space-x-2 rounded-sm border-2 px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
            isSaved
              ? "bg-red-50 border-red-500 text-red-600 font-extrabold"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
          id="detail_wishlist_toggle_btn"
        >
          <Heart className={`h-4.5 w-4.5 ${isSaved ? "fill-red-500 text-red-500" : "text-gray-500"}`} />
          <span>{isSaved ? "Saved" : "Save to Wishlist"}</span>
        </button>
      </div>

      {/* Main Grid: Gallery + Details / Forms */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* Left Column (8 cols): Media Gallery & Hard Descriptions */}
        <div className="lg:col-span-8 space-y-6">
          <div className="overflow-hidden rounded-sm border border-gray-200 bg-black max-h-[460px]">
            <img
              src={listing.image}
              alt={listing.title}
              className="h-full w-full object-contain max-h-[460px] mx-auto block"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800";
              }}
            />
          </div>

          {/* Listing Header Data info */}
          <div className="rounded-sm border border-gray-200 bg-white p-6 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border rounded-none ${
                listing.category === "rent" ? "bg-blue-600 text-white border-blue-600" :
                listing.category === "sale" ? "bg-emerald-600 text-white border-emerald-600" :
                "bg-amber-600 text-white border-amber-600"
              }`}>
                {listing.category === "rent" ? "Rent Market" : listing.category === "sale" ? "Property Sale" : "Furniture"}
              </span>

              {/* Status Badge */}
              {listing.status === "available" ? (
                <span className="inline-flex items-center rounded-none border border-green-500 bg-green-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-green-700">
                  Available
                </span>
              ) : (
                <span className="inline-flex items-center rounded-none border border-red-500 bg-red-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-red-700">
                  {listing.status === "rented" ? "Rented Out" : "Sold Out"}
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl font-black text-gray-900 leading-tight uppercase tracking-tight" id="detail_title">
              {listing.title}
            </h1>

            {/* Geographical details */}
            <div className="mt-3 flex items-center space-x-2 text-xs text-gray-500 font-extrabold uppercase tracking-widest">
              <Compass className="h-4.5 w-4.5 text-primary-gold shrink-0" />
              <span>{listing.location}, <strong className="text-gray-900">{listing.area}</strong></span>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-150 pt-6">
              <div>
                <span className="block text-[10px] uppercase tracking-widest text-gray-400 font-black mb-1">Offer Price</span>
                <span className="text-4xl font-black text-primary-green leading-none">
                  {formatBDTPrice(listing.price)}
                  {listing.category === "rent" && <span className="text-sm font-bold text-gray-400 uppercase tracking-widest"> / Mo</span>}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-gray-50 border border-gray-150 px-3.5 py-2 rounded-none">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Posted: {new Date(listing.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
            </div>
          </div>

          {/* Property Specifications Grid (If house/apartment) */}
          {(listing.category === "rent" || listing.category === "sale") && (
            <div className="rounded-sm border border-gray-200 bg-white p-6 shadow-xs" id="detail_specs_card">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#c8922a] border-b border-gray-150 pb-3 mb-4">Property Features</h3>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-none border border-gray-200 bg-gray-50 p-4 text-center">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Bedrooms</span>
                  <span className="mt-1 block text-lg font-black text-gray-950 uppercase">{listing.bedrooms} BHK</span>
                </div>
                <div className="rounded-none border border-gray-200 bg-gray-50 p-4 text-center">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Bathrooms</span>
                  <span className="mt-1 block text-lg font-black text-gray-950 uppercase">{listing.bathrooms} Toilet</span>
                </div>
                <div className="rounded-none border border-gray-200 bg-gray-50 p-4 text-center">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Listing Type</span>
                  <span className="mt-1 block text-sm font-black uppercase text-gray-950">{listing.category}al</span>
                </div>
                <div className="rounded-none border border-gray-200 bg-gray-50 p-4 text-center">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Sector Location</span>
                  <span className="mt-1 block text-xs font-black truncate text-gray-950 uppercase">{listing.area.split(",")[0]}</span>
                </div>
              </div>
            </div>
          )}

          {/* Full Detailed Description */}
          <div className="rounded-sm border border-gray-200 bg-white p-6 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#c8922a] border-b border-gray-150 pb-3 mb-4">Listing Description</h3>
            <p className="mt-4 whitespace-pre-line text-sm text-gray-700 leading-relaxed font-medium" id="detail_description">
              {listing.description}
            </p>
          </div>
        </div>

        {/* Right Column (4 cols): Seller Bio & Chat Messenger panel */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Seller Bio Card */}
          <div className="rounded-sm border border-gray-200 bg-white p-6 shadow-xs">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#c8922a] border-b border-gray-150 pb-2 mb-4">Seller Information</h3>
            
            <div className="mt-4 flex items-center space-x-3.5 border-b border-gray-150 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-none bg-primary-green text-white font-black text-xl shadow-sm">
                {seller.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-black text-gray-900 uppercase text-sm tracking-tight">{seller.name}</h4>
                <div className="flex items-center space-x-1 text-[9px] text-primary-green font-black uppercase tracking-wider">
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Verified BashaBazar Partner</span>
                </div>
              </div>
            </div>

            {/* Direct Contacts Block */}
            <div className="mt-4 space-y-3.5">
              <div className="flex items-center space-x-3 text-sm text-gray-700">
                <div className="rounded-none bg-gray-50 border border-gray-150 p-2 text-primary-gold">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Call Seller</span>
                  {authToken ? (
                    <a href={`tel:${seller.phone}`} className="font-mono font-black hover:underline text-gray-900">
                      {seller.phone}
                    </a>
                  ) : (
                    <span className="text-xs text-gray-500 italic">Sign in to view phone number</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 text-sm text-gray-700">
                <div className="rounded-none bg-gray-50 border border-gray-150 p-2 text-primary-gold">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Email Address</span>
                  {authToken ? (
                    <span className="font-bold text-gray-900 break-all">{seller.email}</span>
                  ) : (
                    <span className="text-xs text-gray-500 italic">Sign in to view email</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Send Message Form Interface */}
          <div className="rounded-sm border border-gray-200 bg-white p-6 shadow-xs" id="detail_contact_form_card">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center space-x-1.5 border-b border-gray-150 pb-3 mb-4">
              <MessageSquare className="h-4.5 w-4.5 text-primary-green" />
              <span>Contact Seller Directly</span>
            </h3>

            {user?.id === listing.userId ? (
              <div className="mt-4 rounded-none bg-amber-50 p-4 border border-amber-200 text-xs text-amber-850 leading-relaxed font-bold uppercase tracking-wide">
                You own this listing. Users can contact you, but you cannot message your own advertisement.
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="mt-4 space-y-4">
                {messageSuccess && (
                  <div className="rounded-none bg-green-50 p-3 text-xs font-black uppercase tracking-wider border border-green-500 text-green-700">
                    {messageSuccess}
                  </div>
                )}
                {messageError && (
                  <div className="rounded-none bg-red-50 p-3 text-xs font-black uppercase tracking-wider border border-red-500 text-red-700">
                    {messageError}
                  </div>
                )}

                <div>
                  <label htmlFor="detail_msg_textarea" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Your Message</label>
                  <textarea
                    id="detail_msg_textarea"
                    rows={4}
                    placeholder="Ask about availability, negotiation or physical inspections (e.g. Assalamu Alaikum, is this flat still available?)"
                    className="w-full rounded-none border-2 border-gray-200 p-2 text-xs focus:border-primary-green focus:outline-none placeholder-gray-300 font-medium"
                    disabled={!user}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  ></textarea>
                </div>

                {user ? (
                  <button
                    type="submit"
                    disabled={sendingMsg}
                    className="w-full flex items-center justify-center space-x-1.5 rounded-none bg-primary-gold border-2 border-primary-gold py-3 text-xs font-black uppercase tracking-widest text-white shadow-md hover:brightness-110 transition disabled:opacity-50"
                  >
                    {sendingMsg ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="text-center bg-gray-50 p-4 rounded-none border border-gray-150">
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">Sign in to contact this seller</p>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Similar Listings Panel */}
      {similar && similar.length > 0 && (
        <div className="mt-16 pt-10 border-t border-gray-200" id="detail_similar_listings_panel">
          <div className="flex items-center space-x-1.5 mb-6">
            <Sparkles className="h-5 w-5 text-primary-gold" />
            <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900">Similar Listings You May Like</h3>
          </div>
          
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 font-sans">
            {similar.map((simListing) => (
              <div 
                key={simListing.id}
                onClick={() => onSelectListing(simListing.id)}
                className="group cursor-pointer overflow-hidden rounded-sm border border-gray-200 bg-white hover:border-primary-green hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={simListing.image}
                    alt={simListing.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 bg-black/70 rounded-none px-2.5 py-1 text-[9px] font-black text-white uppercase tracking-wider">
                    {simListing.category}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="block text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">{simListing.area}</span>
                    <h4 className="mt-1 font-black text-gray-900 line-clamp-1 group-hover:text-primary-green text-xs transition duration-200 uppercase tracking-tight">
                      {simListing.title}
                    </h4>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between border-t border-gray-150 pt-3 text-xs">
                    <span className="font-extrabold text-primary-green font-mono">{formatBDTPrice(simListing.price)}</span>
                    <span className="font-black text-primary-gold uppercase text-[10px] tracking-widest">Inspect &rarr;</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
