const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  Models = require('./models.js'),
  passportJWT = require('passport-jwt'),
  bcrypt = require('bcrypt'); 

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
      console.log(`${username} ${password}`);
      await Users.findOne({ username: username }) 
        .then(async (user) => { 
          if (!user) {
            console.log('incorrect username');
            return callback(null, false, {
              message: 'Incorrect username or password.',
            });
          }

          
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            console.log('incorrect password');
            return callback(null, false, {
              message: 'Incorrect username or password.',
            });
          }
          

          console.log('finished');
          return callback(null, user);
        })
        .catch((error) => {
          console.error(error); 
          return callback(error);
        });
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
        if (user) {
          return callback(null, user);
        } else {
          return callback(null, false); 
        }
      } catch (error) {
        return callback(error, false); 
      }
    }
  )
);