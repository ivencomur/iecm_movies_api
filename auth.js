const jwt = require("jsonwebtoken");
const passport = require("passport");
require("./passport");

const jwtSecret = process.env.JWT_SECRET;

let generateJWTToken = (user) => {
  if (!jwtSecret) {
    console.error("FATAL ERROR: JWT_SECRET environment variable not set. Cannot sign token.");
    return null;
  }
  return jwt.sign(user, jwtSecret, {
    subject: user.username,
    expiresIn: "7d",
    algorithm: "HS256",
  });
};

module.exports = (router) => {
  router.post("/login", (req, res, next) => {
    passport.authenticate("local", { session: false }, (error, user, info) => {
      if (error) {
        return next(error);
      }

      //if user not defined or present return 401 network response 
      if (!user) {
        const message = (info && info.message) ? info.message : "Login failed (invalid credentials or user not found).";
        return res.status(401).json({ error: message });
      }

      //otherwise the user object came through login in
      req.login(user, { session: false }, (error) => {
        if (error) {
          return next(error);
        }

        //create token
        try {
          const token = generateJWTToken(user.toJSON());
          //token not defined return 500 error
          if (!token) {
            return res.status(500).json({ error: "Internal server error: Could not generate token." });
          }
          const userResponse = { ...user.toJSON() };
          //remove password from response so not sent back over network
          delete userResponse.password;
          return res.status(200).json({ user: userResponse, token: token });
        } catch (jwtError) {
          return next(jwtError);
        }
      });
    })(req, res, next);
  });
};