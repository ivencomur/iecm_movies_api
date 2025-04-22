// Import dependencies
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const path = require("path");
const bcrypt = require("bcrypt");
const { validationResult, check } = require("express-validator");
const passport = require('passport');
require('./passport'); // This likely configures Passport strategies

// Define models
let Models;
try {
  Models = require("./models.js");
} catch (error) {
  console.error("Error requiring models.js:", error);
  process.exit(1); // Exit if models can't be loaded
}

const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director;
const Actors = Models.Actor;

// Config - Use environment variables for sensitive data
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI; // Make sure MONGO_URI is set in your environment

if (!MONGO_URI) {
  console.error("FATAL ERROR: MONGO_URI environment variable is not set.");
  process.exit(1);
}

// Setup app
const app = express();

// Connect to db
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }) // Added standard options
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit if DB connection fails
  });

// Middleware
app.use(morgan("common")); // Logging middleware
app.use(express.static(path.join(__dirname, "public"))); // Serve static files
app.use(bodyParser.json()); // Use body-parser's json() middleware (express.json() is equivalent and preferred now)
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

// CORS Middleware (Example - adjust origin as needed for security)
const cors = require('cors');
// app.use(cors()); // Allows all origins - adjust for production
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    // Or allow specific origins
    // Replace '*' with your allowed frontend origin in production
    // e.g., origin === 'https://myfrontend.com'
    if (!origin || ['http://localhost:1234', 'http://localhost:4200', '*'].includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));


// ---- Authentication Setup ----
// Import and setup authentication AFTER 'app' is created and bodyParser is configured.
// The './auth' module likely defines the /login endpoint and attaches it to 'app'.
let auth = require('./auth')(app);

// Initialize Passport middleware AFTER the auth module setup.
// This makes passport strategies available for protecting routes.
app.use(passport.initialize());
// Note: You don't need app.use(passport.session()) if you are using JWTs ('session: false')


// ---- Requests/Endpoints ----

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'documentation.html')); // Serve documentation
  // Or: res.json({ message: "Welcome to the MovieMobs API!" });
});

// *** MOVIE ENDPOINTS (JWT Protected) ***
app.get("/movies", passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const movies = await Movies.find()
      .populate("genre")
      .populate("director")
      .populate("actors");
    res.status(200).json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve movies", message: err.message });
  }
});

app.get("/movies/title/:title", passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const movie = await Movies.findOne({
      // Case-insensitive search
      title: { $regex: new RegExp('^' + req.params.title + '$', "i") },
    })
      .populate("genre")
      .populate("director")
      .populate("actors");
    if (!movie) {
      return res.status(404).json({ error: `Movie with title "${req.params.title}" not found.` });
    }
    res.status(200).json(movie);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve movie", message: err.message });
  }
});

app.get("/movies/genre/:genreName", passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    // Find the genre ID first
    const genre = await Genres.findOne({ name: { $regex: new RegExp('^' + req.params.genreName + '$', "i") } });
    if (!genre) {
      return res.status(404).json({ error: `Genre "${req.params.genreName}" not found.` });
    }
    // Find movies with that genre ID
    const movies = await Movies.find({ genre: genre._id })
      .populate("genre")
      .populate("director")
      .populate("actors");
    res.status(200).json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve movies by genre", message: err.message });
  }
});

app.get("/movies/director/:directorName", passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    // Find the director ID first
    const director = await Directors.findOne({ name: { $regex: new RegExp('^' + req.params.directorName + '$', "i") } });
     if (!director) {
      return res.status(404).json({ error: `Director "${req.params.directorName}" not found.` });
    }
    // Find movies with that director ID
    const movies = await Movies.find({ director: director._id })
      .populate("genre")
      .populate("director")
      .populate("actors");
    res.status(200).json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve movies by director", message: err.message });
  }
});

app.get("/movies/:movieId", passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    // Validate if movieId is a valid MongoDB ObjectId
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
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve movie by ID", message: err.message });
  }
});

// Add a new movie
app.post("/movies",
  passport.authenticate('jwt', { session: false }),
  [
    // Validation middleware
    check('title', 'Title is required').notEmpty(),
    check('description', 'Description is required').notEmpty(),
    check('genre', 'Genre name is required').notEmpty(), // Expecting genre name
    check('director', 'Director name is required').notEmpty(), // Expecting director name
    // Actors can be optional or an empty array
    check('actors', 'Actors must be an array of names').optional().isArray(),
    check('imagePath', 'ImagePath must be a URL').optional().isURL(),
    check('featured', 'Featured must be a boolean').optional().isBoolean()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, genre: genreName, director: directorName, actors: actorNames = [], imagePath, featured } = req.body;

      // Check if movie already exists
      const existingMovie = await Movies.findOne({ title: title });
      if (existingMovie) {
          return res.status(400).json({ error: `Movie with title "${title}" already exists.` });
      }

      // Find Genre ObjectId
      const genreDoc = await Genres.findOne({ name: { $regex: new RegExp('^' + genreName + '$', "i") } });
      if (!genreDoc) {
        return res.status(400).json({ error: `Genre "${genreName}" not found.` });
      }

      // Find Director ObjectId
      const directorDoc = await Directors.findOne({ name: { $regex: new RegExp('^' + directorName + '$', "i") } });
      if (!directorDoc) {
        return res.status(400).json({ error: `Director "${directorName}" not found.` });
      }

      // Find Actor ObjectIds (handle case-insensitivity if needed)
      const actorDocs = await Actors.find({ name: { $in: actorNames.map(name => new RegExp('^' + name + '$', 'i')) } });
      const actorIds = actorDocs.map((actor) => actor._id);
      // Optional: Check if all requested actors were found
      if (actorIds.length !== actorNames.length) {
          console.warn("Some actors provided were not found in the database.");
          // Decide if this should be an error or just a warning
      }

      const newMovie = new Movies({
        title,
        description,
        genre: genreDoc._id,
        director: directorDoc._id,
        actors: actorIds, // Use the array of ObjectIds
        imagePath,
        featured,
      });

      const savedMovie = await newMovie.save();
      // Populate the saved movie before sending response
      const populatedMovie = await Movies.findById(savedMovie._id)
        .populate("genre")
        .populate("director")
        .populate("actors");
      res.status(201).json(populatedMovie);
    } catch (err) {
      console.error(err);
      // More specific error handling could be added here
      if (err.name === 'ValidationError') {
          return res.status(400).json({ error: "Movie validation failed", message: err.message });
      }
      res.status(500).json({ error: "Failed to create movie", message: err.message });
    }
  });

// Update a movie
app.put("/movies/:movieId",
  passport.authenticate('jwt', { session: false }),
  [
    // Optional validation: If fields are present, validate them
    check('title', 'Title must be a non-empty string').optional().notEmpty(),
    check('description', 'Description must be a non-empty string').optional().notEmpty(),
    check('genre', 'Genre name must be a non-empty string').optional().notEmpty(),
    check('director', 'Director name must be a non-empty string').optional().notEmpty(),
    check('actors', 'Actors must be an array of names').optional().isArray(),
    check('imagePath', 'ImagePath must be a URL').optional().isURL(),
    check('featured', 'Featured must be a boolean').optional().isBoolean()
  ],
  async (req, res) => {
    // Check for validation errors on provided fields
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Validate if movieId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) {
        return res.status(400).json({ error: "Invalid Movie ID format." });
    }

    try {
      const { title, description, genre: genreName, director: directorName, actors: actorNames, imagePath, featured } = req.body;
      const updateData = {};

      // Build update object conditionally
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (imagePath !== undefined) updateData.imagePath = imagePath;
      if (featured !== undefined) updateData.featured = featured;

      // Handle Genre update
      if (genreName !== undefined) {
        const genreDoc = await Genres.findOne({ name: { $regex: new RegExp('^' + genreName + '$', "i") } });
        if (!genreDoc) return res.status(400).json({ error: `Genre "${genreName}" not found.` });
        updateData.genre = genreDoc._id;
      }

      // Handle Director update
      if (directorName !== undefined) {
        const directorDoc = await Directors.findOne({ name: { $regex: new RegExp('^' + directorName + '$', "i") } });
        if (!directorDoc) return res.status(400).json({ error: `Director "${directorName}" not found.` });
        updateData.director = directorDoc._id;
      }

      // Handle Actors update
      if (actorNames !== undefined) { // Check if actors array was provided in the request
          if (!Array.isArray(actorNames)) {
               return res.status(400).json({ error: "Actors field must be an array of names." });
          }
          const actorDocs = await Actors.find({ name: { $in: actorNames.map(name => new RegExp('^' + name + '$', 'i')) } });
          updateData.actors = actorDocs.map((actor) => actor._id);
          // Optional: Check if all requested actors were found
          if (updateData.actors.length !== actorNames.length) {
              console.warn("During update, some actors provided were not found.");
          }
      }

      // Find and update the movie
      const updatedMovie = await Movies.findByIdAndUpdate(
        req.params.movieId,
        { $set: updateData }, // Use $set to update only provided fields
        { new: true, runValidators: true } // Return the updated doc, run schema validators
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
       if (err.name === 'ValidationError') {
          return res.status(400).json({ error: "Movie update validation failed", message: err.message });
      }
      res.status(500).json({ error: "Failed to update movie", message: err.message });
    }
  });

// Delete a movie
app.delete("/movies/:movieId", passport.authenticate('jwt', { session: false }), async (req, res) => {
   // Validate if movieId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) {
        return res.status(400).json({ error: "Invalid Movie ID format." });
    }
  try {
    const deletedMovie = await Movies.findByIdAndDelete(req.params.movieId);
    if (!deletedMovie) {
      return res.status(404).json({ error: "Movie not found." });
    }
    // Also remove this movie from all users' favorite lists
    await Users.updateMany(
        { favoriteMovies: req.params.movieId },
        { $pull: { favoriteMovies: req.params.movieId } }
    );
    res.status(200).json({ message: `Movie "${deletedMovie.title}" deleted successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete movie", message: err.message });
  }
});

// Get actors for a specific movie ID
app.get("/movies/:movieId/actors", passport.authenticate('jwt', { session: false }), async (req, res) => {
    // Validate if movieId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) {
        return res.status(400).json({ error: "Invalid Movie ID format." });
    }
  try {
    const movie = await Movies.findById(req.params.movieId).populate("actors", "name bio birth death pictureUrl"); // Populate specific fields
    if (!movie) {
      return res.status(404).json({ error: "Movie not found." });
    }
    res.status(200).json(movie.actors); // Send the populated actor documents
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get movie cast", message: err.message });
  }
});

// *** USER ENDPOINTS ***

// Register a new user (Public Endpoint - NO JWT required)
app.post("/users",
  [
    // Validation middleware
    check('username', 'Username must be alphanumeric and at least 5 characters long').isLength({ min: 5 }).isAlphanumeric(),
    check('password', 'Password is required and must be at least 8 characters long').isLength({ min: 8 }),
    check('email', 'A valid email address is required').isEmail(),
    check('birthday', 'Birthday must be a valid date').optional().isISO8601().toDate(), // Validate as date if provided
    check('firstname', 'First name must be a string').optional().isString().notEmpty(),
    check('lastname', 'Last name must be a string').optional().isString().notEmpty()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, password, email, birthday, firstname, lastname } = req.body;

      // Check if username or email already exists
      const existingUser = await Users.findOne({ $or: [{ username: username }, { email: email }] });
      if (existingUser) {
        const message = existingUser.username === username
          ? `Username "${username}" already exists.`
          : `Email "${email}" is already registered.`;
        return res.status(400).json({ error: message });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds = 10

      // Create the new user
      const newUser = new Users({
        username,
        password: hashedPassword, // Store the hashed password
        email,
        birthday,
        firstname,
        lastname
        // favoriteMovies will default to an empty array
      });

      // Save the user
      const savedUser = await newUser.save();

      // Respond with the created user data (excluding password)
      res.status(201).json({
        _id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        birthday: savedUser.birthday,
        firstname: savedUser.firstname,
        lastname: savedUser.lastname,
        favoriteMovies: savedUser.favoriteMovies
      });

    } catch (err) {
      console.error(err);
       if (err.name === 'ValidationError') {
          return res.status(400).json({ error: "User registration validation failed", message: err.message });
      }
      res.status(500).json({ error: "Failed to register user", message: err.message });
    }
  });

// User Login - This route is defined in auth.js and attached via 'let auth = require('./auth')(app);'
// Example placeholder: app.post("/login", (req, res) => { /* Handled by auth.js */ });

// Get user data by username (Protected - User can only get their own data unless admin)
app.get('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    // Check if the authenticated user matches the requested username
    if (req.user.username !== req.params.username) {
        // Optional: Add role check here for admins later
        return res.status(403).json({ error: "Forbidden: You can only view your own profile."});
    }
    try {
        const user = await Users.findOne({ username: req.params.username })
            .select('-password') // Exclude password from the result
            .populate('favoriteMovies'); // Populate favorite movies

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to retrieve user data", message: err.message });
    }
});


// Update user data by username (Protected - User can only update their own data)
app.put('/users/:username',
    passport.authenticate('jwt', { session: false }),
    [ // Add validation for updated fields
        check('username', 'Username must be alphanumeric and at least 5 characters long').optional().isLength({ min: 5 }).isAlphanumeric(),
        // Password update should ideally be a separate endpoint for security
        // check('password', 'Password must be at least 8 characters long').optional().isLength({ min: 8 }),
        check('email', 'A valid email address is required').optional().isEmail(),
        check('birthday', 'Birthday must be a valid date').optional().isISO8601().toDate(),
        check('firstname', 'First name must be a string').optional().isString().notEmpty(),
        check('lastname', 'Last name must be a string').optional().isString().notEmpty()
    ],
    async (req, res) => {
        // Check authorization: Ensure the logged-in user matches the username in the URL
        if (req.user.username !== req.params.username) {
            return res.status(403).json({ error: "Forbidden: You can only update your own profile."});
        }

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { username, email, birthday, firstname, lastname } = req.body;
            const updateData = {};

            // Build update object conditionally
            if (username !== undefined) updateData.username = username;
            if (email !== undefined) updateData.email = email;
            if (birthday !== undefined) updateData.birthday = birthday;
            if (firstname !== undefined) updateData.firstname = firstname;
            if (lastname !== undefined) updateData.lastname = lastname;

            // Handle potential username/email conflicts if they are being changed
            if (username || email) {
                const conflictCheck = {};
                if (username) conflictCheck.username = username;
                if (email) conflictCheck.email = email;

                const existingUser = await Users.findOne({
                     $or: [
                         { username: username },
                         { email: email }
                     ],
                     _id: { $ne: req.user._id } // Check for other users with the same username/email
                 });

                if (existingUser) {
                    const message = existingUser.username === username
                        ? `Username "${username}" is already taken.`
                        : `Email "${email}" is already registered by another user.`;
                    return res.status(400).json({ error: message });
                }
            }

            // Note: Password update is intentionally omitted here.
            // It's better practice to have a separate, more secure endpoint like /users/:username/password

            const updatedUser = await Users.findOneAndUpdate(
                { username: req.params.username }, // Find user by the original username from the URL param
                { $set: updateData },
                { new: true, runValidators: true } // Return updated doc, run schema validation
            ).select('-password'); // Exclude password

            if (!updatedUser) {
                return res.status(404).json({ error: "User not found." });
            }
            res.status(200).json(updatedUser);

        } catch (err) {
            console.error(err);
            if (err.name === 'ValidationError') {
                return res.status(400).json({ error: "User update validation failed", message: err.message });
            }
            res.status(500).json({ error: "Failed to update user profile", message: err.message });
        }
});


// Add a movie to user's favorites (Protected)
app.post("/users/:username/favorites/:movieId", passport.authenticate('jwt', { session: false }), async (req, res) => {
   // Authorization check
    if (req.user.username !== req.params.username) {
        return res.status(403).json({ error: "Forbidden: You can only modify your own favorites."});
    }
    // Validate if movieId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) {
        return res.status(400).json({ error: "Invalid Movie ID format." });
    }

  try {
      // Check if the movie exists
      const movie = await Movies.findById(req.params.movieId);
      if (!movie) {
          return res.status(404).json({ error: "Movie not found." });
      }

      // Add movie to favorites using $addToSet to prevent duplicates
      const user = await Users.findOneAndUpdate(
        { username: req.params.username },
        { $addToSet: { favoriteMovies: req.params.movieId } }, // Use movie's ObjectId
        { new: true } // Return the updated user document
      ).select('-password').populate('favoriteMovies'); // Exclude password, populate favorites

    if (!user) {
      // This shouldn't happen if authentication/authorization passed, but check anyway
      return res.status(404).json({ error: "User not found." });
    }
    res.status(200).json(user); // Return the updated user profile with populated favorites

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add movie to favorites", message: err.message });
  }
});

// Remove a movie from user's favorites (Protected)
app.delete("/users/:username/favorites/:movieId", passport.authenticate('jwt', { session: false }), async (req, res) => {
   // Authorization check
    if (req.user.username !== req.params.username) {
        return res.status(403).json({ error: "Forbidden: You can only modify your own favorites."});
    }
    // Validate if movieId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) {
        return res.status(400).json({ error: "Invalid Movie ID format." });
    }
  try {
    const user = await Users.findOneAndUpdate(
      { username: req.params.username },
      { $pull: { favoriteMovies: req.params.movieId } }, // Use $pull to remove the ObjectId
      { new: true }
    ).select('-password').populate('favoriteMovies'); // Exclude password, populate favorites

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(200).json(user); // Return updated user profile

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove movie from favorites", message: err.message });
  }
});

// Delete a user account (Deregister) (Protected)
app.delete("/users/:username", passport.authenticate('jwt', { session: false }), async (req, res) => {
     // Authorization check
    if (req.user.username !== req.params.username) {
        // Optional: Add role check for admin deletion later
        return res.status(403).json({ error: "Forbidden: You can only delete your own account."});
    }
  try {
    const deletedUser = await Users.findOneAndDelete({
      username: req.params.username,
    });
    if (!deletedUser) {
      // This shouldn't happen if auth passed, but good practice
      return res.status(404).json({ error: "User not found." });
    }
    res.status(200).json({ message: `User account "${req.params.username}" deleted successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to deregister user", message: err.message });
  }
});


// *** GENRE ENDPOINTS (Protected) ***
app.get("/genres", passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const genres = await Genres.find(); // Add .select('name description') if you only want specific fields
    res.status(200).json(genres);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve genres", message: err.message });
  }
});

app.get("/genres/:name", passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const genre = await Genres.findOne({
      // Case-insensitive exact match
      name: { $regex: new RegExp('^' + req.params.name + '$', "i") },
    });
    if (!genre) {
      return res.status(404).json({ error: `Genre "${req.params.name}" not found.` });
    }
    res.status(200).json(genre);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve genre", message: err.message });
  }
});

// Add a new Genre (Consider if this should be admin-only)
app.post("/genres",
  passport.authenticate('jwt', { session: false }),
  // Optional: Add role check middleware here for admins
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
      // Check if genre already exists (case-insensitive)
      const existingGenre = await Genres.findOne({ name: { $regex: new RegExp('^' + name + '$', "i") } });
      if (existingGenre) {
        return res.status(400).json({ error: `Genre name "${name}" already exists.` });
      }
      const newGenre = new Genres({ name, description });
      const savedGenre = await newGenre.save();
      res.status(201).json(savedGenre);
    } catch (err) {
      console.error(err);
      if (err.name === 'ValidationError') {
          return res.status(400).json({ error: "Genre validation failed", message: err.message });
      }
      res.status(500).json({ error: "Failed to create genre", message: err.message });
    }
  });

// Update a Genre (Consider if this should be admin-only)
app.put("/genres/:name",
  passport.authenticate('jwt', { session: false }),
  // Optional: Add role check middleware here for admins
  [
    // Only description is usually updatable, name acts as identifier
    check('description', 'Description is required').notEmpty()
    // Optionally allow updating name, but handle conflicts
    // check('name', 'Name must be non-empty string').optional().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { description } = req.body; // Add name here if allowing name updates
      // Find by current name (case-insensitive)
      const updatedGenre = await Genres.findOneAndUpdate(
        { name: { $regex: new RegExp('^' + req.params.name + '$', "i") } },
        { $set: { description /*, name: req.body.name */ } }, // Update fields
        { new: true, runValidators: true }
      );
      if (!updatedGenre) {
        return res.status(404).json({ error: `Genre "${req.params.name}" not found.` });
      }
      res.status(200).json(updatedGenre);
    } catch (err) {
      console.error(err);
       if (err.name === 'ValidationError') {
          return res.status(400).json({ error: "Genre update validation failed", message: err.message });
      }
      res.status(500).json({ error: "Failed to update genre", message: err.message });
    }
  });

// Delete a Genre (Consider if this should be admin-only)
app.delete("/genres/:name", passport.authenticate('jwt', { session: false }),
 // Optional: Add role check middleware here for admins
 async (req, res) => {
  try {
    // Check if any movies use this genre BEFORE deleting
    const genre = await Genres.findOne({ name: { $regex: new RegExp('^' + req.params.name + '$', "i") } });
    if (!genre) {
         return res.status(404).json({ error: `Genre "${req.params.name}" not found.` });
    }

    const moviesUsingGenre = await Movies.find({ genre: genre._id });
    if (moviesUsingGenre.length > 0) {
        return res.status(400).json({
             error: `Cannot delete genre "${req.params.name}" as it is currently assigned to ${moviesUsingGenre.length} movie(s).`
         });
    }

    // Proceed with deletion if not used
    const deletedGenre = await Genres.findOneAndDelete({ _id: genre._id });
    if (!deletedGenre) {
      // Should not happen if found earlier, but good check
      return res.status(404).json({ error: `Genre "${req.params.name}" not found.` });
    }
    res.status(200).json({ message: `Genre "${deletedGenre.name}" deleted successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete genre", message: err.message });
  }
});


// *** DIRECTOR ENDPOINTS (Protected) ***
app.get("/directors", passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const directors = await Directors.find(); // .select('name bio birth death');
    res.status(200).json(directors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve directors", message: err.message });
  }
});

app.get("/directors/name/:name", passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const director = await Directors.findOne({
      // Case-insensitive partial match (or use exact match like genres)
      name: { $regex: new RegExp(req.params.name, "i") },
    });
    if (!director) {
      return res.status(404).json({ error: `Director containing "${req.params.name}" not found.` });
    }
    res.status(200).json(director);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve director by name", message: err.message });
  }
});

// Add a new Director (Consider admin-only)
app.post("/directors",
  passport.authenticate('jwt', { session: false }),
  // Optional: Add role check middleware here for admins
  [
    check('name', 'Name is required').notEmpty(),
    check('bio', 'Bio is required').notEmpty(),
    check('birth', 'Birth date must be a valid date').notEmpty().isISO8601().toDate(),
    check('death', 'Death date must be a valid date if provided').optional({ nullable: true }).isISO8601().toDate() // Allow null/optional death date
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { name, bio, birth, death } = req.body;
      // Check if director already exists (case-insensitive exact match)
      const existingDirector = await Directors.findOne({ name: { $regex: new RegExp('^' + name + '$', "i") } });
      if (existingDirector) {
        return res.status(400).json({ error: `Director name "${name}" already exists.` });
      }
      const newDirector = new Directors({ name, bio, birth, death: death || null }); // Ensure death is null if not provided
      const savedDirector = await newDirector.save();
      res.status(201).json(savedDirector);
    } catch (err) {
      console.error(err);
       if (err.name === 'ValidationError') {
          return res.status(400).json({ error: "Director validation failed", message: err.message });
      }
      res.status(500).json({ error: "Failed to create director", message: err.message });
    }
  });

// Update a Director (Consider admin-only)
app.put("/directors/:directorId",
  passport.authenticate('jwt', { session: false }),
  // Optional: Add role check middleware here for admins
  [ // Validate provided fields
    check('name', 'Name must be a non-empty string').optional().notEmpty(),
    check('bio', 'Bio must be a non-empty string').optional().notEmpty(),
    check('birth', 'Birth date must be a valid date').optional().isISO8601().toDate(),
    check('death', 'Death date must be a valid date or null').optional({ nullable: true }).isISO8601().toDate()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Validate if directorId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.directorId)) {
        return res.status(400).json({ error: "Invalid Director ID format." });
    }
    try {
      const { name, bio, birth, death } = req.body;
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (bio !== undefined) updateData.bio = bio;
      if (birth !== undefined) updateData.birth = birth;
      // Handle death carefully: allow setting to null or a date
      if (death !== undefined) updateData.death = death; // `null` will be passed directly if intended

      // If name is being updated, check for conflicts (optional but recommended)
      if (name) {
          const existingDirector = await Directors.findOne({
               name: { $regex: new RegExp('^' + name + '$', "i") },
               _id: { $ne: req.params.directorId } // Exclude the current director
           });
           if (existingDirector) {
               return res.status(400).json({ error: `Another director with the name "${name}" already exists.` });
           }
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
      console.error(err);
      if (err.name === 'ValidationError') {
          return res.status(400).json({ error: "Director update validation failed", message: err.message });
      }
      res.status(500).json({ error: "Failed to update director", message: err.message });
    }
  });

// Delete a Director (Consider admin-only)
app.delete("/directors/:directorId",
  passport.authenticate('jwt', { session: false }),
  // Optional: Add role check middleware here for admins
  async (req, res) => {
  // Validate if directorId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.directorId)) {
        return res.status(400).json({ error: "Invalid Director ID format." });
    }
  try {
    // Check if any movies use this director BEFORE deleting
    const moviesUsingDirector = await Movies.find({ director: req.params.directorId });
    if (moviesUsingDirector.length > 0) {
        const director = await Directors.findById(req.params.directorId).select('name'); // Get name for message
        return res.status(400).json({
             error: `Cannot delete director "${director ? director.name : 'ID: '+req.params.directorId}" as they are currently assigned to ${moviesUsingDirector.length} movie(s).`
         });
    }

    // Proceed with deletion if not used
    const deletedDirector = await Directors.findByIdAndDelete(req.params.directorId);
    if (!deletedDirector) {
      return res.status(404).json({ error: "Director not found." });
    }
    res.status(200).json({ message: `Director "${deletedDirector.name}" deleted successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete director", message: err.message });
  }
});


// *** ACTOR ENDPOINTS (Protected) ***
app.get("/actors", passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const actors = await Actors.find(); // .select('name bio birth death pictureUrl');
    res.status(200).json(actors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve actors", message: err.message }); // Send JSON error
  }
});

app.get("/actors/name/:name", passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    // Find actor by name (case-insensitive, partial match)
    const actor = await Actors.findOne({
      name: { $regex: new RegExp(req.params.name, "i") },
    });
    if (!actor) {
      return res.status(404).json({ error: `Actor containing "${req.params.name}" not found.` });
    }
    res.status(200).json(actor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve actor by name", message: err.message }); // Send JSON error
  }
});

app.get("/actors/:actorId", passport.authenticate('jwt', { session: false }), async (req, res) => {
    // Validate if actorId is a valid MongoDB ObjectId
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
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve actor by ID", message: err.message }); // Send JSON error
  }
});

// Add a new Actor (Consider admin-only)
app.post("/actors",
  passport.authenticate('jwt', { session: false }),
   // Optional: Add role check middleware here for admins
  [
    check('name', 'Name is required').notEmpty(),
    check('bio', 'Bio is required').notEmpty(),
    check('birth', 'Birth date must be a valid date').notEmpty().isISO8601().toDate(),
    check('death', 'Death date must be a valid date if provided').optional({ nullable: true }).isISO8601().toDate(),
    check('pictureUrl', 'Picture URL must be a valid URL if provided').optional({ nullable: true, checkFalsy: true }).isURL() // Allow empty string or null
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { name, bio, birth, death, pictureUrl } = req.body;
      // Check if actor already exists (case-insensitive exact match)
       const existingActor = await Actors.findOne({ name: { $regex: new RegExp('^' + name + '$', "i") } });
      if (existingActor) {
        return res.status(400).json({ error: `Actor name "${name}" already exists.` });
      }
      const newActor = new Actors({
          name,
          bio,
          birth,
          death: death || null,
          pictureUrl: pictureUrl || null // Ensure null if empty/not provided
        });
      const savedActor = await newActor.save();
      res.status(201).json(savedActor);
    } catch (err) {
      console.error(err);
       if (err.name === 'ValidationError') {
          return res.status(400).json({ error: "Actor validation failed", message: err.message });
      }
      res.status(500).json({ error: "Failed to create actor", message: err.message }); // Send JSON error
    }
  });

// Update an Actor (Consider admin-only)
app.put("/actors/:actorId",
  passport.authenticate('jwt', { session: false }),
  // Optional: Add role check middleware here for admins
  [ // Validate provided fields
    check('name', 'Name must be a non-empty string').optional().notEmpty(),
    check('bio', 'Bio must be a non-empty string').optional().notEmpty(),
    check('birth', 'Birth date must be a valid date').optional().isISO8601().toDate(),
    check('death', 'Death date must be a valid date or null').optional({ nullable: true }).isISO8601().toDate(),
    check('pictureUrl', 'Picture URL must be a valid URL or null').optional({ nullable: true, checkFalsy: true }).isURL()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
     // Validate if actorId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.actorId)) {
        return res.status(400).json({ error: "Invalid Actor ID format." });
    }
    try {
      const { name, bio, birth, death, pictureUrl } = req.body;
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (bio !== undefined) updateData.bio = bio;
      if (birth !== undefined) updateData.birth = birth;
      if (death !== undefined) updateData.death = death; // Allows null
      if (pictureUrl !== undefined) updateData.pictureUrl = pictureUrl; // Allows null/empty string via checkFalsy

      // Check for name conflicts if updating name
       if (name) {
          const existingActor = await Actors.findOne({
               name: { $regex: new RegExp('^' + name + '$', "i") },
               _id: { $ne: req.params.actorId } // Exclude the current actor
           });
           if (existingActor) {
               return res.status(400).json({ error: `Another actor with the name "${name}" already exists.` });
           }
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
      console.error(err);
      if (err.name === 'ValidationError') {
          return res.status(400).json({ error: "Actor update validation failed", message: err.message });
      }
      res.status(500).json({ error: "Failed to update actor", message: err.message }); // Send JSON error
    }
  });

// Delete an Actor (Consider admin-only)
app.delete("/actors/:actorId",
  passport.authenticate('jwt', { session: false }),
  // Optional: Add role check middleware here for admins
  async (req, res) => {
    // Validate if actorId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.actorId)) {
        return res.status(400).json({ error: "Invalid Actor ID format." });
    }
  try {
    // Check if this actor is assigned to any movies BEFORE deleting
    const moviesWithActor = await Movies.find({ actors: req.params.actorId });
    if (moviesWithActor.length > 0) {
        const actor = await Actors.findById(req.params.actorId).select('name');
        return res.status(400).json({
            error: `Cannot delete actor "${actor ? actor.name : 'ID: '+req.params.actorId}" as they are currently assigned to ${moviesWithActor.length} movie(s). Please remove them from the movie cast first.`
        });
    }

    // Proceed with deletion if not used
    const deletedActor = await Actors.findByIdAndDelete(req.params.actorId);
    if (!deletedActor) {
      return res.status(404).json({ error: "Actor not found." });
    }
    res.status(200).json({ message: `Actor "${deletedActor.name}" deleted successfully.` }); // Send JSON response
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete actor", message: err.message }); // Send JSON error
  }
});


// *** ADMIN ENDPOINTS (Example - Secure these properly with role checks) ***
// These endpoints expose potentially sensitive lists. Add role-based authorization.

// Example role check middleware (replace with your actual implementation)
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') { // Assuming user object has a 'role' property
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Admin access required.' });
  }
};

app.get("/admin/users", passport.authenticate('jwt', { session: false }), /* isAdmin, */ async (req, res) => {
  // Add isAdmin middleware here when implemented
  try {
    const users = await Users.find().select('-password'); // Exclude passwords
    res.status(200).json(users); // Send full user objects (minus password)
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve users list", message: err.message });
  }
});

app.get("/admin/movies", passport.authenticate('jwt', { session: false }), /* isAdmin, */ async (req, res) => {
  // Add isAdmin middleware here when implemented
  try {
    const movies = await Movies.find()
        .populate("genre", "name") // Populate only names for brevity
        .populate("director", "name")
        .populate("actors", "name");
    res.status(200).json(movies); // Send populated movie objects
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve movies list", message: err.message });
  }
});

// Admin endpoints for Genres, Directors, Actors are less common if standard CRUD exists,
// but could be useful for bulk views or operations.
// Example:
// app.get("/admin/genres", passport.authenticate('jwt', { session: false }), /* isAdmin, */ async (req, res) => { ... });
// app.get("/admin/directors", passport.authenticate('jwt', { session: false }), /* isAdmin, */ async (req, res) => { ... });
// app.get("/admin/actors", passport.authenticate('jwt', { session: false }), /* isAdmin, */ async (req, res) => { ... });


// --- Error Handling Middleware ---
// This should be defined LAST, after all other app.use() and routes
app.use((err, req, res, next) => {
  console.error(err); // Log the full error stack trace to the console

  // Default error response
  let statusCode = err.status || 500; // Use error status or default to 500
  let errorMessage = err.message || "An unexpected internal server error occurred.";

  // Handle specific error types if needed
  if (err.name === 'UnauthorizedError') { // Example: JWT error
    statusCode = 401;
    errorMessage = "Invalid or missing authentication token.";
  } else if (err.name === 'ValidationError') { // Mongoose validation error
      statusCode = 400;
      // You might want to format Mongoose validation errors more nicely
      errorMessage = `Validation Error: ${err.message}`;
  } else if (err instanceof mongoose.Error.CastError) { // Mongoose invalid ObjectId cast error
      statusCode = 400;
      errorMessage = `Invalid ID format for parameter '${err.path}'.`;
  }
   // Add more specific error handling as needed

  res.status(statusCode).json({
    error: errorMessage,
    // Optionally include stack trace in development only
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => { // Listen on all available network interfaces
  console.log(`MovieMobs API Server is running on Port ${PORT}`);
});