import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Chat from "../models/Chat.js";

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// API to register User
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.json({ success: false, message: "User already Exist" });
    }
    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    return res.json({ success: true, token });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Api to login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        const token = generateToken(user._id);
        return res.json({ success: true, token });
      }
    }
    return res.json({ success: false, message: "Invalid Email or Password" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Api to get userData
export const getUser = async (req, res) => {
  try {
    const user = req.user;
    return res.json({ success: true, user });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// API to get Puslished Images
export const getPublishedImages = async (req, res) => {
  try {
    const puslishedImageMessages = await Chat.aggregate([
      {
        $unwind: "$message",
      },
      {
        $match: {
          "message.isImage": true,
          "message.isPublished": true,
        },
      },
      {
        $project:{
          _id:0,
          imageUrl:"$message.content",
          userName:"$userName"
        }
      }
    ]);
   return res.json({success:true,images:puslishedImageMessages.reverse()})
  } catch (error) {
    return res.json({success:false,message:error.message});
  }
};
