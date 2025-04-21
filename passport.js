const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  Models = require('./models.js'),
  passportJWT = require('passport-jwt');
const bcrypt = require('bcrypt');

let Users = Models.User,
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJwt;

passport.use(
  new LocalStrategy(
    {
      usernameField: 'username', // Lowercase
      passwordField: 'password', // Lowercase
    },
    async (username, password, callback) => {
      await Users.findOne({ username: username })
        .then(async (user) => {
          if (!user) {
            return callback(null, false, { message: 'Incorrect username or password.' });
          }
          const passwordMatch = await bcrypt.compare(password, user.password);
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

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'your_jwt_secret' // Replace with your actual secret
    },
    async (jwtPayload, callback) => {
      return await Users.findById(jwtPayload._id)
        .then((user) => {
          return callback(null, user);
        })
        .catch((error) => {
          return callback(error);
        });
    }
  )
);