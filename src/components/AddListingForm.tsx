import React, { useState, useRef } from "react";
import { PlusCircle, Image as ImageIcon, MapPin, BedDouble, Bath, FileText, CheckCircle, AlertCircle, Sparkles, Building } from "lucide-react";
import { User, ListingCategory } from "../types";

interface AddListingFormProps {
  user: User | null;
  authToken: string | null;
  onSuccess: () => void;
  onBack: () => void;
}

export default function AddListingForm({ user, authToken, onSuccess, onBack }: AddListingFormProps) {
  const [category, setCategory] = useState<ListingCategory>("rent");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("Uttara, Dhaka");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  
  // Image states
  const [image64, setImage64] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status indicators
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields Validation Error State
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Popular Bangladesh Area selectors for ease of use
  const BANGLADESH_AREAS = [
    "Uttara, Dhaka",
    "Dhanmondi, Dhaka",
    "Gulshan, Dhaka",
    "Banani, Dhaka",
    "Mirpur, Dhaka",
    "Bashundhara R/A, Dhaka",
    "Mohakhali, Dhaka",
    "Badda, Dhaka",
    "Khilgaon, Dhaka",
    "Halishahar, Chattogram",
    "Chawkbazar, Chattogram",
    "Sylhet Sadar, Sylhet",
    "Khulna Town, Khulna",
    "Rajshahi Sadar, Rajshahi"
  ];

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center" id="add_listing_no_user">
        <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
        <h3 className="mt-4 text-lg font-bold text-gray-900">Sign In Required</h3>
        <p className="mt-2 text-sm text-gray-500">You must login to a seller account to post listings on BashaBazar BD.</p>
      </div>
    );
  }

  if (user.role !== "seller") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center" id="add_listing_unauthorized">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <Building className="h-7 w-7" />
        </div>
        <h3 className="mt-6 text-xl font-extrabold text-gray-900 tracking-tight">Active Seller Account Required</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
          Your account role is marked as <strong>Buyer</strong>. Buyers can browse, saved wishlists, and message sellers, but cannot submit classified advertisements.
        </p>
        <button
          onClick={onBack}
          className="mt-6 rounded-lg bg-primary-green px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-green-dark"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const handleImageFile = (file: File) => {
    setImageError(null);
    if (!file.type.startsWith("image/")) {
      setImageError("Please select a valid image file (.png, .jpg, .jpeg, .webp).");
      return;
    }
    // Limit to 5MB client-side
    if (file.size > 5 * 1024 * 1024) {
      setImageError("File is too large. Image size must be smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage64(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim() || title.length < 5) {
      newErrors.title = "Title must be at least 5 character-length long.";
    } else if (title.length > 150) {
      newErrors.title = "Title cannot exceed 150 characters.";
    }

    if (!description.trim() || description.length < 15) {
      newErrors.description = "Please write a comprehensive description (minimum 15 characters).";
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      newErrors.price = "Enter a valid positive BDT pricing amount.";
    }

    if (!location.trim()) {
      newErrors.location = "Provide details physical street location or sector info.";
    }

    if (category !== "furniture") {
      const beds = parseInt(bedrooms, 10);
      if (isNaN(beds) || beds < 0) {
        newErrors.bedrooms = "Bedrooms count is required.";
      }
      const baths = parseInt(bathrooms, 10);
      if (isNaN(baths) || baths < 0) {
        newErrors.bathrooms = "Bathrooms count is required.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const payload = {
        category,
        title,
        description,
        price,
        location,
        area,
        bedrooms: category === "furniture" ? 0 : bedrooms,
        bathrooms: category === "furniture" ? 0 : bathrooms,
        image: image64
      };

      const res = await fetch("/api/listings/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to publish advertisement.");
      }

      setSuccessMsg("Your advertisement has been published successfully on BashaBazar BD!");
      
      // Delay and trigger successfully callback
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 font-sans" id="add_listing_page_box">
      <div className="border-b border-gray-200 pb-5">
        <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900">Post an Ad</h2>
        <p className="mt-1.5 text-[10px] font-black uppercase tracking-widest text-[#c8922a]">Reach thousands of interested local buyers and renters in Bangladesh.</p>
      </div>

      <form onSubmit={handleFormSubmit} className="mt-8 space-y-8" id="add_listing_form">
        
        {successMsg && (
          <div className="rounded-none bg-green-50 p-4 border-2 border-green-500 text-xs font-black uppercase tracking-wider text-green-700 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-none bg-red-50 p-4 border-2 border-red-500 text-xs font-black uppercase tracking-wider text-red-700 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Category and Area */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="form_category" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Category Selector</label>
            <select
              id="form_category"
              className="w-full rounded-none border-2 border-gray-200 bg-white p-2.5 text-xs font-bold uppercase tracking-wider focus:border-primary-green focus:outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value as ListingCategory)}
            >
              <option value="rent">Flat/House Rent</option>
              <option value="sale">Property/Land Sale</option>
              <option value="furniture">Furniture Bazar</option>
            </select>
          </div>

          <div>
            <label htmlFor="form_area" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Bazar District/Area</label>
            <select
              id="form_area"
              className="w-full rounded-none border-2 border-gray-200 bg-white p-2.5 text-xs font-bold uppercase tracking-wider focus:border-primary-green focus:outline-none"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              {BANGLADESH_AREAS.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Title and Price */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-12">
          <div className="sm:col-span-8">
            <label htmlFor="form_title" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Title of Listing</label>
            <input
              type="text"
              id="form_title"
              placeholder="e.g. LUXURIOUS 3 BHK FLAT NEAR LAKE OR CHITTAGONG TEAK WOOD WARDROBE"
              className={`w-full rounded-none border-2 p-2.5 text-xs font-bold uppercase placeholder-gray-300 focus:outline-none focus:border-primary-green ${
                errors.title ? "border-red-500" : "border-gray-200"
              }`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && <p className="mt-1.5 text-[10px] text-red-500 font-bold uppercase tracking-wide">{errors.title}</p>}
          </div>

          <div className="sm:col-span-4">
            <label htmlFor="form_price" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Price (BDT ৳)</label>
            <input
              type="number"
              id="form_price"
              placeholder="Amount in Taka"
              className={`w-full rounded-none border-2 p-2.5 text-xs font-mono font-bold placeholder-gray-300 focus:outline-none focus:border-primary-green ${
                errors.price ? "border-red-500" : "border-gray-200"
              }`}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            {errors.price && <p className="mt-1.5 text-[10px] text-red-500 font-bold uppercase tracking-wide">{errors.price}</p>}
          </div>
        </div>

        {/* 3. Detailed Description */}
        <div>
          <label htmlFor="form_description" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Comprehensive Description</label>
          <textarea
            id="form_description"
            rows={5}
            placeholder="Introduce details about your property floor, fittings, backup electricity, building security or details about furniture condition, wood material, dimensions etc."
            className={`w-full rounded-none border-2 p-2.5 text-xs font-medium placeholder-gray-300 focus:outline-none focus:border-primary-green ${
              errors.description ? "border-red-500" : "border-gray-200"
            }`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
          {errors.description && <p className="mt-1.5 text-[10px] text-red-500 font-bold uppercase tracking-wide">{errors.description}</p>}
        </div>

        {/* 4. Specifications (Hidden for furniture category) */}
        {category !== "furniture" && (
          <div className="rounded-none border border-gray-200 bg-gray-50 p-5 space-y-4" id="form_property_specs">
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center space-x-1.5 border-b border-gray-150 pb-2 mb-4">
              <Building className="h-4.5 w-4.5 text-primary-gold" />
              <span>Flat / Property Parameters</span>
            </h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="form_bedrooms" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Number of Bedrooms</label>
                <input
                  type="number"
                  id="form_bedrooms"
                  placeholder="e.g. 3"
                  className={`w-full rounded-none border-2 bg-white p-2.5 text-xs focus:outline-none focus:border-primary-green ${
                    errors.bedrooms ? "border-red-500" : "border-gray-200"
                  }`}
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                />
                {errors.bedrooms && <p className="mt-1.5 text-[10px] text-red-500 font-bold uppercase tracking-wide">{errors.bedrooms}</p>}
              </div>

              <div>
                <label htmlFor="form_bathrooms" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Number of Bathrooms</label>
                <input
                  type="number"
                  id="form_bathrooms"
                  placeholder="e.g. 2"
                  className={`w-full rounded-none border-2 bg-white p-2.5 text-xs focus:outline-none focus:border-primary-green ${
                    errors.bathrooms ? "border-red-500" : "border-gray-200"
                  }`}
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                />
                {errors.bathrooms && <p className="mt-1.5 text-[10px] text-red-500 font-bold uppercase tracking-wide">{errors.bathrooms}</p>}
              </div>
            </div>
          </div>
        )}

        {/* 5. Physical Address */}
        <div>
          <label htmlFor="form_location" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Street Address Location</label>
          <div className="relative">
            <MapPin className="absolute top-3.5 left-3.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              id="form_location"
              placeholder="e.g. House 45, Road 15/A, Dhanmondi"
              className={`w-full rounded-none border-2 py-2.5 pr-4 pl-10 text-xs uppercase font-bold placeholder-gray-300 focus:outline-none focus:border-primary-green ${
                errors.location ? "border-red-500" : "border-gray-200"
              }`}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          {errors.location && <p className="mt-1.5 text-[10px] text-red-500 font-bold uppercase tracking-wide">{errors.location}</p>}
        </div>

        {/* 6. Drag & Drop Image Upload with preview */}
        <div>
          <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Upload Display Photo</span>
          
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-none border-2 border-dashed p-8 text-center cursor-pointer transition ${
              isDragOver ? "border-primary-green bg-green-50/50" : "border-gray-200 bg-white hover:bg-gray-50"
            }`}
            id="form_image_dropzone"
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageFile(e.target.files[0]);
                }
              }}
            />

            {image64 ? (
              <div className="relative group w-full max-w-sm rounded-none overflow-hidden border border-gray-150">
                <img
                  src={image64}
                  alt="Upload preview"
                  className="h-44 w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <span className="rounded-none bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-650 hover:bg-neutral-100">
                    Change Image
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-none bg-primary-green text-white">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs uppercase font-extrabold text-gray-800 tracking-wider">Drag & Drop image here, or <span>browse files</span></span>
                  <p className="mt-1 text-[9px] text-gray-400 uppercase tracking-widest font-bold">PNG, JPG, JPEG, WEBP files up to 5MB are supported.</p>
                </div>
              </div>
            )}
          </div>
          
          {imageError && <p className="mt-1.5 text-xs text-red-500 font-bold tracking-wide uppercase">{imageError}</p>}
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end space-x-4 border-t border-gray-150 pt-6">
          <button
            type="button"
            onClick={onBack}
            className="rounded-none border-2 border-gray-200 px-6 py-3 text-xs font-black uppercase tracking-widest text-gray-700 hover:bg-neutral-50 transition cursor-pointer"
            disabled={submitting}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center space-x-2 rounded-none bg-primary-green border-2 border-primary-green px-8 py-3 text-xs font-black uppercase tracking-widest text-white shadow-md hover:bg-neutral-800 hover:border-neutral-800 transition disabled:opacity-50 cursor-pointer"
            id="form_submit_btn"
          >
            {submitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            ) : (
              <>
                <PlusCircle className="h-4.5 w-4.5" />
                <span>Publish Ad</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
