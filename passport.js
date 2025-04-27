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