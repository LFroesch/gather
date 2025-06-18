import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

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
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: "Email already exists" });

    // Check for existing username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: "Username already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
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
        createdAt: newUser.createdAt,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
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
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, username } = req.body;
    const userId = req.user._id;

    const updateData = {};

    if (profilePic) {
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
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
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
      followingCount: user.following.length
    };

    res.status(200).json(userData);
  } catch (error) {
    console.log("Error in getUser controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Search users
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } }
      ]
    })
    .select('fullName username profilePic')
    .limit(20);

    res.status(200).json(users);
  } catch (error) {
    console.log("Error in searchUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};