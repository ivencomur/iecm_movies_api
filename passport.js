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
        usernameField: 'Username',
        passwordField: 'Password',
      },
      async (username, password, callback) => {
        console.log("passport.js: LocalStrategy - username:", username);
        try {
          const user = await Users.findOne({ Username: username });
          if (!user) {
            console.log("passport.js:   User not found");
            return callback(null, false, { message: 'Incorrect username or password.' });
          }
          console.log("passport.js:   User found, comparing passwords");
          const passwordMatch = await bcrypt.compare(password, user.password);
          console.log("passport.js:   Password match:", passwordMatch);
          if (!passwordMatch) {
            console.log("passport.js:   Password mismatch");
            return callback(null, false, { message: 'Incorrect username or password.' });
          }
          console.log("passport.js:   Authentication successful");
          return callback(null, user);
        } catch (error) {
          console.error("passport.js:   Error:", error);
          return callback(error);
        }
      }
    )
  );