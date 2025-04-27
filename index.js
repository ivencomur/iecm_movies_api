<<<<<<< HEAD
// Import dependencies
=======
//config
require("dotenv").config();
//dependences
>>>>>>> 2b6f9fa67a14051e2f45d45d6ac3d399d5cea908
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const morgan = require("morgan");
const path = require("path");
const bcrypt = require("bcrypt");
const { validationResult, check } = require("express-validator");

<<<<<<< HEAD
// Define models
let Models; 
=======
//websites/domains api allows access into api
let allowedOrigins = [
  "http://localhost:8080",
  "http://testsite.com",
  "https://ivencomur.github.io",
];


require("./passport");

let Models;
>>>>>>> 2b6f9fa67a14051e2f45d45d6ac3d399d5cea908
try {
  Models = require("./models.js");
} catch (error) {
  console.error("Error requiring models.js:", error);
  process.exit(1); 
}

const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director;
const Actors = Models.Actor;

// Config
require("dotenv").config();
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;

// Setup app
const app = express();

// Connect to db
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

<<<<<<< HEAD
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
    console.log("Connected to MongoDB");
});

// Middleware
app.use(express.json());
=======
app.use(morgan("common"));
//cors policy
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    optionsSuccessStatus: 200,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
>>>>>>> 2b6f9fa67a14051e2f45d45d6ac3d399d5cea908
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("common"));
app.use(bodyParser.urlencoded({ extended: true }));
let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

<<<<<<< HEAD
// Requests/endpoints
=======


let auth = require("./auth")(app);
app.use(passport.initialize());

>>>>>>> 2b6f9fa67a14051e2f45d45d6ac3d399d5cea908
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the MovieMobs API!" });
});

<<<<<<< HEAD
app.get("/movies", passport.authenticate('jwt', { session: false }), async (req, res) => {
   await Movies.find()
            .populate("genre")
            .populate("director")
            .populate("actors")
            .then((movies) => {
                res.status(200).json(movies);
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
              });
          });
app.get("/movies/title/:title", async (req, res) => {
    try {
        const movie = await Movies.findOne({
            title: { $regex: new RegExp(req.params.title, "i") },
        })
            .populate("genre")
            .populate("director")
            .populate("actors");
        if (!movie) {
            return res.status(404).json({ error: "Movie not found." });
        }
        res.status(200).json(movie);
=======
app.get("/documentation", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "documentation.html"));
});

app.post(
  "/users",
  [
    check(
      "username",
      "Username must be alphanumeric and at least 5 characters long"
    )
      .isLength({ min: 5 })
      .isAlphanumeric(),
    check(
      "password",
      "Password is required and must be at least 8 characters long"
    ).isLength({ min: 8 }),
    check("email", "A valid email address is required").isEmail(),
    check("birthday", "Birthday must be a valid date (YYYY-MM-DD)")
      .optional()
      .isISO8601()
      .toDate(),
    check("firstname", "First name must be a non-empty string")
      .optional()
      .isString()
      .notEmpty(),
    check("lastname", "Last name must be a non-empty string")
      .optional()
      .isString()
      .notEmpty(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, password, email, birthday, firstname, lastname } =
        req.body;

      const existingUser = await Users.findOne({
        $or: [{ username: username }, { email: email }],
      });

      if (existingUser) {
        const message =
          existingUser.username === username
            ? `Username "${username}" already exists.`
            : `Email "${email}" is already registered.`;
        return res.status(400).json({ error: message });
      }

      const hashedPassword = Users.hashPassword(password);

      const newUser = new Users({
        username,
        password: hashedPassword,
        email,
        birthday,
        firstname,
        lastname,
      });
      const savedUser = await newUser.save();

      const userResponse = { ...savedUser.toJSON() };
      delete userResponse.password;

      res.status(201).json(userResponse);
    } catch (err) {
      next(err);
    }
  }
);

const requireJWTAuth = passport.authenticate("jwt", { session: false });

app.get("/movies", requireJWTAuth, async (req, res, next) => {
  try {
    const movies = await Movies.find()
      .populate("genre", "name description")
      .populate("director", "name bio")
      .populate("actors", "name");
    res.status(200).json(movies);
  } catch (err) {
    next(err);
  }
});

app.get("/movies/:movieId", requireJWTAuth, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) {
      return res.status(400).json({ error: "Invalid Movie ID format." });
    }
    const movie = await Movies.findById(req.params.movieId)
      .populate("genre")
      .populate("director")
      .populate("actors");

    if (!movie) {
      return res.status(404).json({ error: "Movie not found." });
    }
    res.status(200).json(movie);
  } catch (err) {
    next(err);
  }
});

app.get("/movies/title/:title", requireJWTAuth, async (req, res, next) => {
  try {
    const titleSearch = decodeURIComponent(req.params.title);
    const movie = await Movies.findOne({
      title: { $regex: new RegExp("^" + titleSearch + "$", "i") },
    })
      .populate("genre")
      .populate("director")
      .populate("actors");

    if (!movie) {
      return res
        .status(404)
        .json({ error: `Movie with title "${titleSearch}" not found.` });
    }
    res.status(200).json(movie);
  } catch (err) {
    next(err);
  }
});

app.get("/movies/genre/:genreName", requireJWTAuth, async (req, res, next) => {
  try {
    const genreNameSearch = decodeURIComponent(req.params.genreName);
    const genre = await Genres.findOne({
      name: { $regex: new RegExp("^" + genreNameSearch + "$", "i") },
    });

    if (!genre) {
      return res
        .status(404)
        .json({ error: `Genre "${genreNameSearch}" not found.` });
    }

    const movies = await Movies.find({ genre: genre._id })
      .populate("genre", "name")
      .populate("director", "name")
      .populate("actors", "name");

    res.status(200).json(movies);
  } catch (err) {
    next(err);
  }
});

app.get(
  "/movies/director/:directorName",
  requireJWTAuth,
  async (req, res, next) => {
    try {
      const directorNameSearch = decodeURIComponent(req.params.directorName);
      const director = await Directors.findOne({
        name: { $regex: new RegExp("^" + directorNameSearch + "$", "i") },
      });

      if (!director) {
        return res
          .status(404)
          .json({ error: `Director "${directorNameSearch}" not found.` });
      }

      const movies = await Movies.find({ director: director._id })
        .populate("genre", "name")
        .populate("director", "name")
        .populate("actors", "name");

      res.status(200).json(movies);
    } catch (err) {
      next(err);
    }
  }
);

app.post(
  "/movies",
  requireJWTAuth,
  [
    check("title", "Title is required").trim().notEmpty(),
    check("description", "Description is required").trim().notEmpty(),
    check("genre", "Genre name is required").trim().notEmpty(),
    check("director", "Director name is required").trim().notEmpty(),
    check("actors", "Actors must be an array of names (strings)")
      .optional()
      .isArray(),
    check("imagePath", "ImagePath must be a valid URL")
      .optional({ checkFalsy: true })
      .isURL(),
    check("featured", "Featured must be a boolean").optional().isBoolean(),
    check("releaseYear", "Release year must be a valid year (e.g., 1999)")
      .optional()
      .isInt({ min: 1888, max: new Date().getFullYear() + 5 }),
    check("rating", "Rating must be a number between 0 and 10")
      .optional()
      .isFloat({ min: 0, max: 10 }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        title,
        description,
        genre: genreName,
        director: directorName,
        actors: actorNames = [],
        imagePath,
        featured,
        releaseYear,
        rating,
      } = req.body;

      const existingMovie = await Movies.findOne({ title: title });
      if (existingMovie) {
        return res
          .status(400)
          .json({ error: `Movie with title "${title}" already exists.` });
      }

      const genreDoc = await Genres.findOne({
        name: { $regex: new RegExp("^" + genreName + "$", "i") },
      });
      if (!genreDoc) {
        return res
          .status(400)
          .json({ error: `Genre "${genreName}" not found.` });
      }

      const directorDoc = await Directors.findOne({
        name: { $regex: new RegExp("^" + directorName + "$", "i") },
      });
      if (!directorDoc) {
        return res
          .status(400)
          .json({ error: `Director "${directorName}" not found.` });
      }

      let actorIds = [];
      if (actorNames.length > 0) {
        const actorDocs = await Actors.find({
          name: {
            $in: actorNames.map((name) => new RegExp("^" + name + "$", "i")),
          },
        });
        actorIds = actorDocs.map((actor) => actor._id);

        if (actorIds.length !== actorNames.length) {
          const foundNamesLower = actorDocs.map((doc) =>
            doc.name.toLowerCase()
          );
          const notFoundNames = actorNames.filter(
            (name) => !foundNamesLower.includes(name.toLowerCase())
          );
          console.warn(
            `POST /movies: Some actors provided were not found: ${notFoundNames.join(
              ", "
            )}`
          );
        }
      }

      const newMovie = new Movies({
        title,
        description,
        releaseYear,
        rating,
        genre: genreDoc._id,
        director: directorDoc._id,
        actors: actorIds,
        imagePath,
        featured,
      });
      const savedMovie = await newMovie.save();

      const populatedMovie = await Movies.findById(savedMovie._id)
        .populate("genre")
        .populate("director")
        .populate("actors");

      res.status(201).json(populatedMovie);
    } catch (err) {
      next(err);
    }
  }
);

app.put(
  "/movies/:movieId",
  requireJWTAuth,
  [
    check("title", "Title must be a non-empty string")
      .optional()
      .trim()
      .notEmpty(),
    check("description", "Description must be a non-empty string")
      .optional()
      .trim()
      .notEmpty(),
    check("genre", "Genre name must be a non-empty string")
      .optional()
      .trim()
      .notEmpty(),
    check("director", "Director name must be a non-empty string")
      .optional()
      .trim()
      .notEmpty(),
    check("actors", "Actors must be an array of names (strings)")
      .optional()
      .isArray(),
    check("imagePath", "ImagePath must be a valid URL")
      .optional({ checkFalsy: true })
      .isURL(),
    check("featured", "Featured must be a boolean").optional().isBoolean(),
    check("releaseYear", "Release year must be a valid year (e.g., 1999)")
      .optional()
      .isInt({ min: 1888, max: new Date().getFullYear() + 5 }),
    check("rating", "Rating must be a number between 0 and 10")
      .optional()
      .isFloat({ min: 0, max: 10 }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) {
      return res.status(400).json({ error: "Invalid Movie ID format." });
    }

    try {
      const {
        title,
        description,
        genre: genreName,
        director: directorName,
        actors: actorNames,
        imagePath,
        featured,
        releaseYear,
        rating,
      } = req.body;

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (imagePath !== undefined) updateData.imagePath = imagePath;
      if (featured !== undefined) updateData.featured = featured;
      if (releaseYear !== undefined) updateData.releaseYear = releaseYear;
      if (rating !== undefined) updateData.rating = rating;

      if (genreName !== undefined) {
        const genreDoc = await Genres.findOne({
          name: { $regex: new RegExp("^" + genreName + "$", "i") },
        });
        if (!genreDoc) {
          return res
            .status(400)
            .json({ error: `Genre "${genreName}" not found.` });
        }
        updateData.genre = genreDoc._id;
      }

      if (directorName !== undefined) {
        const directorDoc = await Directors.findOne({
          name: { $regex: new RegExp("^" + directorName + "$", "i") },
        });
        if (!directorDoc) {
          return res
            .status(400)
            .json({ error: `Director "${directorName}" not found.` });
        }
        updateData.director = directorDoc._id;
      }

      if (actorNames !== undefined) {
        if (!Array.isArray(actorNames)) {
          return res
            .status(400)
            .json({ error: "Actors field must be an array of names." });
        }
        const actorDocs = await Actors.find({
          name: {
            $in: actorNames.map((name) => new RegExp("^" + name + "$", "i")),
          },
        });
        updateData.actors = actorDocs.map((actor) => actor._id);

        if (updateData.actors.length !== actorNames.length) {
          console.warn("PUT /movies: Some actors provided were not found.");
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res
          .status(400)
          .json({ error: "No valid fields provided for update." });
      }

      const updatedMovie = await Movies.findByIdAndUpdate(
        req.params.movieId,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate("genre")
        .populate("director")
        .populate("actors");

      if (!updatedMovie) {
        return res.status(404).json({ error: "Movie not found." });
      }

      res.status(200).json(updatedMovie);
    } catch (err) {
      next(err);
    }
  }
);

app.delete("/movies/:movieId", requireJWTAuth, async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) {
    return res.status(400).json({ error: "Invalid Movie ID format." });
  }

  try {
    const deletedMovie = await Movies.findByIdAndDelete(req.params.movieId);

    if (!deletedMovie) {
      return res.status(404).json({ error: "Movie not found." });
    }

    await Users.updateMany(
      { favoriteMovies: req.params.movieId },
      { $pull: { favoriteMovies: req.params.movieId } }
    );

    res
      .status(200)
      .json({ message: `Movie "${deletedMovie.title}" deleted successfully.` });
  } catch (err) {
    next(err);
  }
});

app.get("/movies/:movieId/actors", requireJWTAuth, async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) {
    return res.status(400).json({ error: "Invalid Movie ID format." });
  }
  try {
    const movie = await Movies.findById(req.params.movieId).populate(
      "actors",
      "name bio birth death pictureUrl"
    );
    if (!movie) {
      return res.status(404).json({ error: "Movie not found." });
    }
    res.status(200).json(movie.actors || []);
  } catch (err) {
    next(err);
  }
});

app.get("/users/:username", requireJWTAuth, async (req, res, next) => {
  if (req.user.username !== req.params.username) {
    return res
      .status(403)
      .json({ error: "Forbidden: You can only view your own profile." });
  }

  try {
    const user = await Users.findOne({ username: req.params.username })
      .select("-password")
      .populate("favoriteMovies");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

app.put(
  "/users/:username",
  requireJWTAuth,
  [
    check(
      "username",
      "Username must be alphanumeric and at least 5 characters long"
    )
      .optional()
      .isLength({ min: 5 })
      .isAlphanumeric(),
    check("email", "A valid email address is required").optional().isEmail(),
    check("birthday", "Birthday must be a valid date (YYYY-MM-DD)")
      .optional()
      .isISO8601()
      .toDate(),
    check("firstname", "First name must be a non-empty string")
      .optional()
      .isString()
      .notEmpty(),
    check("lastname", "Last name must be a non-empty string")
      .optional()
      .isString()
      .notEmpty(),
  ],
  async (req, res, next) => {
    if (req.user.username !== req.params.username) {
      return res
        .status(403)
        .json({ error: "Forbidden: You can only update your own profile." });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, email, birthday, firstname, lastname } = req.body;

      const updateData = {};
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (birthday !== undefined) updateData.birthday = birthday;
      if (firstname !== undefined) updateData.firstname = firstname;
      if (lastname !== undefined) updateData.lastname = lastname;

      if (username || email) {
        const orChecks = [];
        if (username) orChecks.push({ username: username });
        if (email) orChecks.push({ email: email });

        const existingUser = await Users.findOne({
          $or: orChecks,
          _id: { $ne: req.user._id },
        });

        if (existingUser) {
          const message =
            existingUser.username === username
              ? `Username "${username}" is already taken.`
              : `Email "${email}" is already registered by another user.`;
          return res.status(400).json({ error: message });
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res
          .status(400)
          .json({ error: "No valid fields provided for update." });
      }

      const updatedUser = await Users.findOneAndUpdate(
        { username: req.params.username },
        { $set: updateData },
        { new: true, runValidators: true }
      ).select("-password");

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found for update." });
      }

      res.status(200).json(updatedUser);
>>>>>>> 2b6f9fa67a14051e2f45d45d6ac3d399d5cea908
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
<<<<<<< HEAD
=======
  }
);

app.post(
  "/users/:username/favorites/:movieId",
  requireJWTAuth,
  async (req, res, next) => {
    if (req.user.username !== req.params.username) {
      return res
        .status(403)
        .json({ error: "Forbidden: You can only modify your own favorites." });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) {
      return res.status(400).json({ error: "Invalid Movie ID format." });
    }

    try {
      const movie = await Movies.findById(req.params.movieId);
      if (!movie) {
        return res.status(404).json({ error: "Movie not found." });
      }

      const user = await Users.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { favoriteMovies: movie._id } },
        { new: true }
      )
        .select("-password")
        .populate("favoriteMovies");

      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }
);

app.delete(
  "/users/:username/favorites/:movieId",
  requireJWTAuth,
  async (req, res, next) => {
    if (req.user.username !== req.params.username) {
      return res
        .status(403)
        .json({ error: "Forbidden: You can only modify your own favorites." });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) {
      return res.status(400).json({ error: "Invalid Movie ID format." });
    }

    try {
      const user = await Users.findByIdAndUpdate(
        req.user._id,
        { $pull: { favoriteMovies: req.params.movieId } },
        { new: true }
      )
        .select("-password")
        .populate("favoriteMovies");

      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }
);

app.delete("/users/:username", requireJWTAuth, async (req, res, next) => {
  if (req.user.username !== req.params.username) {
    return res
      .status(403)
      .json({ error: "Forbidden: You can only delete your own account." });
  }

  try {
    const deletedUser = await Users.findByIdAndDelete(req.user._id);

    if (!deletedUser) {
      console.warn(
        `Attempted to delete user ${req.params.username} (ID: ${req.user._id}) but they were already gone.`
      );
      return res
        .status(404)
        .json({ error: "User not found (perhaps already deleted)." });
    }

    res.status(200).json({
      message: `User account "${deletedUser.username}" deleted successfully.`,
    });
  } catch (err) {
    next(err);
  }
>>>>>>> 2b6f9fa67a14051e2f45d45d6ac3d399d5cea908
});

app.get("/movies/genre/:genreName", async (req, res) => {
    try {
        const movies = await Movies.find({
            genre: { $in: [await Genres.findOne({ name: { $regex: new RegExp(req.params.genreName, "i") } }).select('_id')] }
        })
            .populate("genre")
            .populate("director")
            .populate("actors");
        res.status(200).json(movies);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.get("/movies/director/:directorName", async (req, res) => {
    try {
        const movies = await Movies.find({
            director: { $in: [await Directors.findOne({ name: { $regex: new RegExp(req.params.directorName, "i") } }).select('_id')] }
        })
            .populate("genre")
            .populate("director")
            .populate("actors");
        res.status(200).json(movies);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.get("/movies/:movieId", async (req, res) => {
    try {
        const movie = await Movies.findById(req.params.movieId)
            .populate("genre")
            .populate("director")
            .populate("actors");
        if (!movie) {
            return res.status(404).json({ error: "Movie not found." });
        }
        res.status(200).json(movie);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.post("/movies",
    [
        check('title', 'Title is required').notEmpty(),
        check('description', 'Description is required').notEmpty(),
        check('genre', 'Genre is required').notEmpty(),
        check('director', 'Director is required').notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { title, description, genre, director, actors, imagePath, featured } = req.body;

            const genreDoc = await Genres.findOne({ name: genre });
            if (!genreDoc) {
                return res.status(400).json({ error: "Genre not found." });
            }

            const directorDoc = await Directors.findOne({ name: director });
            if (!directorDoc) {
                return res.status(400).json({ error: "Director not found." });
            }

            const actorDocs = await Actors.find({ name: { $in: actors } });
            const actorIds = actorDocs.map((actor) => actor._id);

            const newMovie = new Movies({
                title,
                description,
                genre: genreDoc._id,
                director: directorDoc._id,
                actors: actorIds,
                imagePath,
                featured,
            });

            const savedMovie = await newMovie.save();
            const populatedMovie = await Movies.findById(savedMovie._id)
                .populate("genre")
                .populate("director")
                .populate("actors");
            res.status(201).json(populatedMovie);
        } catch (err) {
            console.error(err);
            res.status(500).send("Error: " + err);
        }
    });
<<<<<<< HEAD

app.put("/movies/:movieId",
    [
        check('title', 'Title is required').notEmpty(),
        check('description', 'Description is required').notEmpty(),
        check('genre', 'Genre is required').notEmpty(),
        check('director', 'Director is required').notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { title, description, genre, director, actors, imagePath, featured } = req.body;
            const updateData = {};
            if (title) updateData.title = title;
            if (description) updateData.description = description;
            if (genre) {
                const genreDoc = await Genres.findOne({ name: genre });
                if (!genreDoc) return res.status(400).json({ error: "Genre not found." });
                updateData.genre = genreDoc._id;
            }
            if (director) {
                const directorDoc = await Directors.findOne({ name: director });
                if (!directorDoc)
                    return res.status(400).json({ error: "Director not found." });
                updateData.director = directorDoc._id;
            }
            if (actors && Array.isArray(actors)) {
                const actorDocs = await Actors.find({ name: { $in: actors } });
                updateData.actors = actorDocs.map((actor) => actor._id);
            }
            if (imagePath) updateData.imagePath = imagePath;
            if (featured !== undefined) updateData.featured = featured;

            const updatedMovie = await Movies.findByIdAndUpdate(
                req.params.movieId,
                updateData,
                { new: true }
            )
                .populate("genre")
                .populate("director")
                .populate("actors");

            if (!updatedMovie) {
                return res.status(404).json({ error: "Movie not found." });
            }
            res.status(200).json(updatedMovie);
        } catch (err) {
            console.error(err);
            res.status(500).send("Error: " + err);
        }
    });

app.delete("/movies/:movieId", async (req, res) => {
    try {
        const deletedMovie = await Movies.findByIdAndDelete(req.params.movieId);
        if (!deletedMovie) {
            return res.status(404).json({ error: "Movie not found." });
        }
        res.status(200).send("Movie deleted successfully.");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
=======

    if (!genre) {
      return res
        .status(404)
        .json({ error: `Genre "${genreNameSearch}" not found.` });
    }
    res.status(200).json(genre);
  } catch (err) {
    next(err);
  }
});

app.post(
  "/genres",
  requireJWTAuth,
  [
    check("name", "Name is required").trim().notEmpty(),
    check("description", "Description is required").trim().notEmpty(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description } = req.body;
      const newGenre = new Genres({ name, description });
      const savedGenre = await newGenre.save();
      res.status(201).json(savedGenre);
    } catch (err) {
      if (err.code === 11000) {
        return res
          .status(400)
          .json({ error: `Genre name "${req.body.name}" already exists.` });
      }
      next(err);
    }
  }
);

app.put(
  "/genres/:name",
  requireJWTAuth,
  [check("description", "Description is required").trim().notEmpty()],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const genreNameSearch = decodeURIComponent(req.params.name);
      const { description } = req.body;

      const updatedGenre = await Genres.findOneAndUpdate(
        { name: { $regex: new RegExp("^" + genreNameSearch + "$", "i") } },
        { $set: { description } },
        { new: true, runValidators: true }
      );

      if (!updatedGenre) {
        return res
          .status(404)
          .json({ error: `Genre "${genreNameSearch}" not found.` });
      }
      res.status(200).json(updatedGenre);
    } catch (err) {
      next(err);
    }
  }
);

app.delete("/genres/:name", requireJWTAuth, async (req, res, next) => {
  try {
    const genreNameSearch = decodeURIComponent(req.params.name);

    const genre = await Genres.findOne({
      name: { $regex: new RegExp("^" + genreNameSearch + "$", "i") },
    });

    if (!genre) {
      return res
        .status(404)
        .json({ error: `Genre "${genreNameSearch}" not found.` });
    }

    const moviesUsingGenre = await Movies.find({ genre: genre._id }).limit(1);

    if (moviesUsingGenre.length > 0) {
      return res.status(400).json({
        error: `Cannot delete genre "${genre.name}" as it is assigned to one or more movies.`,
      });
    }

    const deletedGenre = await Genres.findByIdAndDelete(genre._id);

    if (!deletedGenre) {
      return res.status(404).json({
        error: `Genre "${genreNameSearch}" not found (concurrent delete?).`,
      });
    }

    res
      .status(200)
      .json({ message: `Genre "${deletedGenre.name}" deleted successfully.` });
  } catch (err) {
    next(err);
  }
>>>>>>> 2b6f9fa67a14051e2f45d45d6ac3d399d5cea908
});

app.get("/movies/:movieId/actors", async (req, res) => {
    try {
        const movie = await Movies.findById(req.params.movieId).populate("actors");
        if (!movie) {
            return res.status(404).json({ error: "Movie not found." });
        }
        res
            .status(200)
            .json(
                movie.actors.map((actor) => ({ _id: actor._id, name: actor.name }))
            );
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.post("/users",
    [
        check('username', 'Username is required').notEmpty(),
        check('password', 'Password is required').notEmpty(),
        check('email', 'Valid email is required').isEmail()
    ],
    async (req, res) => {
        // ... validation ...
        try {
            // ... other user data ...
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new Users({
                username,
                password: hashedPassword, // Store the HASHED password
                email,
                // ...
            });
            // ...
        } catch (err) {
            // ...
        }
    });
<<<<<<< HEAD

    app.put('/users/:username', passport.authenticate('jwt', { session: false }),
    [
        check('email', 'Valid email is required').isEmail(),
        check('username', 'Username is required').notEmpty()
       
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (req.user.username !== req.params.username) {
            return res.status(403).send('Permission denied: You can only update your own profile.'); 
        }

        try {
            const { username, password, email, birthday } = req.body; 
            const updateData = {};
=======

    if (!directors || directors.length === 0) {
      return res.status(404).json({
        error: `No directors found matching "${directorNameSearch}".`,
      });
    }
    res.status(200).json(directors);
  } catch (err) {
    next(err);
  }
});

app.post(
  "/directors",
  requireJWTAuth,
  [
    check("name", "Name is required").trim().notEmpty(),
    check("bio", "Bio is required").trim().notEmpty(),
    check("birth", "Birth date must be a valid date (YYYY-MM-DD)")
      .notEmpty()
      .isISO8601()
      .toDate(),
    check("death", "Death date must be a valid date (YYYY-MM-DD) if provided")
      .optional({ nullable: true })
      .isISO8601()
      .toDate(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, bio, birth, death } = req.body;
      const newDirector = new Directors({
        name,
        bio,
        birth,
        death: death || null,
      });
      const savedDirector = await newDirector.save();
      res.status(201).json(savedDirector);
    } catch (err) {
      if (err.code === 11000) {
        return res
          .status(400)
          .json({ error: `Director name "${req.body.name}" already exists.` });
      }
      next(err);
    }
  }
);

app.put(
  "/directors/:directorId",
  requireJWTAuth,
  [
    check("name", "Name must be a non-empty string")
      .optional()
      .trim()
      .notEmpty(),
    check("bio", "Bio must be a non-empty string").optional().trim().notEmpty(),
    check("birth", "Birth date must be a valid date (YYYY-MM-DD)")
      .optional()
      .isISO8601()
      .toDate(),
    check("death", "Death date must be a valid date (YYYY-MM-DD) or null")
      .optional({ nullable: true })
      .isISO8601()
      .toDate(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.directorId)) {
      return res.status(400).json({ error: "Invalid Director ID format." });
    }

    try {
      const { name, bio, birth, death } = req.body;
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (bio !== undefined) updateData.bio = bio;
      if (birth !== undefined) updateData.birth = birth;
      if (death !== undefined) updateData.death = death;

      if (Object.keys(updateData).length === 0) {
        return res
          .status(400)
          .json({ error: "No valid fields provided for update." });
      }

      const updatedDirector = await Directors.findByIdAndUpdate(
        req.params.directorId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedDirector) {
        return res.status(404).json({ error: "Director not found." });
      }
      res.status(200).json(updatedDirector);
    } catch (err) {
      if (err.code === 11000 && err.keyPattern && err.keyPattern.name) {
        return res.status(400).json({
          error: `Cannot update: Director name "${req.body.name}" is already taken.`,
        });
      }
      next(err);
    }
  }
);

app.delete("/directors/:directorId", requireJWTAuth, async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.directorId)) {
    return res.status(400).json({ error: "Invalid Director ID format." });
  }

  try {
    const moviesUsingDirector = await Movies.find({
      director: req.params.directorId,
    }).limit(1);

    if (moviesUsingDirector.length > 0) {
      const director = await Directors.findById(req.params.directorId).select(
        "name"
      );
      return res.status(400).json({
        error: `Cannot delete director "${
          director ? director.name : "ID: " + req.params.directorId
        }" as they are assigned to one or more movies.`,
      });
    }

    const deletedDirector = await Directors.findByIdAndDelete(
      req.params.directorId
    );

    if (!deletedDirector) {
      return res.status(404).json({ error: "Director not found." });
    }

    res.status(200).json({
      message: `Director "${deletedDirector.name}" deleted successfully.`,
    });
  } catch (err) {
    next(err);
  }
});
>>>>>>> 2b6f9fa67a14051e2f45d45d6ac3d399d5cea908

            if (username) updateData.username = username;
            if (email) updateData.email = email;
            if (birthday) updateData.birthday = birthday;

            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                updateData.password = hashedPassword; 
            }

            const updatedUser = await Users.findOneAndUpdate(
                { username: req.params.username },
                { $set: updateData }, 
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).send('User not found.'); 
            }

            res.json(updatedUser);

        } catch (err) {
            console.error(err);
            res.status(500).send('Server error: ' + err.message); 
        }
    });

<<<<<<< HEAD
app.post("/users/:username/favorites/:movieId", async (req, res) => {
    try {
        const user = await Users.findOneAndUpdate(
            { username: req.params.username },
            { $addToSet: { favoriteMovies: req.params.movieId } },
            { new: true }
        ).populate("favoriteMovies");
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        res
            .status(200)
            .json(
                user.favoriteMovies.map((movie) => ({
                    _id: movie._id,
                    title: movie.title,
                }))
            );
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.delete("/users/:username/favorites/:movieId", async (req, res) => {
    try {
        const user = await Users.findOneAndUpdate(
            { username: req.params.username },
            { $pull: { favoriteMovies: req.params.movieId } },
            { new: true }
        ).populate("favoriteMovies");
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        res
            .status(200)
            .json(
                user.favoriteMovies.map((movie) => ({
                    _id: movie._id,
                    title: movie.title,
                }))
            );
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.delete("/users/:username", async (req, res) => {
    try {
        const deletedUser = await Users.findOneAndDelete({
            username: req.params.username,
        });
        if (!deletedUser) {
            return res.status(404).json({ error: "User not found." });
        }
        res.status(200).send("User deleted successfully.");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.get("/genres", async (req, res) => {
    try {
        const genres = await Genres.find();
        res.status(200).json(genres);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
=======
    if (!actors || actors.length === 0) {
      return res
        .status(404)
        .json({ error: `No actors found matching "${actorNameSearch}".` });
    }
    res.status(200).json(actors);
  } catch (err) {
    next(err);
  }
});

app.get("/actors/:actorId", requireJWTAuth, async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.actorId)) {
    return res.status(400).json({ error: "Invalid Actor ID format." });
  }
  try {
    const actor = await Actors.findById(req.params.actorId);
    if (!actor) {
      return res.status(404).json({ error: "Actor not found." });
    }
    res.status(200).json(actor);
  } catch (err) {
    next(err);
  }
});

app.post(
  "/actors",
  requireJWTAuth,
  [
    check("name", "Name is required").trim().notEmpty(),
    check("bio", "Bio is required").trim().notEmpty(),
    check("birth", "Birth date must be a valid date (YYYY-MM-DD)")
      .notEmpty()
      .isISO8601()
      .toDate(),
    check("death", "Death date must be a valid date (YYYY-MM-DD) if provided")
      .optional({ nullable: true })
      .isISO8601()
      .toDate(),
    check("pictureUrl", "Picture URL must be a valid URL if provided")
      .optional({ nullable: true, checkFalsy: true })
      .isURL(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, bio, birth, death, pictureUrl } = req.body;
      const newActor = new Actors({
        name,
        bio,
        birth,
        death: death || null,
        pictureUrl: pictureUrl || null,
      });
      const savedActor = await newActor.save();
      res.status(201).json(savedActor);
    } catch (err) {
      if (err.code === 11000) {
        return res
          .status(400)
          .json({ error: `Actor name "${req.body.name}" already exists.` });
      }
      next(err);
    }
  }
);

app.put(
  "/actors/:actorId",
  requireJWTAuth,
  [
    check("name", "Name must be a non-empty string")
      .optional()
      .trim()
      .notEmpty(),
    check("bio", "Bio must be a non-empty string").optional().trim().notEmpty(),
    check("birth", "Birth date must be a valid date (YYYY-MM-DD)")
      .optional()
      .isISO8601()
      .toDate(),
    check("death", "Death date must be a valid date (YYYY-MM-DD) or null")
      .optional({ nullable: true })
      .isISO8601()
      .toDate(),
    check("pictureUrl", "Picture URL must be a valid URL or null")
      .optional({ nullable: true, checkFalsy: true })
      .isURL(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.actorId)) {
      return res.status(400).json({ error: "Invalid Actor ID format." });
    }

    try {
      const { name, bio, birth, death, pictureUrl } = req.body;
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (bio !== undefined) updateData.bio = bio;
      if (birth !== undefined) updateData.birth = birth;
      if (death !== undefined) updateData.death = death;
      if (pictureUrl !== undefined) updateData.pictureUrl = pictureUrl;

      if (Object.keys(updateData).length === 0) {
        return res
          .status(400)
          .json({ error: "No valid fields provided for update." });
      }

      const updatedActor = await Actors.findByIdAndUpdate(
        req.params.actorId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedActor) {
        return res.status(404).json({ error: "Actor not found." });
      }
      res.status(200).json(updatedActor);
    } catch (err) {
      if (err.code === 11000 && err.keyPattern && err.keyPattern.name) {
        return res.status(400).json({
          error: `Cannot update: Actor name "${req.body.name}" is already taken.`,
        });
      }
      next(err);
    }
  }
);

app.delete("/actors/:actorId", requireJWTAuth, async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.actorId)) {
    return res.status(400).json({ error: "Invalid Actor ID format." });
  }

  try {
    const moviesWithActor = await Movies.find({
      actors: req.params.actorId,
    }).limit(1);

    if (moviesWithActor.length > 0) {
      const actor = await Actors.findById(req.params.actorId).select("name");
      return res.status(400).json({
        error: `Cannot delete actor "${
          actor ? actor.name : "ID: " + req.params.actorId
        }" as they are assigned to one or more movies.`,
      });
    }

    const deletedActor = await Actors.findByIdAndDelete(req.params.actorId);

    if (!deletedActor) {
      return res.status(404).json({ error: "Actor not found." });
    }

    res
      .status(200)
      .json({ message: `Actor "${deletedActor.name}" deleted successfully.` });
  } catch (err) {
    next(err);
  }
});

const isAdmin = (req, res, next) => {
  console.warn(
    "Admin check middleware not fully implemented for /admin routes. Allowing access for now."
  );
  next();
};

app.get("/admin/users", requireJWTAuth, isAdmin, async (req, res, next) => {
  try {
    const users = await Users.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
>>>>>>> 2b6f9fa67a14051e2f45d45d6ac3d399d5cea908
});

app.get("/genres/:name", async (req, res) => {
    try {
        const genre = await Genres.findOne({
            name: { $regex: new RegExp(req.params.name, "i") },
        });
        if (!genre) {
            return res.status(404).json({ error: "Genre not found." });
        }
        res.status(200).json(genre);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.post("/genres",
    [
        check('name', 'Name is required').notEmpty(),
        check('description', 'Description is required').notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { name, description } = req.body;
            const existingGenre = await Genres.findOne({ name });
            if (existingGenre) {
                return res.status(400).json({ error: "Genre name already exists." });
            }
            const newGenre = new Genres({ name, description });
            const savedGenre = await newGenre.save();
            res.status(201).json(savedGenre);
        } catch (err) {
            console.error(err);
            res.status(500).send("Error: " + err);
        }
    });

app.put("/genres/:name",
    [
        check('description', 'Description is required').notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { description } = req.body;
            const updatedGenre = await Genres.findOneAndUpdate(
                { name: req.params.name },
                { description },
                { new: true }
            );
            if (!updatedGenre) {
                return res.status(404).json({ error: "Genre not found." });
            }
            res.status(200).json(updatedGenre);
        } catch (err) {
            console.error(err);
            res.status(500).send("Error: " + err);
        }
    });

app.delete("/genres/:name", async (req, res) => {
    try {
        const deletedGenre = await Genres.findOneAndDelete({
            name: req.params.name,
        });
        if (!deletedGenre) {
            return res.status(404).json({ error: "Genre not found." });
        }
        res.status(200).send("Genre deleted successfully.");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.get("/directors", async (req, res) => {
    try {
        const directors = await Directors.find();
        res.status(200).json(directors);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

<<<<<<< HEAD
app.get("/directors/name/:name", async (req, res) => {
    try {
        const director = await Directors.findOne({
            name: { $regex: new RegExp(req.params.name, "i") },
        });
        if (!director) {
            return res.status(404).json({ error: "Director not found." });
        }
        res.status(200).json(director);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.get("/directors/:directorId", async (req, res) => {
    try {
        const director = await Directors.findById(req.params.directorId);
        if (!director) {
            return res.status(404).json({ error: "Director not found." });
        }
        res.status(200).json(director);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.post("/directors",
    [
        check('name', 'Name is required').notEmpty(),
        check('bio', 'Bio is required').notEmpty(),
        check('birth', 'Birth date is required').notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { name, bio, birth, death } = req.body;
            const existingDirector = await Directors.findOne({ name });
            if (existingDirector) {
                return res.status(400).json({ error: "Director name already exists." });
            }
            const newDirector = new Directors({ name, bio, birth, death });
            const savedDirector = await newDirector.save();
            res.status(201).json(savedDirector);
        } catch (err) {
            console.error(err);
            res.status(500).send("Error: " + err);
        }
    });

app.put("/directors/:directorId",
    [
        check('name', 'Name is required').notEmpty(),
        check('bio', 'Bio is required').notEmpty(),
        check('birth', 'Birth date is required').notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { name, bio, birth, death } = req.body;
            const updatedDirector = await Directors.findByIdAndUpdate(
                req.params.directorId,
                { name, bio, birth, death },
                { new: true }
            );
            if (!updatedDirector) {
                return res.status(404).json({ error: "Director not found." });
            }
            res.status(200).json(updatedDirector);
        } catch (err) {
            console.error(err);
            res.status(500).send("Error: " + err);
        }
    });

app.delete("/directors/:directorId", async (req, res) => {
    try {
        const deletedDirector = await Directors.findByIdAndDelete(
            req.params.directorId
        );
        if (!deletedDirector) {
            return res.status(404).json({ error: "Director not found." });
        }
        res.status(200).send("Director deleted successfully.");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.get("/actors", async (req, res) => {
    try {
        const actors = await Actors.find();
        res.status(200).json(actors);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.get("/actors/name/:name", async (req, res) => {
    try {
        const actor = await Actors.findOne({
            name: { $regex: new RegExp(req.params.name, "i") },
        });
        if (!actor) {
            return res.status(404).json({ error: "Actor not found." });
        }
        res.status(200).json(actor);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.get("/actors/:actorId", async (req, res) => {
    try {
        const actor = await Actors.findById(req.params.actorId);
        if (!actor) {
            return res.status(404).json({ error: "Actor not found." });
        }
        res.status(200).json(actor);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.post("/actors",
    [
        check('name', 'Name is required').notEmpty(),
        check('bio', 'Bio is required').notEmpty(),
        check('birth', 'Birth date is required').notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { name, bio, birth, death, pictureUrl } = req.body;
            const existingActor = await Actors.findOne({ name });
            if (existingActor) {
                return res.status(400).json({ error: "Actor name already exists." });
            }
            const newActor = new Actors({ name, bio, birth, death, pictureUrl });
            const savedActor = await newActor.save();
            res.status(201).json(savedActor);
        } catch (err) {
            console.error(err);
            res.status(500).send("Error: " + err);
        }
    });

app.put("/actors/:actorId",
    [
        check('name', 'Name is required').notEmpty(),
        check('bio', 'Bio is required').notEmpty(),
        check('birth', 'Birth date is required').notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { name, bio, birth, death, pictureUrl } = req.body;
            const updatedActor = await Actors.findByIdAndUpdate(
                req.params.actorId,
                { name, bio, birth, death, pictureUrl },
                { new: true }
            );
            if (!updatedActor) {
                return res.status(404).json({ error: "Actor not found." });
            }
            res.status(200).json(updatedActor);
        } catch (err) {
            console.error(err);
            res.status(500).send("Error: " + err);
        }
    });

app.delete("/actors/:actorId", async (req, res) => {
    try {
        const deletedActor = await Actors.findByIdAndDelete(req.params.actorId);
        if (!deletedActor) {
            return res.status(404).json({ error: "Actor not found." });
        }
        res.status(200).send("Actor deleted successfully.");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.get("/admin/users", async (req, res) => {
    try {
        const users = await Users.find();
        res
            .status(200)
            .json(
                users.map((user) => ({
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    birthday: user.birthday,
                    firstname: user.firstname,
                    lastname: user.lastname
                }))
            );
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.get("/admin/movies", async (req, res) => {
    try {
        const movies = await Movies.find().populate("genre").populate("director");
        res.status(200).json(
            movies.map((movie) => ({
                _id: movie._id,
                title: movie.title,
                description: movie.description,
                genre: movie.genre ? { name: movie.genre.name } : null,
                director: movie.director ? { name: movie.director.name } : null,
                imagePath: movie.imagePath,
                featured: movie.featured,
            }))
        );
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.get("/admin/genres", async (req, res) => {
    try {
        const genres = await Genres.find();
        res.status(200).json(genres);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.get("/admin/directors", async (req, res) => {
    try {
        const directors = await Directors.find();
        res.status(200).json(directors);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.get("/admin/actors", async (req, res) => {
    try {
        const actors = await Actors.find();
        res.status(200).json(actors);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("There is an error!");
});

app.listen(PORT, () => {
    console.log("Running on port", PORT);
});
=======
app.get("/admin/actors", requireJWTAuth, isAdmin, async (req, res, next) => {
  try {
    const actors = await Actors.find();
    res.status(200).json(actors);
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error("--- Global Error Handler ---");
  console.error("Timestamp:", new Date().toISOString());
  console.error("Request URL:", req.originalUrl);
  console.error("Request Method:", req.method);
  console.error("Error Name:", err.name);
  console.error("Error Message:", err.message);
  if (process.env.NODE_ENV !== "production") {
    console.error("Error Stack:", err.stack);
  }
  console.error("--- End Global Error Handler ---");

  let statusCode = err.status || 500;
  let errorMessage =
    err.message || "An unexpected internal server error occurred.";

  if (err.name === "UnauthorizedError" || err.message === "No auth token") {
    statusCode = 401;
    errorMessage = "Invalid or missing authentication token.";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    errorMessage = `Validation Error: ${err.message}`;
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    errorMessage = `Invalid ID format for parameter '${err.path}'. Value: '${err.value}'`;
  } else if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    errorMessage = `${field.charAt(0).toUpperCase() + field.slice(1)} '${
      err.keyValue[field]
    }' already exists.`;
  } else if (statusCode >= 500) {
    errorMessage = "An internal server error occurred. Please try again later.";
  }

  res.status(statusCode).json({ error: errorMessage });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MovieMobs API Server is listening on Port ${PORT}`);
  console.log(
    `Access documentation (if served locally) at http://localhost:${PORT}/documentation.html`
  );
});
>>>>>>> 2b6f9fa67a14051e2f45d45d6ac3d399d5cea908
