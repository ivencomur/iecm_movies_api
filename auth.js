const jwtSecret = 'your_jwt_secret';

const jwt = require('jsonwebtoken'),
  passport = require('passport');

require('./passport');


let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.Username,
    expiresIn: '7d',
    algorithm: 'HS256'
  });
}



module.exports = (router) => {
  router.post('/login', (req, res) => {
    console.log("Login attempt: username =", req.body.username); // Add this line
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error || !user) {
        console.log("Login failed:", info ? info.message : error); // Add this line
        return res.status(400).json({
          message: 'Something is not right',
          user: user
        });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }
        let token = generateJWTToken(user.toJSON());
        console.log("Login successful, token generated"); // Add this line
        return res.json({ user, token });
      });
    })(req, res);
  });
}