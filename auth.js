/**
 * @file This file handles user login and JWT token generation.
 * @requires jsonwebtoken
 * @requires passport
 * @requires ./passport
 */

const jwt = require("jsonwebtoken");
const passport = require("passport");
require("./passport");

const jwtSecret = process.env.JWT_SECRET;

/**
 * Generates a JWT token for a user.
 * @function generateJWTToken
 * @param {Object} user - The user object to sign the token for.
 * @returns {string | null} The generated JWT token or null if secret is not set.
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
 * Configures the /login endpoint for user authentication.
 * @param {Object} router - The Express router.
 * @returns {void}
 */
module.exports = (router) => {
  /**
   * Handles user login requests, authenticating the user and returning a JWT.
   * @name POST /login
   * @function
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @param {function} next - Express next middleware function.
   * @returns {void}
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