import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { db, UserRole, ListingCategory, ListingStatus } from "./server/db.js";

// ─── Session Store (in-memory for local dev) ──────────────────────────────────
interface Session {
  userId: number;
  expiresAt: number;
}
const sessions: Record<string, Session> = {};
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000");

  // ── Body Parsing ────────────────────────────────────────────────────────────
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // ── Static uploads folder ───────────────────────────────────────────────────
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  app.use("/uploads", express.static(uploadsDir));

  // ── Auth middleware ─────────────────────────────────────────────────────────
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized access: Token missing." });
    }

    const session = sessions[token];
    if (!session) {
      return res.status(403).json({ error: "Session expired or invalid." });
    }

    if (Date.now() > session.expiresAt) {
      delete sessions[token];
      return res.status(403).json({ error: "Session expired." });
    }

    req.userId = session.userId;
    req.token  = token;
    next();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  API ROUTES
  // ─────────────────────────────────────────────────────────────────────────────

  // 1. Register User
  app.post("/api/register", async (req, res) => {
    try {
      const { name, email, phone, password, role } = req.body;

      if (!name || !email || !phone || !password || !role) {
        return res.status(400).json({ error: "All registration fields are required." });
      }

      if (role !== "buyer" && role !== "seller") {
        return res.status(400).json({ error: "Invalid role selected." });
      }

      const existing = await db.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      const passwordHash = crypto.createHash("sha256").update(password).digest("hex");

      const newUser = await db.addUser({
        name, email, phone, passwordHash, role: role as UserRole,
      });

      const token = generateToken();
      sessions[token] = { userId: newUser.id, expiresAt: Date.now() + SESSION_EXPIRY_MS };

      res.status(201).json({
        message: "Registration successful!",
        token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email, phone: newUser.phone, role: newUser.role },
      });
    } catch (err: any) {
      console.error("Register error:", err);
      res.status(500).json({ error: "Registration failed: " + err.message });
    }
  });

  // 2. Login User
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }

      const user = await db.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const inputHash = crypto.createHash("sha256").update(password).digest("hex");
      if (inputHash !== user.passwordHash) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const token = generateToken();
      sessions[token] = { userId: user.id, expiresAt: Date.now() + SESSION_EXPIRY_MS };

      res.json({
        message: "Login successful!",
        token,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
      });
    } catch (err: any) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Login failed: " + err.message });
    }
  });

  // 3. Logout User
  app.post("/api/logout", authenticateToken, (req: any, res) => {
    delete sessions[req.token];
    res.json({ success: true, message: "Logged out successfully." });
  });

  // 4. Get Current User Details
  app.get("/api/user/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await db.getUserById(req.userId);
      if (!user) return res.status(404).json({ error: "User not found." });
      res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Get Listings with Search & Filters
  app.get("/api/listings", async (req, res) => {
    try {
      let listings = await db.getListings();

      const { category, area, minPrice, maxPrice, bedrooms, search } = req.query;

      if (category && category !== "all") {
        listings = listings.filter(l => l.category === category);
      }

      if (area && area !== "all") {
        listings = listings.filter(l =>
          l.area.toLowerCase().includes((area as string).toLowerCase())
        );
      }

      if (minPrice) {
        const min = parseFloat(minPrice as string);
        if (!isNaN(min)) listings = listings.filter(l => l.price >= min);
      }

      if (maxPrice) {
        const max = parseFloat(maxPrice as string);
        if (!isNaN(max)) listings = listings.filter(l => l.price <= max);
      }

      if (bedrooms && bedrooms !== "all") {
        const beds = parseInt(bedrooms as string, 10);
        if (!isNaN(beds)) listings = listings.filter(l => l.bedrooms === beds);
      }

      if (search) {
        const q = (search as string).toLowerCase();
        listings = listings.filter(l =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q)
        );
      }

      // Newest first
      listings = [...listings].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      res.json(listings);
    } catch (err: any) {
      console.error("Listings error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Get Single Listing Detail
  app.get("/api/listings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid listing ID format." });

      const listing = await db.getListingById(id);
      if (!listing) return res.status(404).json({ error: "Listing not found." });

      const seller = await db.getUserById(listing.userId);
      const sellerInfo = seller
        ? { name: seller.name, phone: seller.phone, email: seller.email }
        : { name: "Deleted User", phone: "N/A", email: "N/A" };

      const allListings = await db.getListings();
      const similar = allListings
        .filter(l => l.category === listing.category && l.id !== listing.id && l.status === "available")
        .slice(0, 3);

      let isSaved = false;
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      if (token) {
        const session = sessions[token];
        if (session && Date.now() < session.expiresAt) {
          isSaved = await db.checkWishlist(session.userId, listing.id);
        }
      }

      res.json({ listing, seller: sellerInfo, similar, isSaved });
    } catch (err: any) {
      console.error("Listing detail error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Helper: save base64 image to uploads folder ────────────────────────────
  const saveBase64Image = (base64Str: string): string => {
    try {
      if (base64Str.startsWith("http://") || base64Str.startsWith("https://")) {
        return base64Str;
      }
      const matches = base64Str.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) throw new Error("Invalid base64 format");

      const extension  = matches[1];
      const dataBuffer = Buffer.from(matches[2], "base64");
      const filename   = `uploaded_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.${extension}`;
      const filePath   = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, dataBuffer);
      return `/uploads/${filename}`;
    } catch (err) {
      console.error("Failed to save uploaded image:", err);
      return "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800";
    }
  };

  // 7. Add Listing (Sellers only)
  app.post("/api/listings/add", authenticateToken, async (req: any, res) => {
    try {
      const user = await db.getUserById(req.userId);
      if (!user || user.role !== "seller") {
        return res.status(403).json({ error: "Forbidden: Only active sellers can post listings." });
      }

      const { category, title, description, price, location, area, bedrooms, bathrooms, image } = req.body;

      if (!category || !title || !description || !price || !location || !area) {
        return res.status(400).json({ error: "Missing required fields for listing." });
      }

      const numericPrice = parseFloat(price);
      if (isNaN(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({ error: "Price must be a valid positive number." });
      }

      let imagePath = "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800";
      if (image) imagePath = saveBase64Image(image);

      const newListing = await db.addListing({
        userId: req.userId,
        category: category as ListingCategory,
        title,
        description,
        price: numericPrice,
        location,
        area,
        bedrooms: parseInt(bedrooms, 10) || 0,
        bathrooms: parseInt(bathrooms, 10) || 0,
        image: imagePath,
        status: "available",
      });

      res.status(201).json({ message: "Listing published successfully!", listing: newListing });
    } catch (err: any) {
      console.error("Add listing error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Edit Listing (Owner only)
  app.put("/api/listings/edit/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid listing ID format." });

      const listing = await db.getListingById(id);
      if (!listing) return res.status(404).json({ error: "Listing not found." });
      if (listing.userId !== req.userId) {
        return res.status(403).json({ error: "Forbidden: You do not own this listing." });
      }

      const { title, description, price, location, area, bedrooms, bathrooms, image, status } = req.body;

      const updates: any = {};
      if (title)             updates.title       = title;
      if (description)       updates.description = description;
      if (price)             { const p = parseFloat(price); if (!isNaN(p) && p > 0) updates.price = p; }
      if (location)          updates.location    = location;
      if (area)              updates.area        = area;
      if (bedrooms !== undefined) updates.bedrooms = parseInt(bedrooms, 10) || 0;
      if (bathrooms !== undefined) updates.bathrooms = parseInt(bathrooms, 10) || 0;
      if (status)            updates.status      = status as ListingStatus;
      if (image)             updates.image       = saveBase64Image(image);

      const updatedListing = await db.updateListing(id, updates);
      res.json({ message: "Listing updated successfully!", listing: updatedListing });
    } catch (err: any) {
      console.error("Edit listing error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 9. Delete Listing (Owner only)
  app.delete("/api/listings/delete/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid listing ID format." });

      const listing = await db.getListingById(id);
      if (!listing) return res.status(404).json({ error: "Listing not found." });
      if (listing.userId !== req.userId) {
        return res.status(403).json({ error: "Forbidden: You do not own this listing." });
      }

      const success = await db.deleteListing(id, req.userId);
      if (success) {
        res.json({ success: true, message: "Listing deleted successfully." });
      } else {
        res.status(500).json({ error: "Could not execute listing deletion." });
      }
    } catch (err: any) {
      console.error("Delete listing error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 10. Toggle Wishlist
  app.post("/api/wishlist/toggle", authenticateToken, async (req: any, res) => {
    try {
      const { listingId } = req.body;
      const lId = parseInt(listingId, 10);
      if (isNaN(lId)) return res.status(400).json({ error: "Invalid listing ID format." });

      const listing = await db.getListingById(lId);
      if (!listing) return res.status(404).json({ error: "Listing does not exist." });

      const result = await db.toggleWishlist(req.userId, lId);
      res.json({
        success: true,
        isSaved: result.isSaved,
        message: result.isSaved ? "Saved to your Wishlist!" : "Removed from Wishlist.",
      });
    } catch (err: any) {
      console.error("Wishlist toggle error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 11. Get Wishlist
  app.get("/api/wishlist", authenticateToken, async (req: any, res) => {
    try {
      const wishlist = await db.getWishlistByUser(req.userId);
      res.json(wishlist);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 12. Send Message
  app.post("/api/messages/send", authenticateToken, async (req: any, res) => {
    try {
      const { listingId, message } = req.body;
      const lId = parseInt(listingId, 10);

      if (isNaN(lId) || !message || message.trim() === "") {
        return res.status(400).json({ error: "Invalid listing ID or blank message." });
      }

      const listing = await db.getListingById(lId);
      if (!listing) return res.status(404).json({ error: "Listing not found." });
      if (listing.userId === req.userId) {
        return res.status(400).json({ error: "You cannot message on your own listing." });
      }

      const newMessage = await db.addMessage({ senderId: req.userId, listingId: lId, message: message.trim() });
      res.status(201).json({ success: true, message: "Message sent to the seller!", data: newMessage });
    } catch (err: any) {
      console.error("Send message error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 13. Get Messages for User
  app.get("/api/messages", authenticateToken, async (req: any, res) => {
    try {
      const userMessages = await db.getMessagesForUser(req.userId);
      res.json(userMessages);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 14. Seller's own listings
  app.get("/api/user/listings", authenticateToken, async (req: any, res) => {
    try {
      const allListings = await db.getListings();
      res.json(allListings.filter(l => l.userId === req.userId));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  //  VITE DEV / PRODUCTION STATIC FILES
  // ─────────────────────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🏠 BashaBazar BD running → http://localhost:${PORT}`);
    console.log(`   Database: MySQL @ ${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "3306"}/${process.env.DB_NAME || "bashabazar"}`);
    console.log(`   Environment: ${process.env.NODE_ENV || "development"}\n`);
  });
}

startServer();
