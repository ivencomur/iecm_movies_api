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
      console.log("passpor.js: Attempting to find user with username = ");
      await Users.findOne({ username: username });
      .then(async (user) => {
         if (!user) {
          console.log("passport.js: User not found");
           return callback(null, false, { message: 'Incorrect username.' });
         }
         conso;
         if (!passwordMatch) {
           return callback(null, false, { message: 'Incorrect password.' });
         }
         return callback(null, user);
       } catch (error) {
         return callback(error);
       }
     }
   )
 );

 passport.use(
   new JWTStrategy(
     {
       jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
       secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret' // Use env variable!
     },
     async (jwtPayload, callback) => {
       try {
         const user = await Users.findById(jwtPayload._id);
         if (!user) {
           return callback(null, false);
         }
         return callback(null, user);
       } catch (error) {
         return callback(error, false);
       }
     }
   )
 );