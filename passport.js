const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  Models = require('./models.js'),
  passportJWT = require('passport-jwt');

let Users = Models.User,
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJwt;

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'Username', // Keep this as is
        passwordField: 'Password', // Keep this as is
      },
      async (username, password, callback) => {
        console.log("passport.js: Attempting to find user with username =", username); // Add this line
        await Users.findOne({ Username: username }) // Keep this as is
        .then(async (user) => {
          if (!user) {
            console.log("passport.js: User not found"); // Add this line
            return callback(null, false, { message: 'Incorrect username or password.' });
          }
          console.log("passport.js: User found, comparing passwords"); // Add this line
          const passwordMatch = await bcrypt.compare(password, user.Password);
          console.log("passport.js: Password match result:", passwordMatch); // Add this line
          if (!passwordMatch) {
            console.log("passport.js: Password comparison failed"); // Add this line
            return callback(null, false, { message: 'Incorrect username or password.' });
          }
          console.log("passport.js: Authentication successful"); // Add this line
          return callback(null, user);
        })
        .catch((error) => {
          console.log("passport.js: Error during authentication:", error); // Add this line
          return callback(error);
        })
      }
    )
  );


passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'your_jwt_secret'
}, async (jwtPayload, callback) => {
  return await Users.findById(jwtPayload._id)
    .then((user) => {
      return callback(null, user);
    })
    .catch((error) => {
      return callback(error)
    });
}));