import { generateToken, validateImage } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import cloudinary from "../lib/cloudinary.js";
import { sendPasswordResetEmail } from "../lib/email.js";
import { reseedDemoData } from "../lib/seedData.js";

export const signup = async (req, res) => {
  const { fullName, email, password, username } = req.body;
  try {
    if (!fullName || !email || !password || !username) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ message: "Username must be between 3 and 20 characters" });
    }

    // Check for existing email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(400).json({ message: "Email already exists" });

    // Check for existing username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: "Username already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      username,
      password: hashedPassword,
      bio: "",
      locationSettings: {
        searchLocation: {
          city: "",
          state: "",
          country: "",
          coordinates: [0, 0]
        },
        nearMeRadius: 25
      },
      currentCity: {
        city: "",
        state: "",
        country: "",
        coordinates: [0, 0]
      },
      followers: [],
      following: []
    });

    if (newUser) {
      // generate jwt token here
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        username: newUser.username,
        profilePic: newUser.profilePic,
        bio: newUser.bio,
        locationSettings: newUser.locationSettings,
        currentCity: newUser.currentCity,
        followers: newUser.followers,
        following: newUser.following,
        friends: newUser.friends,
        messagingPreference: newUser.messagingPreference,
        createdAt: newUser.createdAt,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: "Your account has been banned" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      profilePic: user.profilePic,
      bio: user.bio,
      locationSettings: user.locationSettings,
      currentCity: user.currentCity,
      followers: user.followers,
      following: user.following,
      friends: user.friends,
      messagingPreference: user.messagingPreference,
      createdAt: user.createdAt,
      isDemo: user.isDemo || false,
    });
  } catch (error) {
    console.error("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, username, messagingPreference } = req.body;
    const userId = req.user._id;

    const updateData = {};

    if (messagingPreference !== undefined) {
      if (!['friends_only', 'everyone'].includes(messagingPreference)) {
        return res.status(400).json({ message: "Invalid messaging preference" });
      }
      updateData.messagingPreference = messagingPreference;
    }

    if (profilePic) {
      const { valid, error } = validateImage(profilePic);
      if (!valid) return res.status(400).json({ message: error });
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updateData.profilePic = uploadResponse.secure_url;
    }

    if (bio !== undefined) {
      if (bio.length > 160) {
        return res.status(400).json({ message: "Bio must be 160 characters or less" });
      }
      updateData.bio = bio;
    }

    if (username !== undefined) {
      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ message: "Username must be between 3 and 20 characters" });
      }

      // Check if username is already taken (excluding current user)
      const existingUsername = await User.findOne({ 
        username, 
        _id: { $ne: userId } 
      });
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      updateData.username = username;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.error("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get user by username or ID
export const getUser = async (req, res) => {
  try {
    const { identifier } = req.params; // Can be username or userId

    let user;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a valid ObjectId
      user = await User.findById(identifier).select('-password -email');
    } else {
      // It's a username
      user = await User.findOne({ username: identifier }).select('-password -email');
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add follower/following counts
    const userData = {
      ...user.toObject(),
      followerCount: user.followers.length,
      followingCount: user.following.length,
      friendCount: (user.friends || []).length
    };

    res.status(200).json(userData);
  } catch (error) {
    console.error("Error in getUser controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Forgot password — send reset email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({ message: "If an account with that email exists, a reset link has been sent" });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Build reset URL
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    await sendPasswordResetEmail(user.email, resetUrl);

    res.status(200).json({ message: "If an account with that email exists, a reset link has been sent" });
  } catch (error) {
    console.error("Error in forgotPassword controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Reset password with token
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in resetPassword controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Change password (authenticated, requires current password)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new passwords are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error in changePassword controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Demo login — no credentials, cleans up previous session, returns restricted session
export const demoLogin = async (req, res) => {
  try {
    // Full reseed — wipes all demo data and recreates fresh
    const alex = await reseedDemoData();

    generateToken(alex._id, res);

    res.status(200).json({
      _id: alex._id,
      fullName: alex.fullName,
      email: alex.email,
      username: alex.username,
      profilePic: alex.profilePic,
      bio: alex.bio,
      locationSettings: alex.locationSettings,
      currentCity: alex.currentCity,
      followers: alex.followers,
      following: alex.following,
      friends: alex.friends,
      messagingPreference: alex.messagingPreference,
      createdAt: alex.createdAt,
      isDemo: true,
    });
  } catch (error) {
    console.error("Error in demoLogin controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Search users
export const searchUsers = async (req, res) => {
  try {
    const { q, scope } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const textMatch = {
      $or: [
        { username: { $regex: escaped, $options: 'i' } },
        { fullName: { $regex: escaped, $options: 'i' } }
      ]
    };

    let filter = textMatch;

    if (scope === 'following') {
      filter = { ...textMatch, _id: { $in: req.user.following } };
    } else if (scope === 'nearby') {
      const user = req.user;
      const searchLocation = user.locationSettings?.autoDetectLocation
        ? user.currentCity?.coordinates
        : user.locationSettings?.searchLocation?.coordinates;
      const radiusInMiles = user.locationSettings?.nearMeRadius || 25;

      if (searchLocation && searchLocation[0] !== 0) {
        const radiusInRadians = radiusInMiles / 3959; // Earth radius in miles
        filter = {
          ...textMatch,
          'currentCity.coordinates': {
            $geoWithin: {
              $centerSphere: [searchLocation, radiusInRadians]
            }
          }
        };
      }
    }

    const users = await User.find(filter)
      .select('fullName username profilePic bio currentCity')
      .limit(20);

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};