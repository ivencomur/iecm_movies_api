const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const Models = require("./models.js");
const passportJWT = require("passport-jwt");

let Users = Models.User;
let JWTStrategy = passportJWT.Strategy;
let ExtractJWT = passportJWT.ExtractJwt;

if (!process.env.JWT_SECRET) {
  console.error(
    "FATAL ERROR: JWT_SECRET environment variable is not set in passport.js. JWT Strategy will fail."
  );
}

passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
    },
    async (username, password, callback) => {
      console.log(`Attempting login for user: ${username}`);
      try {
        const user = await Users.findOne({ username: username });

        if (!user) {
          console.log(`Login failed: Incorrect username '${username}'.`);
          return callback(null, false, { message: "Incorrect username." });
        }

        if (!user.validatePassword(password)) {
          console.log(`Login failed: Incorrect password for user '${username}'.`);
          return callback(null, false, { message: "Incorrect password." });
        }

        console.log(`Login successful for user: ${username}`);
        return callback(null, user);
      } catch (error) {
        console.error("Error during LocalStrategy authentication:", error);
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
      try {
        const user = await Users.findById(jwtPayload._id);
        if (!user) {
          return callback(null, false);
        }
        return callback(null, user);
      } catch (error) {
        console.error("Error during JWTStrategy authentication:", error);
        return callback(error, false);
      }
    }
  )
);