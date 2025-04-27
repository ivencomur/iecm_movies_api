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
        await Users.findOne({ Username: username })
        .then(async (user) => { // Added async here
          if (!user) {
            return callback(null, false, { message: 'Incorrect username or password.' });
          }
          const passwordMatch = await bcrypt.compare(password, user.Password);
          if (!passwordMatch) {
            return callback(null, false, { message: 'Incorrect username or password.' });
          }
          return callback(null, user);
        })
        .catch((error) => {
          return callback(error);
        })
      }
    )
  );

<<<<<<< HEAD

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
=======
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
>>>>>>> 2b6f9fa67a14051e2f45d45d6ac3d399d5cea908
