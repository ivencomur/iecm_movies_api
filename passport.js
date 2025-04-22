// passport.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Models = require('./models.js');
const passportJWT = require('passport-jwt');
// Note: bcrypt is no longer needed here if using the model method

let Users = Models.User;
let JWTStrategy = passportJWT.Strategy;
let ExtractJWT = passportJWT.ExtractJwt;

// Strategy for handling username/password login requests
passport.use(
  new LocalStrategy(
    {
      usernameField: 'username', // Field name in the login request body for username
      passwordField: 'password', // Field name in the login request body for password
    },
    async (username, password, callback) => {
      console.log(`Attempting login for username: ${username}`); // Add logging
      try {
        const user = await Users.findOne({ username: username });
        if (!user) {
          console.log('Incorrect username');
          return callback(null, false, { message: 'Incorrect username.' });
        }

        // Use the validatePassword method from the User model
        if (!user.validatePassword(password)) {
          console.log('Incorrect password');
          return callback(null, false, { message: 'Incorrect password.' });
        }

        console.log('Login successful');
        return callback(null, user); // User authenticated successfully
      } catch (error) {
        console.error('Error during LocalStrategy authentication:', error);
        return callback(error);
      }
    }
  )
);

// Strategy for handling JWT authentication for subsequent requests
passport.use(
  new JWTStrategy(
    {
      // Extracts the JWT from the 'Authorization: Bearer <token>' header
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      // ** CRUCIAL: Secret key to verify the JWT signature **
      // This MUST match the secret used to *sign* the token in auth.js
      // It's highly recommended to use an environment variable for this.
      secretOrKey: process.env.JWT_SECRET // Removed weak fallback - MUST set environment variable!
      // If JWT_SECRET is not set, authentication will fail.
    },
    async (jwtPayload, callback) => {
      console.log('JWT Payload received:', jwtPayload); // Add logging
      try {
        // Find the user specified in the JWT payload (_id field)
        const user = await Users.findById(jwtPayload._id);
        if (!user) {
          console.log('User ID from JWT not found in DB');
          return callback(null, false); // User not found
        }
        console.log('User found via JWT');
        return callback(null, user); // User found and attached to req.user
      } catch (error) {
        console.error('Error during JWTStrategy authentication:', error);
        return callback(error, false);
      }
    }
  )
);

// Note: No serializeUser/deserializeUser needed when using JWTs with session: false