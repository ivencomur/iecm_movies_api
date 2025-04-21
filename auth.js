const jwtSecret = 'your_jwt_secret';

const jwt = require('jsonwebtoken'),
  passport = require('passport');

require('./passport');


let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.username,
    expiresIn: '7d',
    algorithm: 'HS256'
  });
}



module.exports = (router) => {
  router.post('/login', (req, res) => {
    console.log("auth.js: /login - Request received");
    console.log("auth.js:   Request body:", JSON.stringify(req.body));  // Log the whole body
    passport.authenticate('local', { session: false }, (error, user, info) => {
      console.log("auth.js:   Passport callback - error:", error);
      console.log("auth.js:   Passport callback - user:", user);
      console.log("auth.js:   Passport callback - info:", info);

      if (error || !user) {
        return res.status(400).json({ message: error, user: user });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }
        let token = generateJWTToken(user.toJSON());
        console.log("auth.js:   Login successful, token generated");
        return res.json({ user, token });
      });
    })(req, res);
  });
};