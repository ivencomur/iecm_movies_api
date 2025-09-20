/**
 * @fileoverview Passport authentication strategies configuration
 * @description Configures Local Strategy for username/password authentication and JWT Strategy for token-based authentication
 * @requires passport
 * @requires passport-local
 * @requires passport-jwt
 * @requires ./models
 */

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const Models = require("./models.js");
const passportJWT = require("passport-jwt");

let Users = Models.User;
let JWTStrategy = passportJWT.Strategy;
let ExtractJWT = passportJWT.ExtractJwt;

/**
 * Local authentication strategy configuration
 * @name LocalStrategy
 * @function
 * @description Configures passport to use local username/password authentication
 * Validates user credentials against database and returns user object if successful
 */
passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
    },
    /**
     * Local strategy authentication callback
     * @function
     * @async
     * @param {string} username - Username from request body
     * @param {string} password - Password from request body
     * @param {Function} callback - Passport authentication callback
     * @returns {Promise<void>} Calls callback with (error, user, info)
     * @description Finds user by username and validates password using bcrypt comparison
     */
    async (username, password, callback) => {
      console.log(`Attempting to authenticate user: ${username}`);
      try {
        // Note: Your database stores usernames in 'Username' field (capital U)
        // but your frontend sends 'username' (lowercase)
        const user = await Users.findOne({ Username: username });
        
        if (!user) {
          console.log(`User not found: ${username}`);
          return callback(null, false, { message: "Incorrect username." });
        }
        
        console.log(`User found: ${user.Username}`);
        
        if (!user.validatePassword(password)) {
          console.log(`Password validation failed for user: ${username}`);
          return callback(null, false, { message: "Incorrect password." });
        }
        
        console.log(`Authentication successful for user: ${username}`);
        return callback(null, user);
      } catch (error) {
        console.error("Authentication error:", error);
        return callback(error);
      }
    }
  )
);

/**
 * JWT authentication strategy configuration
 * @name JWTStrategy
 * @function
 * @description Configures passport to use JWT token authentication
 * Validates JWT tokens from Authorization header and returns associated user
 */
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    /**
     * JWT strategy authentication callback
     * @function
     * @async
     * @param {Object} jwtPayload - Decoded JWT payload containing user information
     * @param {string} jwtPayload.Username - User's username from JWT
     * @param {Function} callback - Passport authentication callback
     * @returns {Promise<void>} Calls callback with (error, user)
     * @description Finds user by Username from JWT payload and validates token authenticity
     */
    async (jwtPayload, callback) => {
      console.log('JWT Payload:', jwtPayload);
      try {
        // Corrected to find user by Username to avoid ObjectId type issues
        const user = await Users.findOne({ Username: jwtPayload.Username });
        if (!user) {
          console.log('User not found in JWT verification');
          return callback(null, false);
        }
        console.log('JWT verification successful for user:', user.Username);
        return callback(null, user);
      } catch (error) {
        console.error('JWT verification error:', error);
        return callback(error, false);
      }
    }
  )
);