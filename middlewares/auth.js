const userModel = require('../models/userModel.js');
const jwt = require('jsonwebtoken');
require("dotenv").config();

const authMiddleware = async (req, res, next) => {
  try {
    if (!req.headers.authorization)
      return res.status(401).json({ success: false, message: 'No Authorized' });
    const token =await req.headers.authorization.replace(/Bearer /gi, '');
    const decoded =await jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await userModel.findById(decoded._id).select("-password");
    if (!user) return res.status(404).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    res.status(401).json({ success: false, message: 'No Authorized' });
  }
};

module.exports = authMiddleware;