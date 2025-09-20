require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const Models = require("./models.js");
const { check, validationResult } = require("express-validator");
const cors = require("cors");

const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director;
const Actors = Models.Actor;

const app = express();

// --- COMPREHENSIVE CORS Configuration ---
const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:4200",
  "https://iecm-moviemobs-frontend-client-final.onrender.com"
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.log(`CORS blocked origin: ${origin}`);
    const msg = `The CORS policy for this origin doesn't allow access from the particular origin: ${origin}`;
    return callback(new Error(msg), false);
  },
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type', 
    'Accept',
    'Authorization',
    'X-Access-Token'
  ]
};

// Apply CORS before any other middleware
app.use(cors(corsOptions));

// --- Core Middleware ---
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- Authentication and Passport ---
let auth = require("./auth")(app);
const passport = require("passport");
require("./passport");

// Morgan logging
app.use(morgan("combined"));

// Static files
app.use(express.static("public"));

// Database Connection
mongoose
  .connect(process.env.CONNECTION_URI)
  .then(() => {
    console.log("DB Connection successful");
  })
  .catch((err) => console.error("DB Connection error:", err));

// --- API Endpoints ---

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to MovieMobs API!",
    status: "API is running",
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const movies = await Movies.find().populate('Genre Director Actors');
    res.json(movies);
  } catch (err) {
    next(err);
  }
});

app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const movie = await Movies.findOne({ Title: req.params.Title }).populate('Genre Director Actors');
    if (!movie) return res.status(404).send('Movie not found');
    res.json(movie);
  } catch (err) {
    next(err);
  }
});

app.get("/movies/genre/:genreName", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
      const movie = await Movies.findOne({ "Genre.Name": req.params.genreName });
      if (!movie) return res.status(404).send("Genre not found");
      res.json(movie.Genre);
    } catch (err) {
      res.status(500).send("Error: " + err);
    }
  }
);

app.get("/movies/directors/:directorName", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
      const movie = await Movies.findOne({ "Director.Name": req.params.directorName });
      if (!movie) return res.status(404).send("Director not found");
      res.json(movie.Director);
    } catch (err) {
      res.status(500).send("Error: " + err);
    }
  }
);

app.post("/users", [
    check("Username", "Username is required").isLength({ min: 5 }),
    check("Username", "Username contains non alphanumeric characters - not allowed.").isAlphanumeric(),
    check("Password", "Password is required").not().isEmpty(),
    check("Email", "Email does not appear to be valid").isEmail(),
  ], async (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let hashedPassword = Users.hashPassword(req.body.Password);
    try {
      const user = await Users.findOne({ Username: req.body.Username });
      if (user) {
        return res.status(400).send(req.body.Username + " already exists");
      }
      const newUser = await Users.create({
        Username: req.body.Username,
        Password: hashedPassword,
        Email: req.body.Email,
        Birthday: req.body.Birthday,
      });
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).send("Error: " + error);
    }
  }
);

app.get("/user", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
      const user = await Users.findById(req.user._id).populate("FavoriteMovies").select("-Password");
      if (!user) return res.status(404).send("User not found");
      res.status(200).json(user);
    } catch (err) {
      res.status(500).send("Error: " + err);
    }
  }
);

app.put("/user", [
    check("Username", "Username is required").optional().isLength({ min: 5 }),
    check("Username", "Username contains non alphanumeric characters - not allowed.").optional().isAlphanumeric(),
    check("Password", "Password is required").optional().not().isEmpty(),
    check("Email", "Email does not appear to be valid").optional().isEmail(),
  ], passport.authenticate("jwt", { session: false }), async (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    try {
      const updatedUser = await Users.findByIdAndUpdate(req.user._id, {
          $set: {
            Username: req.body.Username,
            Password: req.body.Password ? Users.hashPassword(req.body.Password) : undefined,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
          },
        }, { new: true }).select("-Password");
      res.json(updatedUser);
    } catch (err) {
      res.status(500).send("Error: " + err);
    }
  }
);

app.post("/user/favorites/:MovieID", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
      const updatedUser = await Users.findByIdAndUpdate(req.user._id, {
          $push: { FavoriteMovies: req.params.MovieID },
        }, { new: true }).populate("FavoriteMovies").select("-Password");
      res.json(updatedUser);
    } catch (err) {
      res.status(500).send("Error: " + err);
    }
  }
);

app.delete("/user/favorites/:MovieID", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
      const updatedUser = await Users.findByIdAndUpdate(req.user._id, {
          $pull: { FavoriteMovies: req.params.MovieID },
        }, { new: true }).populate("FavoriteMovies").select("-Password");
      res.json(updatedUser);
    } catch (err) {
      res.status(500).send("Error: " + err);
    }
  }
);

app.delete("/user", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
      const user = await Users.findByIdAndRemove(req.user._id);
      if (!user) {
        res.status(404).send(req.user.Username + " was not found");
      } else {
        res.status(200).send(req.user.Username + " was deleted.");
      }
    } catch (err) {
      res.status(500).send("Error: " + err);
    }
  }
);

app.put("/users/:Username", passport.authenticate("jwt", { session: false }), async (req, res) => {
    if (req.user.Username !== req.params.Username) {
      return res.status(400).send("Permission denied");
    }
    try {
      const updatedUser = await Users.findOneAndUpdate({ Username: req.params.Username }, {
          $set: {
            Username: req.body.Username,
            Password: req.body.Password ? Users.hashPassword(req.body.Password) : undefined,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
          },
        }, { new: true }).select("-Password");
      res.json(updatedUser);
    } catch (err) {
      res.status(500).send("Error: " + err);
    }
  }
);

app.get("/users/:Username", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
      const user = await Users.findOne({ Username: req.params.Username }).populate("FavoriteMovies").select("-Password");
      if (!user) return res.status(404).send("User not found");
      res.json(user);
    } catch (err) {
      res.status(500).send("Error: " + err);
    }
  }
);

app.post("/users/:Username/movies/:MovieID", passport.authenticate("jwt", { session: false }), async (req, res) => {
    if (req.user.Username !== req.params.Username) {
      return res.status(400).send("Permission denied");
    }
    try {
      const updatedUser = await Users.findOneAndUpdate({ Username: req.params.Username }, {
          $push: { FavoriteMovies: req.params.MovieID },
        }, { new: true }).populate("FavoriteMovies").select("-Password");
      res.json(updatedUser);
    } catch (err) {
      res.status(500).send("Error: " + err);
    }
  }
);

app.delete("/users/:Username/movies/:MovieID", passport.authenticate("jwt", { session: false }), async (req, res) => {
    if (req.user.Username !== req.params.Username) {
      return res.status(400).send("Permission denied");
    }
    try {
      const updatedUser = await Users.findOneAndUpdate({ Username: req.params.Username }, {
          $pull: { FavoriteMovies: req.params.MovieID },
        }, { new: true }).populate("FavoriteMovies").select("-Password");
      res.json(updatedUser);
    } catch (err) {
      res.status(500).send("Error: " + err);
    }
  }
);

app.delete("/users/:Username", passport.authenticate("jwt", { session: false }), async (req, res) => {
    if (req.user.Username !== req.params.Username) {
      return res.status(400).send("Permission denied");
    }
    try {
      const user = await Users.findOneAndRemove({ Username: req.params.Username });
      if (!user) {
        res.status(400).send(req.params.Username + " was not found");
      } else {
        res.status(200).send(req.params.Username + " was deleted.");
      }
    } catch (err) {
      res.status(500).send("Error: " + err);
    }
  }
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!", details: err.message });
});

// Listener
const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log("Listening on Port " + port);
});