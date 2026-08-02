import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';

export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decoded.id).select('-password -refreshToken');

  next();
});