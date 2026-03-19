import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const demoGuard = (req, res, next) => {
  if (req.user?.isDemo) {
    return res.status(403).json({ message: "This action is not available in demo mode" });
  }
  next();
};

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: "Your account has been banned" });
    }

    req.user = user;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      res.clearCookie("jwt");
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }
    console.error("Error in protectRoute middleware: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};