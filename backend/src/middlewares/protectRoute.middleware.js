import { requireAuth } from "@clerk/express";
import User from "../models/User.js";

const protectedRoutesHandlers = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const auth = req.auth();
      const clerkId = auth?.userId;

      if (!clerkId) {
        return res.status(401).json({
          message: "Unauthorized — Clerk user ID is missing!",
        });
      }

      // 1️⃣ Try to find user inside MongoDB
      let user = await User.findOne({ clerkId });

      // 2️⃣ If user NOT found → Auto-create the user
      if (!user) {
        console.log("⚠️ User not found in DB. Creating new user...");

        const name =
          auth.sessionClaims?.fullName ||
          auth.sessionClaims?.name ||
          "New User";

        const email =
          auth.sessionClaims?.email ||
          auth.sessionClaims?.email_address ||
          "no-email@example.com";

        user = await User.create({
          clerkId,
          name,
          email,
          profileImageUrl: "",
        });

        console.log("✅ User created in MongoDB:", user._id);
      }

      // 3️⃣ Attach user to request
      req.user = user;

      next();
    } catch (error) {
      console.error("❌ Error in protected route handler:", error);
      res.status(500).json({ message: "Internal Server Error!" });
    }
  },
];

export default protectedRoutesHandlers;
