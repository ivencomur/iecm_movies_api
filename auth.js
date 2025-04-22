const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret'; // Use env variable!

const jwt = require('jsonwebtoken'),
  passport = require('passport');

require('./passport');

let generateJWTToken = (user) => {
  const payload = { _id: user._id, username: user.username }; // Include _id and username in payload
  return jwt.sign(payload, jwtSecret, {
    subject: user.username,
    expiresIn: '7d',
    algorithm: 'HS256'
  });
}

module.exports = (router) => {
  router.post('/login', (req, res) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error || !user) {
        return res.status(400).json({ error: info ? info.message : 'Login failed', user: false });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          return res.status(500).send(error);
        }
        let token = generateJWTToken(user.toJSON());
        return res.json({ user: user.toJSON(), token: token });
      });
    })(req, res);
  });
};