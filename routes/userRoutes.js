const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');




/**
 * @route   POST /api/users/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', UserController.signup);

/**
 * @route   POST /api/users/signin
 * @desc    Authenticate user and sign in
 * @access  Public
 */
router.post('/signin', UserController.signin);

/**
 * @route   PUT /api/users/update
 * @desc    Update user account details
 * @access  Private (User must be logged in)
 */


router.put('/update', UserController.update);

/**
 * @route   DELETE /api/users/delete
 * @desc    Delete user account
 * @access  Private (User must be logged in)
 */
router.delete('/delete', UserController.delete);

/**
 * @route   GET /api/users/account
 * @desc    Get logged-in user's account data
 * @access  Private (User must be logged in)
 */
router.get('/account', UserController.getAccount);

/**
 * @route   GET /api/users/profile/:userId
 * @desc    Get profile data for another user by userId
 * @access  Private (User must be logged in)
 */
router.get('/profile/:userId', UserController.getProfile);

/**
 * @route   PUT /api/users/update-password
 * @desc    Update user password
 * @access  Private (User must be logged in)
 */
router.put('/update-password', UserController.updatePassword);

/**
 * @route   POST /api/users/forget-password
 * @desc    Initiate password reset process
 * @access  Public
 */
router.post('/forget-password', UserController.forgetPassword);

/**
 * @route   GET /api/users/accounts-by-recovery-email
 * @desc    Get all user accounts associated with a specific recovery email
 * @access  Private (User must be logged in)
 */
router.get('/accounts-by-recovery-email',UserController.getAccountsByRecoveryEmail);

module.exports = router;

remove 