dotenv.config()
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./auth";
import { storage } from "./storage";
import { insertDestinationSchema, insertBookingSchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import dotenv from "dotenv";

// Intelligent chatbot response generator using rule-based approach
async function generateChatbotResponse(message: string, data: any): Promise<string> {
  const { destinations, bookingStats, userStats, revenue, recentReviews, context } = data;
  const lowerMessage = message.toLowerCase();
  
  // Enhanced destination analysis
  const getDestinationsByType = () => {
    const luxury = destinations.filter((d: any) => parseInt(d.price.replace(/[^0-9]/g, '')) >= 4000);
    const budget = destinations.filter((d: any) => parseInt(d.price.replace(/[^0-9]/g, '')) < 2500);
    const adventure = destinations.filter((d: any) => 
      d.name.toLowerCase().includes('safari') || 
      d.name.toLowerCase().includes('mountain') || 
      d.description.toLowerCase().includes('adventure')
    );
    const beach = destinations.filter((d: any) => 
      d.name.toLowerCase().includes('beach') || 
      d.name.toLowerCase().includes('maldives') || 
      d.name.toLowerCase().includes('coast')
    );
    return { luxury, budget, adventure, beach };
  };

  // Calculate average ratings and popular destinations
  const avgRating = destinations.reduce((sum: number, d: any) => sum + (d.rating || 0), 0) / destinations.length;
  const topRated = destinations.filter((d: any) => d.rating >= 4.5).slice(0, 5);
  const mostReviewed = destinations.sort((a: any, b: any) => (b.reviewCount || 0) - (a.reviewCount || 0)).slice(0, 5);
  
  // Get reviews context
  const recentReviewsText = recentReviews && recentReviews.length > 0 
    ? `\n\n**Recent Customer Feedback:**\n${recentReviews.slice(0, 3).map((review: any) => 
        `• "${review.comment}" - ${review.rating}/5 stars (${review.user.firstName || review.user.username})`
      ).join('\n')}`
    : '';

  // Booking and reservation queries (check first to avoid conflicts)
  if (lowerMessage.includes("book") || lowerMessage.includes("reservation") || lowerMessage.includes("reserve") || lowerMessage.includes("availability") || lowerMessage.includes("how do i") || lowerMessage.includes("how to")) {
    return `📅 **How to Book with TravelEx**

Trusted by ${userStats.total.toLocaleString()} travelers worldwide

🏆 **Our Track Record:**
• ${bookingStats.total.toLocaleString()} successful bookings completed
• $${parseInt(revenue.total).toLocaleString()} in travel experiences delivered
• ${avgRating.toFixed(1)}/5 average customer satisfaction rating
• ${bookingStats.growth}% booking growth this year

✨ **Simple 4-Step Booking Process:**

1️⃣ **Browse & Select**
   Choose your destination and preferred travel dates

2️⃣ **Customize Your Experience**
   Add optional activities and tailor your itinerary

3️⃣ **Secure Payment**
   Complete booking with our encrypted payment system

4️⃣ **Instant Confirmation**
   Receive booking confirmation and travel documents

🛡️ **Flexible Cancellation Policy:**
• Full refund: Up to 48 hours before departure
• 80% refund: 7-48 hours before departure  
• Emergency situations: Case-by-case review for medical/family emergencies
• Refund processing: 5-7 business days

🌟 **Currently Available:**
${destinations.slice(0, 3).map((d: any) => 
  `• ${d.name}
   ${d.duration} days from ${d.price}`).join('\n\n')}

📞 **Ready to Book?**
Phone: 0491906089
Email: contact@travelex.com
Hours: Monday-Friday 9AM-6PM, Saturday 10AM-4PM
Emergency: 24/7 support available`;
  }

  // Destination-related queries (but not booking-related)
  if ((lowerMessage.includes("destination") || lowerMessage.includes("where") || lowerMessage.includes("place") || lowerMessage.includes("travel") || lowerMessage.includes("trip")) && 
      !lowerMessage.includes("book") && !lowerMessage.includes("how do") && !lowerMessage.includes("how to")) {
    const types = getDestinationsByType();
    
    if (lowerMessage.includes("luxury") || lowerMessage.includes("premium")) {
      return `Our luxury travel collection features ${types.luxury.length} premium destinations:

${types.luxury.slice(0, 4).map((dest: any, idx: number) => 
  `**${idx + 1}. ${dest.name}, ${dest.country}**
• Duration: ${dest.duration} days - ${dest.price}
• Rating: ${dest.rating}/5 stars (${dest.reviewCount} reviews)
• Highlights: ${dest.description.substring(0, 100)}...
${dest.couponCode ? `• Special Offer: Use code ${dest.couponCode} for ${dest.discountPercentage}% off` : ''}`
).join('\n\n')}

Each luxury package includes premium accommodations, private transfers, gourmet dining, and personalized service.

**Contact our luxury travel specialists:**
📞 Phone: 0491906089 | 📧 Email: contact@travelex.com`;
    }
    
    if (lowerMessage.includes("adventure") || lowerMessage.includes("safari") || lowerMessage.includes("hiking")) {
      return `Experience our adventure destinations featuring wildlife safaris and outdoor expeditions:

${types.adventure.slice(0, 3).map((dest: any, idx: number) => 
  `**${idx + 1}. ${dest.name}, ${dest.country}**
• ${dest.duration} days - ${dest.price}
• Adventure Level: ${dest.rating}/5 stars
• Experience: ${dest.description.substring(0, 120)}...`
).join('\n\n')}

All adventure packages include expert guides, safety equipment, and comprehensive insurance coverage.${recentReviewsText}

Ready for adventure? Contact us at 0491906089`;
    }
    
    return `🌍 **TravelEx Premium Destinations**

We offer ${destinations.length} carefully curated destinations across ${new Set(destinations.map((d: any) => d.country)).size} countries worldwide.

✨ **Most Popular Destinations:**

${mostReviewed.slice(0, 5).map((dest: any, idx: number) => 
  `${idx + 1}. **${dest.name}, ${dest.country}**
     💰 Price: ${dest.price} (${dest.duration} days)
     ⭐ Rating: ${dest.rating}/5 stars (${dest.reviewCount} reviews)
     📝 ${dest.description.substring(0, 80)}...
     ${dest.promoTag ? `🎯 Special: ${dest.promoTag}` : ''}${dest.flashSale ? '\n     🔥 FLASH SALE ACTIVE' : ''}`
).join('\n\n')}

🏨 **What's Included in Every Package:**
• Luxury accommodations with premium amenities
• All meals featuring local and international cuisine  
• Professional guided tours and cultural experiences
• Airport transfers and local transportation
• 24/7 concierge support throughout your journey

📞 **Contact Us:**
Phone: 0491906089
Email: contact@travelex.com
Address: 419A Windsor Rd, Baulkham Hills NSW 2153`;
  }

  // Pricing and budget queries
  if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("budget") || lowerMessage.includes("cheap") || lowerMessage.includes("expensive")) {
    const prices = destinations.map((d: any) => parseInt(d.price.replace(/[^0-9]/g, '')));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = Math.round(prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length);
    
    return `💰 **TravelEx Pricing Guide**

Our luxury packages range from $${minPrice.toLocaleString()} to $${maxPrice.toLocaleString()}
Average package price: $${avgPrice.toLocaleString()}

🌟 **Budget-Friendly Options (Under $3,000):**
${destinations.filter((d: any) => parseInt(d.price.replace(/[^0-9]/g, '')) < 3000)
  .slice(0, 4).map((d: any) => `• ${d.name}
   💰 ${d.price} (${d.duration} days)
   ⭐ ${d.rating}/5 stars`).join('\n\n')}

✨ **Premium Experiences ($3,000+):**
${destinations.filter((d: any) => parseInt(d.price.replace(/[^0-9]/g, '')) >= 3000)
  .slice(0, 4).map((d: any) => `• ${d.name}
   💰 ${d.price} (${d.duration} days)
   ⭐ ${d.rating}/5 stars`).join('\n\n')}

🎁 **Current Promotions:**
${destinations.filter((d: any) => d.couponCode || d.promoTag || d.flashSale)
  .slice(0, 3).map((d: any) => 
    `• ${d.name}
   ${d.couponCode ? `🏷️ Code: ${d.couponCode} (${d.discountPercentage}% off)` : `🎯 ${d.promoTag || 'Flash Sale'}`}`
  ).join('\n\n')}

📋 **All Prices Include:**
Accommodations, meals, activities, transfers, and 24/7 support

📞 **Get Quote:** Call 0491906089 for personalized pricing`;
  }



  // Reviews and ratings queries
  if (lowerMessage.includes("review") || lowerMessage.includes("rating") || lowerMessage.includes("feedback") || lowerMessage.includes("testimonial")) {
    return `⭐ **Customer Reviews & Ratings**

${avgRating.toFixed(1)}/5 stars average rating across all destinations
${destinations.reduce((sum: number, d: any) => sum + (d.reviewCount || 0), 0)} total customer reviews
${userStats.total.toLocaleString()} satisfied travelers served

🏆 **Top-Rated Destinations:**

${topRated.map((dest: any, idx: number) => 
  `${idx + 1}. **${dest.name}**
     ⭐ ${dest.rating}/5 stars (${dest.reviewCount} reviews)
     💰 ${dest.duration} days from ${dest.price}
     📝 "${dest.description.substring(0, 80)}..."`
).join('\n\n')}${recentReviewsText}

💫 **What Customers Love Most:**
• Exceptional attention to detail and personalized service
• High-quality accommodations and authentic local experiences  
• Professional, knowledgeable guides and seamless logistics
• Responsive customer support throughout the journey

📞 **Need References?**
Call 0491906089 or view detailed reviews on our website`;
  }

  // Company and about queries
  if (lowerMessage.includes("about") || lowerMessage.includes("company") || lowerMessage.includes("who") || lowerMessage.includes("travelex")) {
    return `🏢 **About TravelEx - Your Premium Travel Partner**

Specializing in luxury, immersive travel experiences for discerning travelers seeking authentic cultural connections and exceptional service.

📊 **Our Achievements:**
• ${destinations.length} carefully curated destinations worldwide
• ${userStats.total.toLocaleString()} satisfied customers and growing
• ${bookingStats.total.toLocaleString()} successful bookings completed
• $${parseInt(revenue.total).toLocaleString()} in memorable travel experiences delivered
• ${userStats.growth}% customer base growth year-over-year

✨ **What Sets Us Apart:**
• Handpicked destinations with authentic cultural experiences
• All-inclusive luxury packages with no hidden fees
• Expert local guides and 24/7 concierge support
• Sustainable tourism practices and community partnerships
• Flexible booking with comprehensive travel insurance

🌟 **Our Premium Services:**
• Luxury accommodations and premium transportation
• Curated cultural experiences and exclusive access tours
• Professional photography services and travel documentation
• Group discounts and corporate travel planning
• Emergency support and travel assistance worldwide

📍 **Contact Our Team:**
Address: 419A Windsor Rd, Baulkham Hills NSW 2153, Australia
Phone: 0491906089
Email: contact@travelex.com
Hours: Monday-Friday 9AM-6PM, Saturday 10AM-4PM
Emergency: 24/7 support available`;
  }

  // Support and contact queries
  if (lowerMessage.includes("contact") || lowerMessage.includes("support") || lowerMessage.includes("help") || lowerMessage.includes("phone") || lowerMessage.includes("email")) {
    return `📞 **TravelEx Customer Support**

Available 24/7 to assist with all your travel needs

📋 **Contact Information:**
Phone: 0491906089
Email: contact@travelex.com
Address: 419A Windsor Rd, Baulkham Hills NSW 2153, Australia

🕐 **Business Hours:**
• Monday-Friday: 9:00 AM - 6:00 PM
• Saturday: 10:00 AM - 4:00 PM  
• Sunday: Emergency support only
• Emergency assistance: Available 24/7

📈 **Our Performance:**
• ${userStats.total.toLocaleString()} customers served with excellence
• ${bookingStats.total.toLocaleString()} bookings processed successfully
• Average response time: Under 2 hours during business hours

🎯 **How We Can Assist:**
• Destination recommendations and travel planning
• Booking assistance and payment processing
• Travel document guidance and visa requirements
• Itinerary modifications and special requests
• Emergency support during your travels
• Post-travel feedback and future planning

⚡ **Quick Actions:**
• Immediate booking: Call 0491906089
• General inquiries: Email contact@travelex.com
• Emergencies: Use our 24/7 hotline

Our experienced travel specialists are ready to help you plan your perfect journey.`;
  }

  // Default comprehensive welcome response
  return `🌟 **Welcome to TravelEx - Premium Travel Experiences**

Your gateway to luxury travel across ${destinations.length} exceptional destinations in ${new Set(destinations.map((d: any) => d.country)).size} countries
Trusted by ${userStats.total.toLocaleString()} travelers worldwide

✨ **Featured Destinations:**

${destinations.slice(0, 3).map((dest: any, idx: number) => 
  `${idx + 1}. **${dest.name}, ${dest.country}**
     💰 ${dest.duration} days from ${dest.price}
     ⭐ ${dest.rating}/5 stars (${dest.reviewCount} reviews)
     📝 ${dest.description.substring(0, 80)}...`
).join('\n\n')}

🏆 **Why Choose TravelEx:**
• All-inclusive luxury packages with authentic experiences
• Expert local guides and premium accommodations  
• 24/7 customer support and emergency assistance
• Flexible cancellation policy up to 48 hours before departure
• ${avgRating.toFixed(1)}/5 average customer satisfaction rating

🌐 **Services Available:**
• Destination planning and personalized itineraries
• Group bookings and corporate travel arrangements
• Travel insurance and documentation assistance
• Cultural experiences and exclusive access tours

📞 **Get Started:**
Phone: 0491906089
Email: contact@travelex.com
Hours: Monday-Friday 9AM-6PM, Saturday 10AM-4PM
Emergency: 24/7 support available

How may I assist you with planning your next extraordinary journey?`;
}

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY not found, Stripe functionality will be disabled');
}
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// Validation schemas
const createBookingSchema = insertBookingSchema.extend({
  checkIn: z.string().transform((val) => new Date(val).toISOString().split('T')[0]),
  checkOut: z.string().transform((val) => new Date(val).toISOString().split('T')[0]),
  totalAmount: z.number().transform((val) => val.toString()),
}).omit({
  userId: true, // We'll add this from the authenticated user
});

const updateDestinationSchema = insertDestinationSchema.partial();

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      
      // Check if user should have admin role based on email
      if (user && user.email === 'admins@travelex.com') {
        const updatedUser = await storage.upsertUser({
          ...user,
          role: 'admin'
        });
        res.json(updatedUser);
      } else {
        res.json(user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Username/Password login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session
      (req as any).session.user = user;
      
      res.json({ user, message: "Login successful" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Username/Password signup
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { username, email, firstName, lastName, password } = req.body;
      
      if (!username || !email || !firstName || !lastName || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Create new user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newUser = await storage.createUser({
        id: userId,
        username,
        email,
        firstName,
        lastName,
        password,
        role: 'user',
        isActive: true
      });

      // Set session
      (req as any).session.user = newUser;
      
      res.status(201).json({ user: newUser, message: "Account created successfully" });
    } catch (error: any) {
      console.error("Signup error:", error);
      
      // Handle specific database constraint errors
      if (error.code === '23505') {
        if (error.constraint === 'users_email_unique') {
          return res.status(409).json({ message: "Email address already exists" });
        }
        if (error.constraint === 'users_username_unique') {
          return res.status(409).json({ message: "Username already exists" });
        }
      }
      
      res.status(500).json({ message: "Account creation failed" });
    }
  });

  // Get current user for session-based auth
  app.get('/api/auth/session', async (req, res) => {
    try {
      const sessionUser = (req as any).session?.user;
      if (sessionUser) {
        const user = await storage.getUser(sessionUser.id);
        res.json(user);
      } else {
        res.status(401).json({ message: "Not authenticated" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to get session" });
    }
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Admin routes
  app.get('/api/admin/analytics', async (req, res) => {
    try {
      const sessionUser = (req as any).session?.user;
      if (!sessionUser || sessionUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const [revenue, bookingStats, userStats] = await Promise.all([
        storage.getRevenue(),
        storage.getBookingStats(),
        storage.getUserStats()
      ]);

      res.json({
        revenue,
        bookings: bookingStats,
        users: userStats
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/admin/destinations', async (req, res) => {
    try {
      const sessionUser = (req as any).session?.user;
      if (!sessionUser || sessionUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const destinations = await storage.getDestinationsWithStats();
      res.json(destinations);
    } catch (error) {
      console.error("Destinations with stats error:", error);
      res.status(500).json({ message: "Failed to fetch destinations" });
    }
  });

  // Check for duplicate image URLs
  app.get('/api/admin/check-image-url', async (req, res) => {
    try {
      const sessionUser = (req as any).session?.user;
      if (!sessionUser || sessionUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { imageUrl, excludeId } = req.query;
      
      if (!imageUrl) {
        return res.status(400).json({ message: "Image URL is required" });
      }

      const existingDestination = await storage.checkImageUrlExists(
        imageUrl as string, 
        excludeId ? parseInt(excludeId as string) : undefined
      );

      res.json({
        isDuplicate: !!existingDestination,
        existingDestination: existingDestination || null
      });
    } catch (error) {
      console.error("Image URL check error:", error);
      res.status(500).json({ message: "Failed to check image URL" });
    }
  });

  app.get('/api/admin/users', async (req, res) => {
    try {
      const sessionUser = (req as any).session?.user;
      if (!sessionUser || sessionUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Users fetch error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/activity-logs', async (req, res) => {
    try {
      const sessionUser = (req as any).session?.user;
      if (!sessionUser || sessionUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const logs = await storage.getActivityLogs(100);
      res.json(logs);
    } catch (error) {
      console.error("Activity logs error:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  app.patch('/api/admin/users/:id/toggle-status', async (req, res) => {
    try {
      const sessionUser = (req as any).session?.user;
      if (!sessionUser || sessionUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateUser(id, {
        isActive: !user.isActive
      });

      // Log the activity
      await storage.createActivityLog({
        userId: sessionUser.id,
        action: `User ${updatedUser.isActive ? 'Activated' : 'Deactivated'}`,
        description: `Changed status of user ${user.username} to ${updatedUser.isActive ? 'active' : 'inactive'}`
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Toggle user status error:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.post('/api/admin/users', async (req, res) => {
    try {
      const sessionUser = (req as any).session?.user;
      if (!sessionUser || sessionUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { username, email, firstName, lastName, role, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const newUser = await storage.createUser({
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username,
        email,
        firstName,
        lastName,
        role: role || 'user',
        password,
        isActive: true
      });

      // Log the activity
      await storage.createActivityLog({
        userId: sessionUser.id,
        action: 'User Created',
        description: `Created new user ${username} with role ${role || 'user'}`
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch('/api/admin/users/:id', async (req, res) => {
    try {
      const sessionUser = (req as any).session?.user;
      if (!sessionUser || sessionUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { username, email, firstName, lastName, role } = req.body;

      if (!username || !email) {
        return res.status(400).json({ message: "Username and email are required" });
      }

      // Check if username is already taken by another user
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser && existingUser.id !== id) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Get current user data
      const currentUser = await storage.getUser(id);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user
      const updatedUser = await storage.updateUser(id, {
        username,
        email,
        firstName,
        lastName,
        role: role || currentUser.role
      });

      // Log the activity
      await storage.createActivityLog({
        userId: sessionUser.id,
        action: 'User Updated',
        description: `Updated user ${username} (${firstName} ${lastName})`
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/admin/users/:id', async (req, res) => {
    try {
      const sessionUser = (req as any).session?.user;
      if (!sessionUser || sessionUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.deleteUser(id);

      // Log the activity
      await storage.createActivityLog({
        userId: sessionUser.id,
        action: 'User Deleted',
        description: `Deleted user ${user.username} (${user.email})`
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Destinations routes
  app.get('/api/destinations', async (req, res) => {
    try {
      const destinations = await storage.getAllDestinations();
      res.json(destinations);
    } catch (error) {
      console.error("Error fetching destinations:", error);
      res.status(500).json({ message: "Failed to fetch destinations" });
    }
  });

  app.get('/api/destinations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const destination = await storage.getDestination(id);
      if (!destination) {
        return res.status(404).json({ message: "Destination not found" });
      }
      res.json(destination);
    } catch (error) {
      console.error("Error fetching destination:", error);
      res.status(500).json({ message: "Failed to fetch destination" });
    }
  });

  app.get('/api/destinations/:id/reviews', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const reviews = await storage.getDestinationReviews(id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get('/api/destinations/:id/review-stats', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const stats = await storage.getReviewStats(id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching review stats:", error);
      res.status(500).json({ message: "Failed to fetch review stats" });
    }
  });

  // Admin routes - destinations management
  app.post('/api/admin/destinations', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertDestinationSchema.parse(req.body);
      const destination = await storage.createDestination(validatedData);
      
      await storage.createActivityLog({
        userId: req.user.claims.sub,
        action: "destination_created",
        description: `Created destination: ${destination.name}`,
        metadata: { destinationId: destination.id },
      });

      res.json(destination);
    } catch (error) {
      console.error("Error creating destination:", error);
      res.status(500).json({ message: "Failed to create destination" });
    }
  });

  app.put('/api/admin/destinations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const validatedData = updateDestinationSchema.parse(req.body);
      const destination = await storage.updateDestination(id, validatedData);
      
      await storage.createActivityLog({
        userId: req.user.claims.sub,
        action: "destination_updated",
        description: `Updated destination: ${destination.name}`,
        metadata: { destinationId: destination.id },
      });

      res.json(destination);
    } catch (error) {
      console.error("Error updating destination:", error);
      res.status(500).json({ message: "Failed to update destination" });
    }
  });

  app.delete('/api/admin/destinations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteDestination(id);
      
      await storage.createActivityLog({
        userId: req.user.claims.sub,
        action: "destination_deleted",
        description: `Deleted destination with ID: ${id}`,
        metadata: { destinationId: id },
      });

      res.json({ message: "Destination deleted successfully" });
    } catch (error) {
      console.error("Error deleting destination:", error);
      res.status(500).json({ message: "Failed to delete destination" });
    }
  });

  app.get('/api/admin/destinations', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const destinations = await storage.getDestinationsWithStats();
      res.json(destinations);
    } catch (error) {
      console.error("Error fetching destinations with stats:", error);
      res.status(500).json({ message: "Failed to fetch destinations" });
    }
  });

  // Admin routes - users management
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.delete('/api/admin/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = req.params.id;
      await storage.deleteUser(userId);
      
      await storage.createActivityLog({
        userId: req.user.claims.sub,
        action: "user_deleted",
        description: `Deleted user: ${userId}`,
        metadata: { deletedUserId: userId },
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin routes - analytics
  app.get('/api/admin/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const [revenue, bookingStats, userStats] = await Promise.all([
        storage.getRevenue(),
        storage.getBookingStats(),
        storage.getUserStats(),
      ]);

      res.json({
        revenue,
        bookings: bookingStats,
        users: userStats,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Admin routes - activity logs
  app.get('/api/admin/logs', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // Bookings routes
  app.post('/api/bookings', async (req: any, res) => {
    try {
      // Check session-based authentication
      const sessionUser = req.session?.user;
      const userId = sessionUser?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      console.log("Creating booking with userId:", userId);
      console.log("Request body:", req.body);
      
      const validatedData = createBookingSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      
      // Validate coupon code if provided
      if (validatedData.appliedCouponCode) {
        const destination = await storage.getDestination(validatedData.destinationId);
        if (!destination) {
          return res.status(404).json({ message: "Destination not found" });
        }
        
        // Check if the coupon code belongs to this specific destination
        if (!destination.couponCode || 
            validatedData.appliedCouponCode.toUpperCase() !== destination.couponCode.toUpperCase()) {
          return res.status(400).json({ 
            message: `Invalid coupon code for ${destination.name}. This coupon cannot be used for this destination.` 
          });
        }
      }
      
      // Check for duplicate booking
      const isDuplicate = await storage.checkDuplicateBooking(
        userId,
        validatedData.destinationId,
        validatedData.checkIn,
        validatedData.checkOut
      );
      
      if (isDuplicate) {
        return res.status(409).json({ 
          message: "You already have a booking for this destination with the same dates. Please choose different dates or destination." 
        });
      }
      
      const booking = await storage.createBooking({
        ...validatedData,
        userId,
      });

      await storage.createActivityLog({
        userId,
        action: "booking_created",
        description: `Created booking for destination ID: ${booking.destinationId}`,
        metadata: { bookingId: booking.id },
      });

      res.json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.get('/api/bookings', async (req: any, res) => {
    try {
      const sessionUser = req.session?.user;
      const replitUser = req.user?.claims?.sub;
      const userId = sessionUser?.id || replitUser;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get('/api/bookings/:id', async (req: any, res) => {
    try {
      // Check session-based authentication
      const sessionUser = req.session?.user;
      const replitUser = req.user?.claims?.sub;
      const userId = sessionUser?.id || replitUser;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if user owns this booking or is admin
      const user = await storage.getUser(userId);
      if (booking.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.put('/api/bookings/:id/cancel', async (req: any, res) => {
    try {
      // Check session-based authentication
      const sessionUser = req.session?.user;
      const replitUser = req.user?.claims?.sub;
      const userId = sessionUser?.id || replitUser;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if user owns this booking
      if (booking.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if booking can be cancelled (not already cancelled or completed)
      if (booking.status === "cancelled") {
        return res.status(400).json({ message: "Booking is already cancelled" });
      }

      if (booking.status === "completed") {
        return res.status(400).json({ message: "Cannot cancel a completed trip" });
      }

      await storage.cancelBooking(id);
      
      await storage.createActivityLog({
        userId,
        action: "booking_cancelled",
        description: `Cancelled booking ID: ${id}`,
        metadata: { bookingId: id },
      });

      res.json({ message: "Booking cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing is currently unavailable" });
      }

      const sessionUser = req.session?.user;
      const replitUser = req.user?.claims?.sub;
      const userId = sessionUser?.id || replitUser;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { amount, bookingId, currency = "usd" } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Validate supported currency
      const supportedCurrencies = ['usd', 'eur', 'gbp', 'jpy', 'cad', 'aud', 'chf', 'cny', 'inr', 'sgd'];
      const normalizedCurrency = currency.toLowerCase();
      
      if (!supportedCurrencies.includes(normalizedCurrency)) {
        return res.status(400).json({ message: "Unsupported currency" });
      }

      // Adjust amount formatting for zero-decimal currencies (like JPY)
      const zeroDecimalCurrencies = ['jpy', 'krw', 'vnd'];
      const amountInSmallestUnit = zeroDecimalCurrencies.includes(normalizedCurrency) 
        ? Math.round(amount) 
        : Math.round(amount * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInSmallestUnit,
        currency: normalizedCurrency,
        metadata: {
          bookingId: bookingId?.toString() || "",
          userId,
          originalCurrency: currency,
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  app.post("/api/confirm-payment", async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing is currently unavailable" });
      }

      const sessionUser = req.session?.user;
      const replitUser = req.user?.claims?.sub;
      const userId = sessionUser?.id || replitUser;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { paymentIntentId, bookingId } = req.body;
      
      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === "succeeded") {
        // Update booking payment status
        await storage.updateBooking(bookingId, {
          paymentStatus: "paid",
          status: "confirmed",
          stripePaymentIntentId: paymentIntentId,
        });

        await storage.createActivityLog({
          userId,
          action: "payment_completed",
          description: `Payment completed for booking ID: ${bookingId}`,
          metadata: { bookingId, paymentIntentId },
        });

        res.json({ message: "Payment confirmed successfully" });
      } else {
        res.status(400).json({ message: "Payment not successful" });
      }
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Error confirming payment: " + error.message });
    }
  });

  // Admin bookings route
  app.get('/api/admin/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Chatbot API endpoint
  app.post('/api/chatbot/query', async (req, res) => {
    try {
      const { message, context } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Get comprehensive website data for context with proper error handling
      const [destinations, bookingStats, userStats, revenue] = await Promise.allSettled([
        storage.getAllDestinations(),
        storage.getBookingStats(),
        storage.getUserStats(),
        storage.getRevenue()
      ]).then(results => results.map(result => 
        result.status === 'fulfilled' ? result.value : null
      ));
      
      // Get recent reviews for additional context with improved error handling
      let allReviews: any[] = [];
      if (destinations && Array.isArray(destinations)) {
        try {
          const reviewPromises = destinations.slice(0, 5).map(async (dest: any) => {
            try {
              const reviews = await storage.getDestinationReviews(dest.id);
              return reviews.slice(0, 2);
            } catch (reviewError) {
              console.log(`Could not fetch reviews for destination ${dest.id}:`, (reviewError as Error)?.message || 'Unknown error');
              return [];
            }
          });
          
          const reviewResults = await Promise.allSettled(reviewPromises);
          allReviews = reviewResults.reduce((acc: any[], result) => {
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
              acc.push(...result.value);
            }
            return acc;
          }, []);
        } catch (error) {
          console.log('Error fetching reviews:', (error as Error)?.message || 'Unknown error');
          allReviews = [];
        }
      }

      // Generate intelligent response based on website data with fallbacks
      const response = await generateChatbotResponse(message, {
        destinations: destinations || [],
        bookingStats: bookingStats || { total: 0, thisMonth: 0, growth: 0 },
        userStats: userStats || { total: 0, active: 0, growth: 0 },
        revenue: revenue || { total: "0", period: "N/A" },
        recentReviews: allReviews,
        context
      });

      res.json({ response });
    } catch (error) {
      console.error("Chatbot query error:", error);
      res.status(500).json({ message: "Failed to process chatbot query" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
