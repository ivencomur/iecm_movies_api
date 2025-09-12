const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const Models = require("./models.js");
const passportJWT = require("passport-jwt");

let Users = Models.User;
let JWTStrategy = passportJWT.Strategy;
let ExtractJWT = passportJWT.ExtractJwt;

passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
    },
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

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (jwtPayload, callback) => {
      console.log('JWT Payload:', jwtPayload);
      try {
        const user = await Users.findById(jwtPayload._id);
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