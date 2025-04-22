// auth.js
const jwt = require('jsonwebtoken');
const passport = require('passport');
require('./passport'); // Your local passport file

// ** CRUCIAL: Secret key for signing the JWT **
// This MUST match the secret used to *verify* the token in passport.js
// It's highly recommended to use an environment variable.
const jwtSecret = process.env.JWT_SECRET; // Removed weak fallback - MUST set environment variable!

// Function to generate the JWT
let generateJWTToken = (user) => {
  if (!jwtSecret) {
    console.error('FATAL ERROR: JWT_SECRET environment variable is not set.');
    // In a real app, you might throw an error or prevent startup
    // For now, we'll log and potentially let it fail during signing
  }
  return jwt.sign(user, jwtSecret, {
    subject: user.username, // Identifies the user the token belongs to
    expiresIn: '7d',       // Token expiration time (e.g., 7 days)
    algorithm: 'HS256'     // Signing algorithm
  });
}

/* POST login endpoint */
module.exports = (router) => { // router is the Express app instance passed from index.js
  router.post('/login', (req, res) => {
    // Use passport's 'local' strategy for authentication
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error) {
        console.error('Login authentication error:', error);
        return res.status(500).json({ error: 'Internal server error during login.' });
      }
      if (!user) {
        // Log the specific reason if provided by the LocalStrategy
        const message = info && info.message ? info.message : 'Login failed (invalid credentials or user not found).';
        console.log('Login failed:', message);
        return res.status(401).json({ error: message }); // Use 401 Unauthorized for login failures
      }
      // If authentication succeeds, proceed to log the user in (required by Passport)
      // even though sessions are false, this attaches the user to the request briefly
      req.login(user, { session: false }, (error) => {
        if (error) {
          console.error('req.login error:', error);
          return res.status(500).json({ error: 'Internal error after authentication.' });
        }
        // Generate the JWT token
        const token = generateJWTToken(user.toJSON()); // Pass user data to token payload

        // Prepare user data for response (exclude password)
        const userResponse = { ...user.toJSON() };
        delete userResponse.password;

        // Return user data and token
        return res.status(200).json({ user: userResponse, token: token });
      });
    })(req, res); // Invoke the passport middleware
  });
};