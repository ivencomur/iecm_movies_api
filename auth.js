/**
 * @fileoverview Authentication module for JWT token generation and user login
 * @description Handles user login authentication and JWT token creation using Passport.js
 * @requires jsonwebtoken
 * @requires passport
 * @requires ./passport
 */

const jwt = require("jsonwebtoken");
const passport = require("passport");
require("./passport");

const jwtSecret = process.env.JWT_SECRET;

/**
 * Generates a JWT token for authenticated user
 * @function generateJWTToken
 * @param {Object} user - User object from database
 * @param {string} user.Username - User's username
 * @param {string} user._id - User's database ID
 * @returns {string|null} JWT token string or null if generation fails
 * @description Creates a signed JWT token with 7-day expiration using HS256 algorithm
 */
let generateJWTToken = (user) => {
  if (!jwtSecret) {
    console.error("FATAL ERROR: JWT_SECRET environment variable not set. Cannot sign token.");
    return null;
  }
  
  console.log("User object passed to generateJWTToken:", user);
  
  // Extract username properly - handle both Username and username fields
  const username = user.Username || user.username;
  console.log("Extracted username:", username, "Type:", typeof username);
  
  if (!username || typeof username !== 'string') {
    console.error("Error: User must have a valid username string for JWT generation");
    console.error("Available user fields:", Object.keys(user));
    return null;
  }
  
  return jwt.sign(user, jwtSecret, {
    subject: username.toString(), // Ensure this is always a string
    expiresIn: "7d",
    algorithm: "HS256",
  });
};

/**
 * Configures login endpoint with passport authentication
 * @function
 * @param {Object} router - Express router instance
 * @description Sets up POST /login route with local strategy authentication
 * @returns {void}
 */
module.exports = (router) => {
  /**
   * User login endpoint
   * @name POST/login
   * @function
   * @param {Object} req - Express request object
   * @param {Object} req.body - Login credentials
   * @param {string} req.body.username - User's username
   * @param {string} req.body.password - User's password
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Object} 200 - Login successful with user data and token
   * @returns {Object} 401 - Invalid credentials
   * @returns {Object} 500 - Internal server error or token generation failure
   * @description Authenticates user credentials and returns JWT token for subsequent requests
   */
  router.post("/login", (req, res, next) => {
    passport.authenticate("local", { session: false }, (error, user, info) => {
      if (error) {
        console.error("Authentication error:", error);
        return next(error);
      }

      if (!user) {
        const message = (info && info.message) ? info.message : "Login failed (invalid credentials or user not found).";
        return res.status(401).json({ error: message });
      }

      req.login(user, { session: false }, (error) => {
        if (error) {
          console.error("Login error:", error);
          return next(error);
        }

        try {
          console.log("About to generate JWT for user:", user.Username);
          const userJson = user.toJSON();
          console.log("User JSON:", userJson);
          
          const token = generateJWTToken(userJson);
          if (!token) {
            return res.status(500).json({ error: "Internal server error: Could not generate token." });
          }
          
          const userResponse = { ...userJson };
          delete userResponse.Password; // Remove password from response
          delete userResponse.password; // Handle both cases
          
          console.log("JWT token generated successfully");
          return res.status(200).json({ user: userResponse, token: token });
        } catch (jwtError) {
          console.error("JWT Error:", jwtError);
          return next(jwtError);
        }
      });
    })(req, res, next);
  });
};