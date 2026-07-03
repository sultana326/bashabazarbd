import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// ─── Types & Enums ───────────────────────────────────────────────────────────
export type UserRole = "buyer" | "seller";
export type ListingCategory = "rent" | "sale" | "furniture";
export type ListingStatus = "available" | "sold" | "rented";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

export interface Listing {
  id: number;
  userId: number;
  category: ListingCategory;
  title: string;
  description: string;
  price: number;
  location: string;
  area: string;      // maps to `city` in SQL
  bedrooms: number;
  bathrooms: number; // not in SQL, always 0
  image: string;     // first image from `images` table
  status: ListingStatus;
  createdAt: string;
}

export interface Message {
  id: number;
  senderId: number;
  listingId: number;
  message: string;
  sentAt: string;
}

// ─── MySQL Connection Pool ────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || "localhost",
  port:     parseInt(process.env.DB_PORT || "3306"),
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "bashabazar",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+00:00",
});

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log("✅ MySQL connected successfully to database:", process.env.DB_NAME || "bashabazar");
    conn.release();
  })
  .catch(err => {
    console.error("❌ MySQL connection failed:", err.message);
    console.error("   Check your .env file: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME");
  });

// ─── Category & Status Mapping ────────────────────────────────────────────────
// SQL uses: house_rent / property_sale / furniture  and  active / sold / rented
// JS uses:  rent       / sale           / furniture  and  available / sold / rented

function sqlCatToJs(sqlCat: string): ListingCategory {
  if (sqlCat === "house_rent")    return "rent";
  if (sqlCat === "property_sale") return "sale";
  return "furniture";
}

function jsCatToSql(jsCat: string): string {
  if (jsCat === "rent") return "house_rent";
  if (jsCat === "sale") return "property_sale";
  return "furniture";
}

function sqlStatusToJs(sqlStatus: string): ListingStatus {
  if (sqlStatus === "active") return "available";
  return sqlStatus as ListingStatus; // sold / rented pass through
}

function jsStatusToSql(jsStatus: string): string {
  if (jsStatus === "available") return "active";
  return jsStatus; // sold / rented pass through
}

function toIso(val: any): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

// ─── Row Mappers ──────────────────────────────────────────────────────────────
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800";

function mapListing(row: any): Listing {
  return {
    id:          row.listing_id,
    userId:      row.seller_id,
    category:    sqlCatToJs(row.category),
    title:       row.title,
    description: row.description || "",
    price:       parseFloat(row.price),
    location:    row.location || "",
    area:        row.city || "",
    bedrooms:    row.bedrooms || 0,
    bathrooms:   0,
    image:       row.file_path || FALLBACK_IMAGE,
    status:      sqlStatusToJs(row.status),
    createdAt:   toIso(row.created_at),
  };
}

function mapUser(row: any): User {
  return {
    id:           row.user_id,
    name:         row.name,
    email:        row.email,
    phone:        row.phone || "",
    passwordHash: row.password_hash,
    role:         row.role as UserRole,
    createdAt:    toIso(row.created_at),
  };
}

// ─── Shared query: listings joined with first image ───────────────────────────
const LISTING_QUERY = `
  SELECT l.*,
         i.file_path
  FROM listings l
  LEFT JOIN (
    SELECT listing_id, MIN(image_id) AS min_id
    FROM images
    GROUP BY listing_id
  ) fi ON l.listing_id = fi.listing_id
  LEFT JOIN images i ON i.image_id = fi.min_id
`;

// ─── Database API ─────────────────────────────────────────────────────────────
export const db = {

  // ── USERS ──────────────────────────────────────────────────────────────────
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    ) as any;
    return rows.length ? mapUser(rows[0]) : undefined;
  },

  async getUserById(id: number): Promise<User | undefined> {
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE user_id = ?",
      [id]
    ) as any;
    return rows.length ? mapUser(rows[0]) : undefined;
  },

  async addUser(user: {
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    role: UserRole;
  }): Promise<User> {
    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)",
      [user.name, user.email, user.passwordHash, user.phone, user.role]
    ) as any;
    return (await this.getUserById(result.insertId))!;
  },

  // ── LISTINGS ───────────────────────────────────────────────────────────────
  async getListings(): Promise<Listing[]> {
    const [rows] = await pool.execute(LISTING_QUERY) as any;
    return rows.map(mapListing);
  },

  async getListingById(id: number): Promise<Listing | undefined> {
    const [rows] = await pool.execute(
      `${LISTING_QUERY} WHERE l.listing_id = ?`,
      [id]
    ) as any;
    return rows.length ? mapListing(rows[0]) : undefined;
  },

  async addListing(listing: Omit<Listing, "id" | "createdAt">): Promise<Listing> {
    const [result] = await pool.execute(
      `INSERT INTO listings
         (seller_id, category, title, description, price, location, city, bedrooms, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        listing.userId,
        jsCatToSql(listing.category),
        listing.title,
        listing.description,
        listing.price,
        listing.location,
        listing.area,
        listing.bedrooms || null,
        jsStatusToSql(listing.status),
      ]
    ) as any;

    const newId: number = result.insertId;

    // Save image to images table (skip Unsplash fallback URLs)
    if (listing.image && !listing.image.includes("unsplash.com")) {
      await pool.execute(
        "INSERT INTO images (listing_id, file_path) VALUES (?, ?)",
        [newId, listing.image]
      );
    }

    return (await this.getListingById(newId))!;
  },

  async updateListing(
    id: number,
    updates: Partial<Omit<Listing, "id" | "userId" | "createdAt">>
  ): Promise<Listing | undefined> {
    const sets: string[] = [];
    const vals: any[]    = [];

    if (updates.title       !== undefined) { sets.push("title = ?");       vals.push(updates.title); }
    if (updates.description !== undefined) { sets.push("description = ?"); vals.push(updates.description); }
    if (updates.price       !== undefined) { sets.push("price = ?");       vals.push(updates.price); }
    if (updates.location    !== undefined) { sets.push("location = ?");    vals.push(updates.location); }
    if (updates.area        !== undefined) { sets.push("city = ?");        vals.push(updates.area); }
    if (updates.bedrooms    !== undefined) { sets.push("bedrooms = ?");    vals.push(updates.bedrooms || null); }
    if (updates.status      !== undefined) { sets.push("status = ?");      vals.push(jsStatusToSql(updates.status)); }

    if (sets.length) {
      vals.push(id);
      await pool.execute(
        `UPDATE listings SET ${sets.join(", ")} WHERE listing_id = ?`,
        vals
      );
    }

    // Update image if provided
    if (updates.image) {
      const [existing] = await pool.execute(
        "SELECT image_id FROM images WHERE listing_id = ? LIMIT 1",
        [id]
      ) as any;
      if (existing.length) {
        await pool.execute(
          "UPDATE images SET file_path = ? WHERE listing_id = ? LIMIT 1",
          [updates.image, id]
        );
      } else {
        await pool.execute(
          "INSERT INTO images (listing_id, file_path) VALUES (?, ?)",
          [id, updates.image]
        );
      }
    }

    return await this.getListingById(id);
  },

  async deleteListing(id: number, userId: number): Promise<boolean> {
    // FK cascade handles images, wishlist, messages deletion
    const [result] = await pool.execute(
      "DELETE FROM listings WHERE listing_id = ? AND seller_id = ?",
      [id, userId]
    ) as any;
    return result.affectedRows > 0;
  },

  // ── WISHLIST ───────────────────────────────────────────────────────────────
  async getWishlistByUser(userId: number): Promise<Listing[]> {
    const [rows] = await pool.execute(
      `${LISTING_QUERY}
       JOIN wishlist w ON l.listing_id = w.listing_id
       WHERE w.buyer_id = ?`,
      [userId]
    ) as any;
    return rows.map(mapListing);
  },

  async toggleWishlist(userId: number, listingId: number): Promise<{ isSaved: boolean }> {
    const [existing] = await pool.execute(
      "SELECT wishlist_id FROM wishlist WHERE buyer_id = ? AND listing_id = ?",
      [userId, listingId]
    ) as any;

    if (existing.length) {
      await pool.execute(
        "DELETE FROM wishlist WHERE buyer_id = ? AND listing_id = ?",
        [userId, listingId]
      );
      return { isSaved: false };
    }

    await pool.execute(
      "INSERT INTO wishlist (buyer_id, listing_id) VALUES (?, ?)",
      [userId, listingId]
    );
    return { isSaved: true };
  },

  async checkWishlist(userId: number, listingId: number): Promise<boolean> {
    const [rows] = await pool.execute(
      "SELECT wishlist_id FROM wishlist WHERE buyer_id = ? AND listing_id = ?",
      [userId, listingId]
    ) as any;
    return (rows as any[]).length > 0;
  },

  // ── MESSAGES ───────────────────────────────────────────────────────────────
  async getMessagesForUser(userId: number): Promise<any[]> {
    const [rows] = await pool.execute(
      `SELECT m.*,
              u.name  AS sender_name,
              u.phone AS sender_phone,
              l.title AS listing_title
       FROM messages m
       JOIN users    u ON m.sender_id   = u.user_id
       JOIN listings l ON m.listing_id  = l.listing_id
       WHERE m.receiver_id = ? OR m.sender_id = ?
       ORDER BY m.sent_at DESC`,
      [userId, userId]
    ) as any;

    return rows.map((row: any) => ({
      id:           row.message_id,
      senderId:     row.sender_id,
      listingId:    row.listing_id,
      message:      row.message_body,
      sentAt:       toIso(row.sent_at),
      senderName:   row.sender_name,
      senderPhone:  row.sender_phone,
      listingTitle: row.listing_title,
    }));
  },

  async addMessage(msg: {
    senderId: number;
    listingId: number;
    message: string;
  }): Promise<Message> {
    // Derive receiver from listing's seller
    const [listingRows] = await pool.execute(
      "SELECT seller_id FROM listings WHERE listing_id = ?",
      [msg.listingId]
    ) as any;
    const receiverId: number = listingRows[0]?.seller_id;

    const [result] = await pool.execute(
      "INSERT INTO messages (sender_id, receiver_id, listing_id, message_body) VALUES (?, ?, ?, ?)",
      [msg.senderId, receiverId, msg.listingId, msg.message]
    ) as any;

    const [newRows] = await pool.execute(
      "SELECT * FROM messages WHERE message_id = ?",
      [result.insertId]
    ) as any;
    const row = newRows[0];

    return {
      id:        row.message_id,
      senderId:  row.sender_id,
      listingId: row.listing_id,
      message:   row.message_body,
      sentAt:    toIso(row.sent_at),
    };
  },
};
