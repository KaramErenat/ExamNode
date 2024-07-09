const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

// Signup a new user
exports.signup = async (req, res) => {
  // Validate request body
  const schema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    recoveryEmail: Joi.string().required(),
    DOB: Joi.date().iso().required(),
    mobileNumber: Joi.string().required(),
    role: Joi.string().valid('User', 'Company_HR').required(),
    status: Joi.string().valid('online', 'offline').required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    // Check if email or mobile number already exists
    const existingUser = await User.findOne({ $or: [{ email: req.body.email }, { mobileNumber: req.body.mobileNumber }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Email or mobile number already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Create new user
    const newUser = new User({
      ...req.body,
      password: hashedPassword
    });

    // Save user to database
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Signin user
exports.signin = async (req, res) => {
  const { emailOrMobileNumber, password } = req.body;

  try {
    // Check if user exists with email or mobile number
    const user = await User.findOne({ $or: [{ email: emailOrMobileNumber }, { mobileNumber: emailOrMobileNumber }] });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Update user status to online
    user.status = 'online';
    await user.save();

    res.status(200).json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update user account details
exports.update = async (req, res) => {
  const userId = req.user.userId; // From authentication middleware
  const updateFields = req.body;

  // Validate request body
  const schema = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    email: Joi.string().email(),
    mobileNumber: Joi.string(),
    recoveryEmail: Joi.string(),
    DOB: Joi.date().iso(),
  }).min(1); // At least one field is required to update

  const { error } = schema.validate(updateFields);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user fields
    Object.assign(user, updateFields);

    // Check for email and mobileNumber conflicts
    if (updateFields.email || updateFields.mobileNumber) {
      const conflictingUser = await User.findOne({ $or: [{ email: updateFields.email }, { mobileNumber: updateFields.mobileNumber }] });
      if (conflictingUser && conflictingUser._id.toString() !== userId) {
        return res.status(400).json({ error: 'Email or mobile number already exists' });
      }
    }

    // Save updated user data
    await user.save();

    res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete user account
exports.delete = async (req, res) => {
  const userId = req.user.userId; // From authentication middleware

  try {
    // Find user and delete
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.remove();

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get logged-in user's account data
exports.getAccount = async (req, res) => {
  const userId = req.user.userId; // From authentication middleware

  try {
    // Find user and return account data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get profile data for another user by userId
exports.getProfile = async (req, res) => {
  const { userId } = req.params;

  try {
    // Find user by userId and return profile data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return limited profile data (if required)
    const userProfile = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobileNumber: user.mobileNumber,
      role: user.role,
      status: user.status
      // Add more fields as needed
    };

    res.status(200).json(userProfile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update user password
exports.updatePassword = async (req, res) => {
  const userId = req.user.userId; // From authentication middleware
  const { oldPassword, newPassword } = req.body;

  try {
    // Find user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if old password matches
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid old password' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Save updated password
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Forget password - initiate password reset process (including OTP handling)
exports.forgetPassword = async (req, res) => {
  // Generate OTP
  const generatedOTP = generateOTP(); // Replace with your OTP generation logic

  // Store OTP for the user (example: save it in the user document or a separate OTP collection)
  req.user.otp = generatedOTP;
  await req.user.save();

  // Send OTP to the user (example: send it via email or SMS)
  sendOTP(req.user.email, generatedOTP); // Replace with your OTP sending logic

  res.status(200).json({ message: 'OTP sent successfully' });

  const { email, newPassword, otp } = req.body;

  try {
    // Verify OTP (example: compare with stored OTP for the user)

    // Update user password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Save updated password
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all user accounts associated with a specific recovery email
exports.getAccountsByRecoveryEmail = async (req, res) => {
  const { recoveryEmail } = req.query;

  try {
    // Find all users with the specified recovery email
    const users = await User.find({ recoveryEmail });

    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
