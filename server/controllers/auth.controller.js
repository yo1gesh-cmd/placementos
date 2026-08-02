  import jwt from 'jsonwebtoken';
  import User from '../models/user.model.js';
  import asyncHandler from '../utils/asyncHandler.js';
  import ApiError from '../utils/apiError.js';
  import ApiResponse from '../utils/apiResponse.js';

  // generate access token — short lived
  const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
  };

  // generate refresh token — long lived
  const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  };

  // set both tokens as cookies
  const setTokenCookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  };

  // @desc    Register user
  // @route   POST /api/auth/register
  // @desc    Register user
  // @route   POST /api/auth/register
  export const registerUser = asyncHandler(async (req, res) => {
    const {
      name,
      email,
      password,
      college,
      cgpa,
      phone,
      linkedin,
      github,
      portfolio,
      education,
      experience,
    } = req.body;

    if (!email || !password) throw new ApiError(400, 'Email and password are required');

    const userExists = await User.findOne({ email });
    if (userExists) throw new ApiError(400, 'User already exists');

    const user = await User.create({
      name,
      email,
      password,
      college,
      cgpa,
      phone,
      linkedin,
      github,
      portfolio,
      education,
      experience,
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json(
      new ApiResponse(201, {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
      }, 'User registered successfully')
    );
  });

  // @desc    Update user profile
  // @route   PUT /api/auth/profile
  export const updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(404, 'User not found');

    const {
      name,
      college,
      cgpa,
      phone,
      linkedin,
      github,
      portfolio,
      education,
      experience,
    } = req.body;

    user.name = name ?? user.name;
    user.college = college ?? user.college;
    user.cgpa = cgpa ?? user.cgpa;
    user.phone = phone ?? user.phone;
    user.linkedin = linkedin ?? user.linkedin;
    user.github = github ?? user.github;
    user.portfolio = portfolio ?? user.portfolio;
    user.education = education ?? user.education;
    user.experience = experience ?? user.experience;

    await user.save({ validateBeforeSave: false });

    res.json(new ApiResponse(200, {
      id: user._id,
      name: user.name,
      email: user.email,
      college: user.college,
      cgpa: user.cgpa,
      phone: user.phone,
      linkedin: user.linkedin,
      github: user.github,
      portfolio: user.portfolio,
      education: user.education,
      experience: user.experience,
    }, 'Profile updated successfully'));
  });
  // @desc    Get current user profile
  // @route   GET /api/auth/profile
  export const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password -refreshToken');
    if (!user) throw new ApiError(404, 'User not found');

    res.json(new ApiResponse(200, user, 'Profile fetched successfully'));
  });

  // @desc    Login user
  // @route   POST /api/auth/login
  export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, 'User not found');

    const isMatch = await user.matchPassword(password);
    if (!isMatch) throw new ApiError(401, 'Wrong password');

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // save refresh token in database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    setTokenCookies(res, accessToken, refreshToken);

    res.json(
      new ApiResponse(200, {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
      }, 'Logged in successfully')
    );
  });

  // @desc    Refresh access token
  // @route   POST /api/auth/refresh
  export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken;

    if (!incomingRefreshToken) throw new ApiError(401, 'No refresh token');

    const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError(401, 'Invalid refresh token');

    // check if refresh token matches what we stored in DB
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, 'Refresh token is expired or used');
    }

    // generate new both tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // update refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    setTokenCookies(res, accessToken, refreshToken);

    res.json(new ApiResponse(200, {}, 'Access token refreshed'));
  });

  // @desc    Logout user
  // @route   POST /api/auth/logout
  export const logoutUser = asyncHandler(async (req, res) => {
    // remove refresh token from DB
    await User.findByIdAndUpdate(req.user._id, {
      refreshToken: null,
    });

    res.cookie('accessToken', '', { maxAge: 0 });
    res.cookie('refreshToken', '', { maxAge: 0 });

    res.json(new ApiResponse(200, {}, 'Logged out successfully'));
  });