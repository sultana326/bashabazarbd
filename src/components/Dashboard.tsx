import React, { useState, useEffect } from "react";
import { List, Heart, MessageCircle, AlertCircle, Trash2, Key, ToggleLeft, Edit3, CheckCircle, ExternalLink, PhoneCall } from "lucide-react";
import { User, Listing, Message, ListingStatus } from "../types";

interface DashboardProps {
  user: User | null;
  authToken: string | null;
  setView: (v: any) => void;
  onSelectListing: (id: number) => void;
}

export default function Dashboard({ user, authToken, setView, onSelectListing }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"listings" | "wishlist" | "messages">("listings");
  
  // Data States
  const [listings, setListings] = useState<Listing[]>([]);
  const [wishlist, setWishlist] = useState<Listing[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Edit / Status state management
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editStatus, setEditStatus] = useState<ListingStatus>("available");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Set default tab based on role
    if (user.role === "buyer") {
      setActiveTab("wishlist");
    } else {
      setActiveTab("listings");
    }
  }, [user]);

  useEffect(() => {
    if (user && authToken) {
      fetchDashboardData();
    }
  }, [activeTab, user, authToken]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const headers = {
        "Authorization": `Bearer ${authToken}`
      };

      if (activeTab === "listings" && user?.role === "seller") {
        const res = await fetch("/api/user/listings", { headers });
        if (res.ok) {
          const data = await res.json();
          setListings(data);
        } else {
          throw new Error("Could not retrieve your listings.");
        }
      } else if (activeTab === "wishlist") {
        const res = await fetch("/api/wishlist", { headers });
        if (res.ok) {
          const data = await res.json();
          setWishlist(data);
        } else {
          throw new Error("Could not retrieve your saved wishlist.");
        }
      } else if (activeTab === "messages") {
        const res = await fetch("/api/messages", { headers });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        } else {
          throw new Error("Could not retrieve messages.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sync dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteListing = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this listing from BashaBazar?")) {
      return;
    }

    try {
      setErrorMsg(null);
      setActionSuccess(null);
      const res = await fetch(`/api/listings/delete/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });

      if (!res.ok) {
        throw new Error("Failed to delete listing.");
      }

      setActionSuccess("Listing deleted successfully.");
      setListings(prev => prev.filter(l => l.id !== id));
    } catch (err: any) {
      setErrorMsg(err.message || "Could not delete listing.");
    }
  };

  const handleOpenEdit = (listing: Listing) => {
    setEditingListing(listing);
    setEditPrice(listing.price.toString());
    setEditStatus(listing.status);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;

    try {
      setUpdating(true);
      setErrorMsg(null);
      setActionSuccess(null);

      const res = await fetch(`/api/listings/edit/${editingListing.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          price: parseFloat(editPrice),
          status: editStatus
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Update operation failed.");
      }

      setActionSuccess("Listing updated successfully!");
      setEditingListing(null);
      
      // Sync list
      fetchDashboardData();
    } catch (err: any) {
      setErrorMsg(err.message || "Could not update listing.");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveWishlist = async (listingId: number) => {
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
        setWishlist(prev => prev.filter(w => w.id !== listingId));
        setActionSuccess("Saved item removed from Wishlist.");
      } else {
        throw new Error("Could not toggle wishlist state.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Action failed.");
    }
  };

  // Format Helper
  const formatBDTPrice = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 0
    }).format(value).replace("BDT", "৳");
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center font-sans" id="dashboard_no_user">
        <AlertCircle className="mx-auto h-12 w-12 text-[#c8922a]" />
        <h3 className="mt-4 text-xs font-black uppercase tracking-widest text-[#1a6b3c]">Authentication Required</h3>
        <p className="mt-2 text-xs text-gray-500 font-medium">Please sign in to access your user dashboard.</p>
        <button
          onClick={() => setView("login")}
          className="mt-6 rounded-none bg-[#1a6b3c] border-2 border-[#1a6b3c] px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-neutral-900 hover:border-neutral-900 transition cursor-pointer"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 font-sans" id="dashboard_box">
      
      {/* Header Profile Title section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b-2 border-gray-200 pb-5" id="dashboard_profile_header">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#111111] flex items-center gap-1.5 uppercase leading-tight">
            <span>Welcome,</span>
            <span className="text-[#1a6b3c]">{user.name}</span>
          </h2>
          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[#c8922a]">
            Account Type: <strong className="text-gray-900">{user.role}</strong> &bull; Contact: <strong className="text-gray-900">{user.phone}</strong> &bull; Email: <strong className="text-gray-900">{user.email}</strong>
          </p>
        </div>

        {/* If user is a seller, offer quick listing creation */}
        {user.role === "seller" && (
          <button
            onClick={() => setView("add-listing")}
            className="mt-4 md:mt-0 flex items-center space-x-1.5 rounded-none bg-[#1a6b3c] border-2 border-[#1a6b3c] px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:bg-neutral-805 hover:border-neutral-805 transition cursor-pointer"
          >
            <span>+ Add New Ad</span>
          </button>
        )}
      </div>

      {/* Main Tab Controller Grid bar */}
      <div className="mt-8 flex border-b-2 border-gray-200 gap-1 overflow-x-auto scroller-hidden">
        {user.role === "seller" && (
          <button
            onClick={() => setActiveTab("listings")}
            className={`flex items-center space-x-1.5 border-b-2 py-3 px-5 text-[10px] font-black uppercase tracking-widest transition whitespace-nowrap rounded-none cursor-pointer ${
              activeTab === "listings"
                ? "border-primary-green text-primary-green bg-green-50"
                : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-250"
            }`}
            id="tab_my_listings"
          >
            <List className="h-4 w-4" />
            <span>My Listed Bazar Ads ({listings.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("wishlist")}
          className={`flex items-center space-x-1.5 border-b-2 py-3 px-5 text-[10px] font-black uppercase tracking-widest transition whitespace-nowrap rounded-none cursor-pointer ${
            activeTab === "wishlist"
              ? "border-primary-green text-primary-green bg-green-50"
              : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-250"
          }`}
          id="tab_my_wishlist"
        >
          <Heart className="h-4 w-4" />
          <span>My Wishlist ({wishlist.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("messages")}
          className={`flex items-center space-x-1.5 border-b-2 py-3 px-5 text-[10px] font-black uppercase tracking-widest transition whitespace-nowrap rounded-none cursor-pointer ${
            activeTab === "messages"
              ? "border-primary-green text-primary-green bg-green-50"
              : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-250"
          }`}
          id="tab_my_messages"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Bazar Messages ({messages.length})</span>
        </button>
      </div>

      {/* Alert Feeders */}
      {actionSuccess && (
        <div className="mt-6 rounded-none bg-green-50 p-3.5 border-2 border-green-500 text-xs font-black uppercase tracking-wider text-green-700">
          {actionSuccess}
        </div>
      )}
      {errorMsg && (
        <div className="mt-6 rounded-none bg-red-50 p-3.5 border-2 border-red-500 text-xs font-black uppercase tracking-wider text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Loading section */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center space-y-4" id="dashboard_tab_loading">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-green border-t-transparent"></div>
          <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Syncing your data segments...</p>
        </div>
      ) : (
        <div className="mt-6" id="dashboard_tab_content">
          
          {/* TAB 1: My Listings (Sellers Only) */}
          {activeTab === "listings" && user?.role === "seller" && (
            listings.length === 0 ? (
              <div className="rounded-none border-2 border-dashed border-gray-200 bg-white p-12 text-center">
                <List className="mx-auto h-10 w-10 text-gray-300" />
                <h3 className="mt-4 text-xs font-black uppercase tracking-widest text-[#1a6b3c]">No Advertisements Submitted</h3>
                <p className="mt-2 text-xs text-gray-500 font-medium">You haven't posted any rental properties, lands or goods yet.</p>
                <button
                  onClick={() => setView("add-listing")}
                  className="mt-6 inline-flex items-center space-x-1 border-2 border-primary-green rounded-none bg-primary-green px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-xs hover:bg-neutral-800"
                >
                  Post Your First Ad
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-none border-2 border-gray-200 bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#1a6b3c] font-black text-white border-b-2 border-gray-900 uppercase">
                    <tr>
                      <th className="p-4 text-[10px] tracking-widest font-black">Item Details</th>
                      <th className="p-4 text-[10px] tracking-widest font-black">Category</th>
                      <th className="p-3 text-[10px] tracking-widest font-black">Price (BDT)</th>
                      <th className="p-4 text-[10px] tracking-widest font-black">Listing Status</th>
                      <th className="p-4 text-right text-[10px] tracking-widest font-black">Settings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 font-sans text-gray-700">
                    {listings.map(l => (
                      <tr key={l.id} className="hover:bg-neutral-50">
                        {/* Title and image details */}
                        <td className="p-4">
                          <div className="flex items-center space-x-3.5">
                            <img
                              src={l.image}
                              alt={l.title}
                              className="h-12 w-12 rounded-none object-cover border border-gray-200"
                            />
                            <div>
                              <button 
                                onClick={() => onSelectListing(l.id)}
                                className="font-black text-gray-900 hover:text-primary-green hover:underline text-left text-xs uppercase tracking-tight"
                              >
                                {l.title}
                              </button>
                              <span className="block text-[9px] text-[#c8922a] font-extrabold uppercase tracking-widest">{l.area} &bull; {l.location}</span>
                            </div>
                          </div>
                        </td>

                        {/* Category tag info */}
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 font-black uppercase text-[9px] border rounded-none ${
                            l.category === "rent" ? "bg-blue-600 text-white border-blue-600" :
                            l.category === "sale" ? "bg-emerald-600 text-white border-emerald-600" :
                            "bg-amber-600 text-white border-amber-600"
                          }`}>
                            {l.category}
                          </span>
                        </td>

                        {/* Money figures */}
                        <td className="p-3 font-mono font-black text-neutral-900 text-xs">
                          {formatBDTPrice(l.price)}
                        </td>

                        {/* Interactive listing status available/sold/rented */}
                        <td className="p-4">
                          {l.status === "available" ? (
                            <span className="inline-flex rounded-none bg-green-50 px-2 py-0.5 text-[9px] font-black text-green-700 border border-green-500 uppercase tracking-widest">Available</span>
                          ) : (
                            <span className="inline-flex rounded-none bg-red-50 px-2 py-0.5 text-[9px] font-black text-red-700 border border-red-500 uppercase tracking-widest">
                              {l.status === "rented" ? "Rented" : "Sold"}
                            </span>
                          )}
                        </td>

                        {/* Actions menu list */}
                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEdit(l)}
                            className="rounded-none border border-gray-200 p-1.5 text-gray-650 hover:bg-[#1a6b3c] hover:text-white transition cursor-pointer"
                            title="Quick Edit (Price & Status)"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteListing(l.id)}
                            className="rounded-none border border-red-200 p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
                            title="Delete Permanently"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* TAB 2: My Wishlist (Saved posts check) */}
          {activeTab === "wishlist" && (
            wishlist.length === 0 ? (
              <div className="rounded-none border-2 border-dashed border-gray-200 bg-white p-12 text-center" id="empty_wishlist">
                <Heart className="mx-auto h-10 w-10 text-gray-300" />
                <h3 className="mt-4 text-xs font-black uppercase tracking-widest text-[#1a6b3c]">Wishlist is Empty</h3>
                <p className="mt-2 text-xs text-gray-500 font-medium">Save houses, properties and listings as files while browsing.</p>
                <button
                  onClick={() => setView("listings")}
                  className="mt-6 inline-flex items-center rounded-none border-2 border-primary-green bg-primary-green px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-neutral-900"
                >
                  Browse Marketplace
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" id="wishlist_listings_grid">
                {wishlist.map(wItem => (
                  <div 
                    key={wItem.id} 
                    className="group relative flex flex-col justify-between overflow-hidden rounded-none border-2 border-gray-200 bg-white shadow-xs hover:border-primary-green hover:shadow-md transition-all duration-300"
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-gray-100 font-sans">
                      <img
                        src={wItem.image}
                        alt={wItem.title}
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                      />
                      <button
                        onClick={() => handleRemoveWishlist(wItem.id)}
                        className="absolute top-2.5 right-2.5 bg-white p-1.5 rounded-none border border-gray-200 text-red-500 shadow-md hover:scale-110 active:scale-95 hover:bg-red-50 transition cursor-pointer"
                        title="Remove from Saved List"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] text-[#c8922a] font-extrabold uppercase tracking-widest">{wItem.area}</span>
                        <h4 
                          onClick={() => onSelectListing(wItem.id)}
                          className="font-black text-xs text-gray-800 line-clamp-1 cursor-pointer hover:text-primary-green transition uppercase tracking-tight"
                        >
                          {wItem.title}
                        </h4>
                      </div>

                      <div className="mt-4 border-t border-gray-200 pt-3 flex items-center justify-between">
                        <span className="font-extrabold text-primary-green font-mono text-xs">{formatBDTPrice(wItem.price)}</span>
                        <button
                          onClick={() => onSelectListing(wItem.id)}
                          className="flex items-center space-x-1 text-[9px] font-black uppercase tracking-widest text-primary-gold hover:underline cursor-pointer"
                        >
                          <span>Open Ad</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB 3: Messages Box (Inbox dialogues) */}
          {activeTab === "messages" && (
            messages.length === 0 ? (
              <div className="rounded-none border-2 border-dashed border-gray-200 bg-white p-12 text-center" id="empty_messages">
                <MessageCircle className="mx-auto h-10 w-10 text-gray-300" />
                <h3 className="mt-4 text-xs font-black uppercase tracking-widest text-[#1a6b3c]">Inbox is empty</h3>
                <p className="mt-2 text-xs text-gray-500 font-medium font-sans">Queries or client communication cards will register here in real-time.</p>
              </div>
            ) : (
              <div className="space-y-4" id="messages_list_container font-sans">
                {messages.map(msg => (
                  <div 
                    key={msg.id} 
                    className="rounded-none border-2 border-gray-200 bg-white p-5 shadow-xs hover:border-primary-green transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-150 pb-3 gap-2">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#c8922a]">Conversation Identity</span>
                        <h4 className="font-black text-gray-900 text-xs flex items-center gap-1.5 uppercase tracking-tight">
                          <span>{msg.senderName}</span>
                          <span className="text-[10px] font-bold text-gray-400">({msg.senderId === user.id ? "Sent by You" : "Sender"})</span>
                        </h4>
                      </div>

                      {msg.senderPhone && msg.senderPhone !== "N/A" && (
                        <a 
                          href={`tel:${msg.senderPhone}`}
                          className="self-start sm:self-center inline-flex items-center space-x-1.5 rounded-none bg-primary-green border-2 border-primary-green px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-neutral-800 hover:border-neutral-800 transition"
                        >
                          <PhoneCall className="h-3.5 w-3.5" />
                          <span>Call Partner</span>
                        </a>
                      )}
                    </div>

                    <div className="mt-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Context Listing / Ad</span>
                      <p className="font-black text-xs text-gray-900 hover:text-[#1a6b3c] transition cursor-pointer uppercase tracking-tight">
                        {msg.listingTitle}
                      </p>
                    </div>

                    <div className="mt-3 bg-neutral-50 rounded-none p-3.5 border border-gray-150 text-xs text-gray-600 italic">
                      "{msg.message}"
                    </div>

                    <div className="mt-3 text-right text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      Date Sent: {new Date(msg.sentAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

        </div>
      )}

      {/* QUICK FLOATING EDIT DIALOG MODAL PANEL */}
      {editingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" id="edit_listing_modal">
          <div className="w-full max-w-md rounded-none border-2 border-gray-900 bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 font-sans">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#c8922a] border-b border-gray-150 pb-3 mb-4 flex items-center gap-1.5">
              <Edit3 className="h-5 w-5 text-primary-green" />
              <span>Update Ad Details</span>
            </h3>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">Update pricing and availability constraints for: <strong>{editingListing.title}</strong></p>

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="edit_price_val" className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Adjust Price (BDT Taka)</label>
                <input
                  type="number"
                  id="edit_price_val"
                  className="w-full rounded-none border-2 border-gray-200 p-2 text-xs font-mono font-bold focus:border-primary-green"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="edit_status_val" className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Status Classifier</label>
                <select
                  id="edit_status_val"
                  className="w-full rounded-none border-2 border-gray-200 bg-white p-2 text-xs font-bold uppercase tracking-wider focus:border-primary-green"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ListingStatus)}
                >
                  <option value="available">Available (Post active on bazar feed)</option>
                  {editingListing.category === "rent" ? (
                    <option value="rented">Rented Out (Mark flat as booked)</option>
                  ) : (
                    <option value="sold">Sold Out (Mark property/item as traded)</option>
                  )}
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end space-x-3 border-t border-gray-150 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="rounded-none border-2 border-gray-200 px-5 py-2 text-xs font-black uppercase tracking-widest text-gray-700 hover:bg-neutral-100 transition cursor-pointer"
                  disabled={updating}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="rounded-none bg-[#1a6b3c] border-2 border-[#1a6b3c] px-5 py-2 text-xs font-black uppercase tracking-widest text-white shadow-md hover:bg-neutral-800 transition flex items-center space-x-1 cursor-pointer"
                  disabled={updating}
                  id="edit_modal_save_btn"
                >
                  {updating ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
