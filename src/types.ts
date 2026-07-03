export type UserRole = "buyer" | "seller";
export type ListingCategory = "rent" | "sale" | "furniture";
export type ListingStatus = "available" | "sold" | "rented";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface Listing {
  id: number;
  userId: number;
  category: ListingCategory;
  title: string;
  description: string;
  price: number;
  location: string;
  area: string;
  bedrooms: number;
  bathrooms: number;
  image: string;
  status: ListingStatus;
  createdAt: string;
}

export interface Wishlist {
  id: number;
  userId: number;
  listingId: number;
  savedAt: string;
}

export interface Message {
  id: number;
  senderId: number;
  listingId: number;
  message: string;
  sentAt: string;
  senderName?: string;
  senderPhone?: string;
  listingTitle?: string;
}

export type ViewType = 
  | "home"
  | "listings"
  | "detail"
  | "add-listing"
  | "dashboard"
  | "login"
  | "register";

export interface FilterState {
  category: string;
  area: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  search: string;
}
