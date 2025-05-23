// Load environment variables from a .env file into process.env
require("dotenv").config();

// Import necessary modules
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser"); // Middleware to parse request bodies
const morgan = require("morgan"); // HTTP request logger middleware
const path = require("path"); // Utility for working with file and directory paths
const { validationResult, check } = require("express-validator"); // For request validation
const passport = require("passport"); // Authentication middleware
const cors = require("cors"); // Middleware for enabling Cross-Origin Resource Sharing

// Define a list of allowed origins for CORS
let allowedOrigins = [
  "http://localhost:8080",
  "http://testsite.com",
  "https://ivencomur.github.io",
  "http://localhost:1234", // Common Parcel dev server port
  "http://localhost:3000", // Common React dev server port
  "http://localhost:5173", // Common Vite dev server port
  // Add your frontend's deployed URL here, e.g., "https://your-movie-app-frontend.netlify.app"
  // Add your current frontend development port if different, e.g., "http://localhost:52020"
];

// Initialize Passport configuration
require("./passport");

// Import Mongoose models
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

// Define port for the server, using environment variable or defaulting to 8080
const PORT = process.env.PORT || 8080;
// Get MongoDB connection URI from environment variables
const MONGO_URI = process.env.MONGO_URI;

// Critical check for MongoDB URI
if (!MONGO_URI) {
  console.error("FATAL ERROR: MONGO_URI environment variable is not set.");
  process.exit(1);
}
// Warning if JWT_SECRET is not set, as it's crucial for token-based authentication
if (!process.env.JWT_SECRET) {
  console.warn(
    "WARNING: JWT_SECRET environment variable is not set. Authentication will likely fail."
  );
}

// Create an Express application
const app = express();

// Connect to MongoDB using Mongoose
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Successfully connected to MongoDB using Mongoose."))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit if MongoDB connection fails
  });

// Use morgan for logging HTTP requests in 'common' format
app.use(morgan("common"));
// Configure CORS (Cross-Origin Resource Sharing)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like Postman, curl) or if origin is in allowedOrigins list
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Block requests from unlisted origins
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    optionsSuccessStatus: 200, // For legacy browser compatibility
  })
);

// Use bodyParser middleware to parse JSON and URL-encoded request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Initialize authentication module and Passport
let auth = require("./auth")(app); // Assuming auth.js sets up /login endpoint
app.use(passport.initialize());

// Middleware to require JWT authentication for protected routes
const requireJWTAuth = passport.authenticate("jwt", { session: false });

// --- Basic Routes ---
// Serve the main HTML page for the root path (potentially for API landing page)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Serve the documentation HTML page
app.get("/documentation", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "documentation.html"));
});

// --- User Routes ---
// Endpoint to create a new user (register)
app.post(
  "/users",
  // Validation middleware for user registration data
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
      .optional({ checkFalsy: true }) // Makes the field optional
      .isISO8601() // Validates as an ISO8601 date (YYYY-MM-DD)
      .toDate(), // Converts to a JavaScript Date object
    check("firstname", "First name must be a non-empty string")
      .optional({ checkFalsy: true })
      .isString()
      .bail() // Stops running further validators if previous one failed
      .notEmpty()
      .withMessage("First name, if provided, cannot be empty."),
    check("lastname", "Last name must be a non-empty string")
      .optional({ checkFalsy: true })
      .isString()
      .bail()
      .notEmpty()
      .withMessage("Last name, if provided, cannot be empty."),
  ],
  async (req, res, next) => {
    // Function to process a single user creation, handles validation and saving
    const processSingleUser = async (userDataFromRequest) => {
      // Manual validation mirroring express-validator for robustness and custom error objects
      let userData = { ...userDataFromRequest };
      if (
        !userData.username ||
        typeof userData.username !== "string" ||
        userData.username.length < 5 ||
        !/^[a-zA-Z0-9]+$/.test(userData.username)
      ) {
        throw Object.assign(
          new Error(
            "Username must be alphanumeric and at least 5 characters long."
          ),
          { context: { path: "username", value: userData.username } }
        );
      }
      if (
        !userData.password ||
        typeof userData.password !== "string" ||
        userData.password.length < 8
      ) {
        throw Object.assign(
          new Error(
            "Password is required and must be at least 8 characters long."
          ),
          { context: { path: "password" } }
        );
      }
      if (
        !userData.email ||
        typeof userData.email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)
      ) {
        throw Object.assign(new Error("A valid email address is required."), {
          context: { path: "email", value: userData.email },
        });
      }
      // Validate and parse birthday if provided
      if (
        userData.birthday !== undefined &&
        userData.birthday !== null &&
        userData.birthday !== ""
      ) {
        const parsedDate = new Date(userData.birthday);
        if (isNaN(parsedDate.getTime())) {
          throw Object.assign(
            new Error(
              "Birthday, if provided, must be a valid date string (e.g., YYYY-MM-DD or ISO8601 format)."
            ),
            { context: { path: "birthday", value: userData.birthday } }
          );
        }
        userData.birthday = parsedDate;
      } else {
        userData.birthday = null; // Set to null if not provided or empty
      }
      // Validate firstname if provided
      if (userData.firstname !== undefined && userData.firstname !== null) {
        if (
          typeof userData.firstname !== "string" ||
          userData.firstname.trim() === ""
        ) {
          throw Object.assign(
            new Error("First name, if provided, must be a non-empty string."),
            { context: { path: "firstname", value: userData.firstname } }
          );
        }
        userData.firstname = userData.firstname.trim();
      } else {
        userData.firstname = null;
      }
      // Validate lastname if provided
      if (userData.lastname !== undefined && userData.lastname !== null) {
        if (
          typeof userData.lastname !== "string" ||
          userData.lastname.trim() === ""
        ) {
          throw Object.assign(
            new Error("Last name, if provided, must be a non-empty string."),
            { context: { path: "lastname", value: userData.lastname } }
          );
        }
        userData.lastname = userData.lastname.trim();
      } else {
        userData.lastname = null;
      }

      const { username, password, email, birthday, firstname, lastname } =
        userData;

      // Check if username or email already exists
      const existingUser = await Users.findOne({
        $or: [{ username: username }, { email: email }],
      });
      if (existingUser) {
        const message =
          existingUser.username === username
            ? `Username "${username}" already exists.`
            : `Email "${email}" is already registered.`;
        throw Object.assign(new Error(message), {
          isDuplicate: true,
          field: existingUser.username === username ? "username" : "email",
        });
      }

      // Hash the password before saving
      const hashedPassword = Users.hashPassword(password);
      const newUser = new Users({
        username,
        password: hashedPassword,
        email,
        birthday,
        firstname,
        lastname,
        favoriteMovies: userData.favoriteMovies || [], // Initialize favoriteMovies as empty array if not provided
      });

      const savedUser = await newUser.save();
      // Prepare user response, excluding password
      const userResponse = { ...savedUser.toJSON() };
      delete userResponse.password;
      return userResponse;
    };

    // Handle batch user creation if request body is an array
    if (Array.isArray(req.body)) {
      const usersDataArray = req.body;
      const results = [];
      const batchErrors = [];

      // Process each user object in the batch
      for (let i = 0; i < usersDataArray.length; i++) {
        const userObject = usersDataArray[i];
        try {
          const result = await processSingleUser(userObject);
          results.push(result);
        } catch (err) {
          batchErrors.push({
            index: i,
            input_username: (userObject && userObject.username) || "N/A",
            error: err.message || "Server error during user processing",
            field: err.field || (err.context && err.context.path) || undefined,
            value:
              (err.context && err.context.value) ||
              (userObject && err.context && userObject[err.context.path]) ||
              undefined,
          });
        }
      }

      // Respond based on batch processing results
      if (results.length === usersDataArray.length) {
        return res.status(201).json(results); // All successful
      } else if (results.length === 0) {
        return res // All failed
          .status(400)
          .json({
            message: "All user creations in the batch failed.",
            errors: batchErrors,
          });
      } else {
        return res // Partially successful
          .status(207) // Multi-Status
          .json({
            message: "Batch user creation partially successful.",
            succeeded_count: results.length,
            failed_count: batchErrors.length,
            succeeded: results,
            failed: batchErrors,
          });
      }
    } else {
      // Handle single user creation
      // Check for validation errors from express-validator
      const expressValidatorErrors = validationResult(req);
      if (!expressValidatorErrors.isEmpty()) {
        return res.status(400).json({ errors: expressValidatorErrors.array() });
      }

      try {
        const result = await processSingleUser(req.body);
        return res.status(201).json(result);
      } catch (err) {
        // Handle specific errors like duplicate user or validation issues
        if (err.isDuplicate) {
          return res
            .status(400)
            .json({
              errors: [
                {
                  type: "field",
                  msg: err.message,
                  path: err.field,
                  location: "body",
                  value: req.body[err.field],
                },
              ],
            });
        } else if (err.context && err.context.path) { // For manual validation errors
          return res
            .status(400)
            .json({
              errors: [
                {
                  type: "field",
                  msg: err.message,
                  path: err.context.path,
                  location: "body",
                  value:
                    err.context.value !== undefined
                      ? err.context.value
                      : req.body[err.context.path],
                },
              ],
            });
        }
        // Pass other errors to the global error handler
        return next(err);
      }
    }
  }
);

// Endpoint to get all movies (requires authentication)
app.get("/movies", requireJWTAuth, async (req, res, next) => {
  try {
    const movies = await Movies.find()
      .populate("Genre", "name description") // Populate genre details
      .populate("Director", "name bio")      // Populate director details
      .populate("Actors", "name");           // Populate actor names
    res.status(200).json(movies);
  } catch (err) {
    next(err); // Pass errors to the global error handler
  }
});

// Endpoint to get a single movie by its ID (requires authentication)
app.get("/movies/:movieId", requireJWTAuth, async (req, res, next) => {
  try {
    // Validate if movieId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) {
      return res.status(400).json({ error: "Invalid Movie ID format." });
    }
    const movie = await Movies.findById(req.params.movieId)
      .populate("Genre")    // Populate full genre object
      .populate("Director") // Populate full director object
      .populate("Actors");   // Populate full actor objects
    if (!movie) {
      return res.status(404).json({ error: "Movie not found." });
    }
    res.status(200).json(movie);
  } catch (err) {
    next(err);
  }
});

// Endpoint to get a movie by its title (requires authentication)
app.get("/movies/title/:title", requireJWTAuth, async (req, res, next) => {
  try {
    const titleSearch = decodeURIComponent(req.params.title);
    const movie = await Movies.findOne({
      // Case-insensitive exact match for title
      Title: { $regex: new RegExp("^" + titleSearch + "$", "i") },
    })
      .populate("Genre")
      .populate("Director")
      .populate("Actors");
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

// Endpoint to get movies by genre name (requires authentication)
app.get("/movies/genre/:genreName", requireJWTAuth, async (req, res, next) => {
  try {
    const genreNameSearch = decodeURIComponent(req.params.genreName);
    // Find the genre document by name (case-insensitive)
    const genre = await Genres.findOne({
      name: { $regex: new RegExp("^" + genreNameSearch + "$", "i") },
    });
    if (!genre) {
      return res
        .status(404)
        .json({ error: `Genre "${genreNameSearch}" not found.` });
    }
    // Find all movies associated with this genre ID
    const movies = await Movies.find({ Genre: genre._id })
      .populate("Genre", "name")
      .populate("Director", "name")
      .populate("Actors", "name");
    res.status(200).json(movies);
  } catch (err) {
    next(err);
  }
});

// Endpoint to get movies by director name (requires authentication)
app.get(
  "/movies/director/:directorName",
  requireJWTAuth,
  async (req, res, next) => {
    try {
      const directorNameSearch = decodeURIComponent(req.params.directorName);
      // Find the director document by name (case-insensitive)
      const director = await Directors.findOne({
        name: { $regex: new RegExp("^" + directorNameSearch + "$", "i") },
      });
      if (!director) {
        return res
          .status(404)
          .json({ error: `Director "${directorNameSearch}" not found.` });
      }
      // Find all movies associated with this director ID
      const movies = await Movies.find({ Director: director._id })
        .populate("Genre", "name")
        .populate("Director", "name")
        .populate("Actors", "name");
      res.status(200).json(movies);
    } catch (err) {
      next(err);
    }
  }
);

// Endpoint to add a new movie (requires authentication)
app.post(
  "/movies",
  requireJWTAuth,
  // Validation middleware for new movie data
  [
    check("title", "Title is required").trim().notEmpty(),
    check("description", "Description is required").trim().notEmpty(),
    check("genre", "Genre name is required").trim().notEmpty(),
    check("director", "Director name is required").trim().notEmpty(),
    check("actors", "Actors must be an array of names (strings)")
      .optional()
      .isArray(),
    check("imagePath", "ImagePath must be a valid URL")
      .optional({ checkFalsy: true }) // Allows empty string or null to pass if optional
      .isURL(),
    check("featured", "Featured must be a boolean").optional().isBoolean(),
    check("releaseYear", "Release year must be a valid year (e.g., 1999)")
      .optional()
      .isInt({ min: 1888, max: new Date().getFullYear() + 5 }), // Sensible range for movie release years
    check("rating", "Rating must be a number between 0 and 10")
      .optional()
      .isFloat({ min: 0, max: 10 }),
  ],
  async (req, res, next) => {
    // Check for validation errors
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
        actors: actorNames = [], // Default to empty array if not provided
        imagePath,
        featured,
        releaseYear,
        rating,
      } = req.body;

      // Check if a movie with the same title already exists
      const existingMovie = await Movies.findOne({ Title: title }); // Schema uses 'Title' (capitalized)
      if (existingMovie) {
        return res
          .status(400)
          .json({ error: `Movie with title "${title}" already exists.` });
      }

      // Find Genre and Director documents by name to get their IDs
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

      // Find Actor documents by names to get their IDs
      let actorIds = [];
      if (actorNames.length > 0) {
        const actorDocs = await Actors.find({
          name: {
            $in: actorNames.map(
              (name) => new RegExp("^" + name + "$", "i")
            ),
          },
        });
        actorIds = actorDocs.map((actor) => actor._id);
        // Optional: Add validation here if some actor names weren't found
      }

      // Create new movie object with resolved IDs and other data
      const newMovieData = {
        Title: title, // Ensure consistency with schema capitalization
        Description: description,
        Genre: genreDoc._id,
        Director: directorDoc._id,
        Actors: actorIds,
      };
      // Add optional fields if they were provided
      if (imagePath !== undefined) newMovieData.ImagePath = imagePath;
      if (featured !== undefined) newMovieData.Featured = featured;
      if (releaseYear !== undefined) newMovieData.ReleaseYear = releaseYear;
      if (rating !== undefined) newMovieData.Rating = rating;

      const newMovie = new Movies(newMovieData);
      const savedMovie = await newMovie.save();

      // Populate references before sending response
      const populatedMovie = await Movies.findById(savedMovie._id)
        .populate("Genre")
        .populate("Director")
        .populate("Actors");

      res.status(201).json(populatedMovie);
    } catch (err) {
      next(err);
    }
  }
);

// Endpoint to update an existing movie by ID (requires authentication)
app.put(
  "/movies/:movieId",
  requireJWTAuth,
  // Validation middleware for movie update data (all fields are optional for update)
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
        actors: actorNames, // Can be undefined if not provided
        imagePath,
        featured,
        releaseYear,
        rating,
      } = req.body;

      const updateData = {}; // Object to hold fields to be updated

      // Conditionally add fields to updateData if they are provided in the request
      if (title !== undefined) updateData.Title = title;
      if (description !== undefined) updateData.Description = description;
      if (imagePath !== undefined) updateData.ImagePath = imagePath;
      if (featured !== undefined) updateData.Featured = featured;
      if (releaseYear !== undefined) updateData.ReleaseYear = releaseYear;
      if (rating !== undefined) updateData.Rating = rating;

      // Handle Genre update by looking up its ID
      if (genreName !== undefined) {
        const genreDoc = await Genres.findOne({
          name: { $regex: new RegExp("^" + genreName + "$", "i") },
        });
        if (!genreDoc)
          return res
            .status(400)
            .json({ error: `Genre "${genreName}" not found.` });
        updateData.Genre = genreDoc._id;
      }
      // Handle Director update by looking up its ID
      if (directorName !== undefined) {
        const directorDoc = await Directors.findOne({
          name: { $regex: new RegExp("^" + directorName + "$", "i") },
        });
        if (!directorDoc)
          return res
            .status(400)
            .json({ error: `Director "${directorName}" not found.` });
        updateData.Director = directorDoc._id;
      }
      // Handle Actors update by looking up their IDs
      if (actorNames !== undefined) {
        if (!Array.isArray(actorNames))
          return res
            .status(400)
            .json({ error: "Actors field must be an array of names." });
        const actorDocs = await Actors.find({
          name: {
            $in: actorNames.map(
              (name) => new RegExp("^" + name + "$", "i")
            ),
          },
        });
        updateData.Actors = actorDocs.map((actor) => actor._id);
        // Optional: Check if all actorNames were found and handle discrepancies
      }

      // Ensure there's something to update
      if (Object.keys(updateData).length === 0) {
        return res
          .status(400)
          .json({ error: "No valid fields provided for update." });
      }

      // Find and update the movie
      const updatedMovie = await Movies.findByIdAndUpdate(
        req.params.movieId,
        { $set: updateData },
        { new: true, runValidators: true } // Return the updated document and run schema validators
      )
        .populate("Genre")
        .populate("Director")
        .populate("Actors");

      if (!updatedMovie)
        return res.status(404).json({ error: "Movie not found." });

      res.status(200).json(updatedMovie);
    } catch (err) {
      next(err);
    }
  }
);

// Endpoint to delete a movie by ID (requires authentication)
app.delete("/movies/:movieId", requireJWTAuth, async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) {
    return res.status(400).json({ error: "Invalid Movie ID format." });
  }
  try {
    const deletedMovie = await Movies.findByIdAndDelete(req.params.movieId);
    if (!deletedMovie)
      return res.status(404).json({ error: "Movie not found." });

    // Remove this movie from all users' favoriteMovies arrays
    await Users.updateMany(
      { favoriteMovies: req.params.movieId },
      { $pull: { favoriteMovies: req.params.movieId } }
    );

    res
      .status(200)
      .json({ message: `Movie "${deletedMovie.Title}" deleted successfully.` });
  } catch (err) {
    next(err);
  }
});

// Endpoint to get actors for a specific movie (requires authentication)
app.get("/movies/:movieId/actors", requireJWTAuth, async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) {
    return res.status(400).json({ error: "Invalid Movie ID format." });
  }
  try {
    const movie = await Movies.findById(req.params.movieId).populate(
      "Actors", // Field to populate
      "name bio birth death pictureUrl" // Fields to select from Actors
    );
    if (!movie) return res.status(404).json({ error: "Movie not found." });
    res.status(200).json(movie.Actors || []); // Return populated actors or empty array
  } catch (err) {
    next(err);
  }
});


// --- User Profile Routes ---
// Endpoint to get a user by username (requires authentication, user can only view their own profile)
app.get("/users/:username", requireJWTAuth, async (req, res, next) => {
  // Authorization check: ensure the logged-in user is requesting their own profile
  if (req.user.username !== req.params.username) {
    return res
      .status(403) // Forbidden
      .json({ error: "Forbidden: You can only view your own profile." });
  }
  try {
    const user = await Users.findOne({ username: req.params.username })
      .select("-password") // Exclude password from the result
      .populate("favoriteMovies"); // Populate favorite movies details
    if (!user) return res.status(404).json({ error: "User not found." });
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

// Endpoint to update a user's information (requires authentication, user can only update their own profile)
app.put(
  "/users/:username",
  requireJWTAuth,
  // Validation middleware for user update data
  [
    check(
      "username",
      "Username must be alphanumeric and at least 5 characters long"
    )
      .optional() // All fields are optional for update
      .isLength({ min: 5 })
      .isAlphanumeric(),
    // Password update should be handled separately or require current password for security.
    // For simplicity, this example allows password update directly if provided.
    // check("password", "Password must be at least 8 characters long").optional().isLength({ min: 8 }),
    check("email", "A valid email address is required").optional().isEmail(),
    check("birthday", "Birthday must be a valid date (YYYY-MM-DD)")
      .optional({ checkFalsy: true }) // Allows empty or null to clear the date
      .isISO8601()
      .toDate(),
    check("firstname", "First name must be a non-empty string")
      .optional({ checkFalsy: true })
      .isString()
      .notEmpty(),
    check("lastname", "Last name must be a non-empty string")
      .optional({ checkFalsy: true })
      .isString()
      .notEmpty(),
  ],
  async (req, res, next) => {
    // Authorization check
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
      const { username, password, email, birthday, firstname, lastname } = req.body; // Added password
      const updateData = {};

      // Add fields to updateData only if they are provided and valid
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (birthday !== undefined) updateData.birthday = birthday === "" ? null : birthday; // Allow clearing date
      if (firstname !== undefined) updateData.firstname = firstname;
      if (lastname !== undefined) updateData.lastname = lastname;
      if (password) { // If a new password is provided, hash it
        updateData.password = Users.hashPassword(password);
      }


      // Check for duplicate username or email if they are being changed
      if (username || email) {
        const orChecks = [];
        if (username) orChecks.push({ username: username });
        if (email) orChecks.push({ email: email });

        const existingUser = await Users.findOne({
          $or: orChecks,
          _id: { $ne: req.user._id }, // Exclude the current user from the check
        });

        if (existingUser) {
          const message =
            existingUser.username === username
              ? `Username "${username}" is already taken.`
              : `Email "${email}" is already registered by another user.`;
          return res.status(400).json({ error: message });
        }
      }

      // Ensure there's something to update
      if (Object.keys(updateData).length === 0) {
        return res
          .status(400)
          .json({ error: "No valid fields provided for update." });
      }

      const updatedUser = await Users.findOneAndUpdate(
        { username: req.params.username }, // Find user by current username
        { $set: updateData },
        { new: true, runValidators: true } // Return updated document and run validators
      ).select("-password"); // Exclude password from response

      if (!updatedUser)
        return res.status(404).json({ error: "User not found for update." });

      res.status(200).json(updatedUser);
    } catch (err) {
      next(err);
    }
  }
);

// Endpoint to add a movie to a user's favorites (requires authentication)
app.post(
  "/users/:username/favorites/:movieId",
  requireJWTAuth,
  async (req, res, next) => {
    // Authorization check
    if (req.user.username !== req.params.username) {
      return res
        .status(403)
        .json({ error: "Forbidden: You can only modify your own favorites." });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) {
      return res.status(400).json({ error: "Invalid Movie ID format." });
    }

    try {
      // Check if the movie exists
      const movie = await Movies.findById(req.params.movieId);
      if (!movie) return res.status(404).json({ error: "Movie not found." });

      // Add movie to user's favoriteMovies array (uses $addToSet to prevent duplicates)
      const user = await Users.findByIdAndUpdate(
        req.user._id, // Use logged-in user's ID for security
        { $addToSet: { favoriteMovies: movie._id } },
        { new: true } // Return the updated user document
      )
        .select("-password") // Exclude password
        .populate("favoriteMovies"); // Populate favorite movies

      if (!user) return res.status(404).json({ error: "User not found." });
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }
);

// Endpoint to remove a movie from a user's favorites (requires authentication)
app.delete(
  "/users/:username/favorites/:movieId",
  requireJWTAuth,
  async (req, res, next) => {
    // Authorization check
    if (req.user.username !== req.params.username) {
      return res
        .status(403)
        .json({ error: "Forbidden: You can only modify your own favorites." });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) {
      return res.status(400).json({ error: "Invalid Movie ID format." });
    }

    try {
      // Remove movie from user's favoriteMovies array
      const user = await Users.findByIdAndUpdate(
        req.user._id, // Use logged-in user's ID
        { $pull: { favoriteMovies: req.params.movieId } }, // $pull removes item from array
        { new: true }
      )
        .select("-password")
        .populate("favoriteMovies");

      if (!user) return res.status(404).json({ error: "User not found." });
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }
);

// Endpoint to deregister (delete) a user (requires authentication)
app.delete("/users/:username", requireJWTAuth, async (req, res, next) => {
  // Authorization check
  if (req.user.username !== req.params.username) {
    return res
      .status(403)
      .json({ error: "Forbidden: You can only delete your own account." });
  }
  try {
    const deletedUser = await Users.findByIdAndDelete(req.user._id); // Use ID for deletion
    if (!deletedUser)
      return res
        .status(404)
        .json({ error: "User not found (perhaps already deleted)." });
    res
      .status(200)
      .json({
        message: `User account "${deletedUser.username}" deleted successfully.`,
      });
  } catch (err) {
    next(err);
  }
});


// --- Genre Routes ---
// Endpoint to get all genres (requires authentication)
app.get("/genres", requireJWTAuth, async (req, res, next) => {
  try {
    const genres = await Genres.find().select("name description"); // Select specific fields
    res.status(200).json(genres);
  } catch (err) {
    next(err);
  }
});

// Endpoint to get a genre by name (requires authentication)
app.get("/genres/:name", requireJWTAuth, async (req, res, next) => {
  try {
    const genreNameSearch = decodeURIComponent(req.params.name);
    const genre = await Genres.findOne({
      name: { $regex: new RegExp("^" + genreNameSearch + "$", "i") },
    });
    if (!genre)
      return res
        .status(404)
        .json({ error: `Genre "${genreNameSearch}" not found.` });
    res.status(200).json(genre);
  } catch (err) {
    next(err);
  }
});

// Endpoint to add a new genre (requires authentication)
app.post(
  "/genres",
  requireJWTAuth,
  // Validation middleware for new genre data
  [
    check("name", "Name is required").trim().notEmpty(),
    check("description", "Description is required").trim().notEmpty(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const { name, description } = req.body;
      const newGenre = new Genres({ name, description });
      const savedGenre = await newGenre.save();
      res.status(201).json(savedGenre);
    } catch (err) {
      // Handle duplicate key error for genre name
      if (err.code === 11000)
        return res
          .status(400)
          .json({ error: `Genre name "${req.body.name}" already exists.` });
      next(err);
    }
  }
);

// Endpoint to update a genre's description by name (requires authentication)
app.put(
  "/genres/:name",
  requireJWTAuth,
  [check("description", "Description is required").trim().notEmpty()],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const genreNameSearch = decodeURIComponent(req.params.name);
      const { description } = req.body;
      const updatedGenre = await Genres.findOneAndUpdate(
        { name: { $regex: new RegExp("^" + genreNameSearch + "$", "i") } },
        { $set: { description } },
        { new: true, runValidators: true }
      );
      if (!updatedGenre)
        return res
          .status(404)
          .json({ error: `Genre "${genreNameSearch}" not found.` });
      res.status(200).json(updatedGenre);
    } catch (err) {
      next(err);
    }
  }
);

// Endpoint to delete a genre by name (requires authentication)
app.delete("/genres/:name", requireJWTAuth, async (req, res, next) => {
  try {
    const genreNameSearch = decodeURIComponent(req.params.name);
    const genre = await Genres.findOne({
      name: { $regex: new RegExp("^" + genreNameSearch + "$", "i") },
    });
    if (!genre)
      return res
        .status(404)
        .json({ error: `Genre "${genreNameSearch}" not found.` });

    // Check if any movies are using this genre before deleting
    const moviesUsingGenre = await Movies.find({ Genre: genre._id }).limit(1);
    if (moviesUsingGenre.length > 0)
      return res
        .status(400)
        .json({
          error: `Cannot delete genre "${genre.name}" as it is assigned to one or more movies.`,
        });

    const deletedGenre = await Genres.findByIdAndDelete(genre._id);
    if (!deletedGenre) // Should not happen if found above, but good check
      return res
        .status(404)
        .json({
          error: `Genre "${genreNameSearch}" not found (concurrent delete?).`,
        });
    res
      .status(200)
      .json({ message: `Genre "${deletedGenre.name}" deleted successfully.` });
  } catch (err) {
    next(err);
  }
});


// --- Director Routes ---
// Endpoint to get all directors (requires authentication)
app.get("/directors", requireJWTAuth, async (req, res, next) => {
  try {
    const directors = await Directors.find().select("name bio birth death");
    res.status(200).json(directors);
  } catch (err) {
    next(err);
  }
});

// Endpoint to get directors by name (search, requires authentication)
app.get("/directors/name/:name", requireJWTAuth, async (req, res, next) => {
  try {
    const directorNameSearch = decodeURIComponent(req.params.name);
    // Case-insensitive search for directors containing the search term
    const directors = await Directors.find({
      name: { $regex: new RegExp(directorNameSearch, "i") },
    });
    if (!directors || directors.length === 0)
      return res
        .status(404)
        .json({
          error: `No directors found matching "${directorNameSearch}".`,
        });
    res.status(200).json(directors);
  } catch (err) {
    next(err);
  }
});

// Endpoint to get a director by ID (requires authentication)
app.get("/directors/:directorId", requireJWTAuth, async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.directorId)) {
    return res.status(400).json({ error: "Invalid Director ID format." });
  }
  try {
    const director = await Directors.findById(req.params.directorId);
    if (!director)
      return res.status(404).json({ error: "Director not found." });
    res.status(200).json(director);
  } catch (err) {
    next(err);
  }
});

// Endpoint to add a new director (requires authentication)
app.post(
  "/directors",
  requireJWTAuth,
  // Validation middleware for new director data
  [
    check("name", "Name is required").trim().notEmpty(),
    check("bio", "Bio is required").trim().notEmpty(),
    check("birth", "Birth date must be a valid date (YYYY-MM-DD)")
      .notEmpty() // Birth date is required
      .isISO8601()
      .toDate(),
    check("death", "Death date must be a valid date (YYYY-MM-DD) if provided")
      .optional({ nullable: true, checkFalsy: true }) // Allows null or empty string for "not deceased"
      .isISO8601()
      .toDate(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const { name, bio, birth, death } = req.body;
      const newDirector = new Directors({
        name,
        bio,
        birth,
        death: death || null, // Store as null if not provided or empty
      });
      const savedDirector = await newDirector.save();
      res.status(201).json(savedDirector);
    } catch (err) {
      // Handle duplicate key error for director name
      if (err.code === 11000)
        return res
          .status(400)
          .json({ error: `Director name "${req.body.name}" already exists.` });
      next(err);
    }
  }
);

// Endpoint to update a director by ID (requires authentication)
app.put(
  "/directors/:directorId",
  requireJWTAuth,
  // Validation middleware for director update data
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
      .optional({ nullable: true, checkFalsy: true })
      .isISO8601()
      .toDate(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    if (!mongoose.Types.ObjectId.isValid(req.params.directorId))
      return res.status(400).json({ error: "Invalid Director ID format." });

    try {
      const { name, bio, birth, death } = req.body;
      const updateData = {};
      // Add fields to updateData only if they are provided
      if (name !== undefined) updateData.name = name;
      if (bio !== undefined) updateData.bio = bio;
      if (birth !== undefined) updateData.birth = birth;
      if (death !== undefined) updateData.death = death === "" ? null : death; // Allow clearing death date

      if (Object.keys(updateData).length === 0)
        return res
          .status(400)
          .json({ error: "No valid fields provided for update." });

      const updatedDirector = await Directors.findByIdAndUpdate(
        req.params.directorId,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      if (!updatedDirector)
        return res.status(404).json({ error: "Director not found." });
      res.status(200).json(updatedDirector);
    } catch (err) {
      // Handle duplicate name error on update
      if (err.code === 11000 && err.keyPattern && err.keyPattern.name)
        return res
          .status(400)
          .json({
            error: `Cannot update: Director name "${req.body.name}" is already taken.`,
          });
      next(err);
    }
  }
);

// Endpoint to delete a director by ID (requires authentication)
app.delete("/directors/:directorId", requireJWTAuth, async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.directorId))
    return res.status(400).json({ error: "Invalid Director ID format." });

  try {
    // Check if any movies are associated with this director before deleting
    const moviesUsingDirector = await Movies.find({
      Director: req.params.directorId,
    }).limit(1); // Efficiently check for existence

    if (moviesUsingDirector.length > 0) {
      const director = await Directors.findById(req.params.directorId).select(
        "name"
      ); // Get director name for error message
      return res
        .status(400)
        .json({
          error: `Cannot delete director "${
            director ? director.name : "ID: " + req.params.directorId
          }" as they are assigned to one or more movies.`,
        });
    }

    const deletedDirector = await Directors.findByIdAndDelete(
      req.params.directorId
    );
    if (!deletedDirector)
      return res.status(404).json({ error: "Director not found." });
    res
      .status(200)
      .json({
        message: `Director "${deletedDirector.name}" deleted successfully.`,
      });
  } catch (err) {
    next(err);
  }
});


// --- Actor Routes ---
// Endpoint to get all actors (requires authentication)
app.get("/actors", requireJWTAuth, async (req, res, next) => {
  try {
    const actors = await Actors.find().select(
      "name bio birth death pictureUrl" // Select specific fields
    );
    res.status(200).json(actors);
  } catch (err) {
    next(err);
  }
});

// Endpoint to get actors by name (search, requires authentication)
app.get("/actors/name/:name", requireJWTAuth, async (req, res, next) => {
  try {
    const actorNameSearch = decodeURIComponent(req.params.name);
    const actors = await Actors.find({
      name: { $regex: new RegExp(actorNameSearch, "i") }, // Case-insensitive partial match
    });
    if (!actors || actors.length === 0)
      return res
        .status(404)
        .json({ error: `No actors found matching "${actorNameSearch}".` });
    res.status(200).json(actors);
  } catch (err) {
    next(err);
  }
});

// Endpoint to get a single actor by ID (requires authentication)
app.get("/actors/:actorId", requireJWTAuth, async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.actorId))
    return res.status(400).json({ error: "Invalid Actor ID format." });
  try {
    const actor = await Actors.findById(req.params.actorId);
    if (!actor) return res.status(404).json({ error: "Actor not found." });
    res.status(200).json(actor);
  } catch (err) {
    next(err);
  }
});

// Endpoint to add a new actor (requires authentication)
app.post(
  "/actors",
  requireJWTAuth,
  // Validation middleware for new actor data
  [
    check("name", "Name is required").trim().notEmpty(),
    check("bio", "Bio is required").trim().notEmpty(),
    check("birth", "Birth date must be a valid date (YYYY-MM-DD)")
      .notEmpty()
      .isISO8601()
      .toDate(),
    check("death", "Death date must be a valid date (YYYY-MM-DD) if provided")
      .optional({ nullable: true, checkFalsy: true })
      .isISO8601()
      .toDate(),
    check("pictureUrl", "Picture URL must be a valid URL if provided")
      .optional({ nullable: true, checkFalsy: true })
      .isURL(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

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
      if (err.code === 11000) // Duplicate key error
        return res
          .status(400)
          .json({ error: `Actor name "${req.body.name}" already exists.` });
      next(err);
    }
  }
);

// Endpoint to update an actor by ID (requires authentication)
app.put(
  "/actors/:actorId",
  requireJWTAuth,
  // Validation middleware for actor update data
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
      .optional({ nullable: true, checkFalsy: true })
      .isISO8601()
      .toDate(),
    check("pictureUrl", "Picture URL must be a valid URL or null")
      .optional({ nullable: true, checkFalsy: true }) // Allow empty string to clear URL
      .isURL(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    if (!mongoose.Types.ObjectId.isValid(req.params.actorId))
      return res.status(400).json({ error: "Invalid Actor ID format." });

    try {
      const { name, bio, birth, death, pictureUrl } = req.body;
      const updateData = {};
      // Add fields to updateData only if they are provided
      if (name !== undefined) updateData.name = name;
      if (bio !== undefined) updateData.bio = bio;
      if (birth !== undefined) updateData.birth = birth;
      if (death !== undefined) updateData.death = death === "" ? null : death;
      if (pictureUrl !== undefined) updateData.pictureUrl = pictureUrl === "" ? null : pictureUrl;

      if (Object.keys(updateData).length === 0)
        return res
          .status(400)
          .json({ error: "No valid fields provided for update." });

      const updatedActor = await Actors.findByIdAndUpdate(
        req.params.actorId,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      if (!updatedActor)
        return res.status(404).json({ error: "Actor not found." });
      res.status(200).json(updatedActor);
    } catch (err) {
      // Handle duplicate name error on update
      if (err.code === 11000 && err.keyPattern && err.keyPattern.name)
        return res
          .status(400)
          .json({
            error: `Cannot update: Actor name "${req.body.name}" is already taken.`,
          });
      next(err);
    }
  }
);

// Endpoint to delete an actor by ID (requires authentication)
app.delete("/actors/:actorId", requireJWTAuth, async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.actorId))
    return res.status(400).json({ error: "Invalid Actor ID format." });

  try {
    // Check if this actor is part of any movie's cast before deleting
    const moviesWithActor = await Movies.find({ Actors: req.params.actorId }).limit(1);
    if (moviesWithActor.length > 0) {
      const actor = await Actors.findById(req.params.actorId).select("name");
      return res
        .status(400)
        .json({
          error: `Cannot delete actor "${
            actor ? actor.name : "ID: " + req.params.actorId
          }" as they are assigned to one or more movies.`,
        });
    }

    const deletedActor = await Actors.findByIdAndDelete(req.params.actorId);
    if (!deletedActor)
      return res.status(404).json({ error: "Actor not found." });
    res
      .status(200)
      .json({ message: `Actor "${deletedActor.name}" deleted successfully.` });
  } catch (err) {
    next(err);
  }
});


// --- Admin Routes (Example placeholder for administrative functions) ---
// Middleware to check if user has admin role (simple placeholder)
const isAdmin = (req, res, next) => {
  // In a real application, you'd check req.user.role or similar
  // For now, this is a passthrough allowing any authenticated user.
  // if (req.user && req.user.role === 'admin') {
  //   return next();
  // }
  // return res.status(403).json({ error: "Forbidden: Admin access required." });
  next(); // Placeholder: allows all authenticated users for now
};

// Example admin route: Get all users (requires authentication and admin role)
app.get("/admin/users", requireJWTAuth, isAdmin, async (req, res, next) => {
  try {
    const users = await Users.find().select("-password"); // Exclude passwords
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
});

// Example admin route: Get all movies with populated details
app.get("/admin/movies", requireJWTAuth, isAdmin, async (req, res, next) => {
  try {
    const movies = await Movies.find()
      .populate("Genre", "name")
      .populate("Director", "name")
      .populate("Actors", "name");
    res.status(200).json(movies);
  } catch (err) {
    next(err);
  }
});

// Example admin route: Get all genres
app.get("/admin/genres", requireJWTAuth, isAdmin, async (req, res, next) => {
  try {
    const genres = await Genres.find();
    res.status(200).json(genres);
  } catch (err) {
    next(err);
  }
});

// Example admin route: Get all directors
app.get("/admin/directors", requireJWTAuth, isAdmin, async (req, res, next) => {
  try {
    const directors = await Directors.find();
    res.status(200).json(directors);
  } catch (err) {
    next(err);
  }
});

// Example admin route: Get all actors
app.get("/admin/actors", requireJWTAuth, isAdmin, async (req, res, next) => {
  try {
    const actors = await Actors.find();
    res.status(200).json(actors);
  } catch (err) {
    next(err);
  }
});

// --- Global Error Handling Middleware ---
// This middleware catches all errors passed by `next(err)` from route handlers.
app.use((err, req, res, next) => {
  let statusCode = err.status || 500; // Default to 500 Internal Server Error
  let errorMessage =
    err.message || "An unexpected internal server error occurred.";

  // Customize error messages and codes based on error type
  if (err.name === "UnauthorizedError" || err.message === "No auth token") {
    statusCode = 401;
    errorMessage = "Invalid or missing authentication token.";
  } else if (err.name === "ValidationError") { // Mongoose validation error
    statusCode = 400;
    errorMessage = `Validation Error: ${err.message}`;
  } else if (err instanceof mongoose.Error.CastError) { // Mongoose CastError (e.g., invalid ObjectId)
    statusCode = 400;
    errorMessage = `Invalid ID format for parameter '${err.path}'. Value: '${err.value}'`;
  } else if (err.code === 11000) { // MongoDB duplicate key error
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    errorMessage = `${field.charAt(0).toUpperCase() + field.slice(1)} '${
      err.keyValue[field]
    }' already exists.`;
  } else if (statusCode >= 500 && process.env.NODE_ENV === "production") {
    // For 500 errors in production, send a generic message
    errorMessage = "An internal server error occurred. Please try again later.";
  }

  // Log detailed error in development, or only essential info in production for 500s
  if (process.env.NODE_ENV !== "production") {
    console.error("--- Global Error Handler (Dev) ---");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Request URL:", req.originalUrl);
    console.error("Request Method:", req.method);
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
    console.error("Error Stack:", err.stack); // Full stack trace in dev
    console.error("--- End Global Error Handler (Dev) ---");
  } else if (statusCode >= 500) {
    // Log less detail for 500 errors in production to avoid leaking sensitive info
    console.error("--- Production 500 Error ---");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Request URL:", req.originalUrl);
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message); // Avoid logging full stack in prod logs if too verbose
    console.error("--- End Production 500 Error ---");
  }

  // Send JSON response with the error status and message
  res.status(statusCode).json({ error: errorMessage });
});

// Start the Express server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`MovieMobs API Server is listening on Port ${PORT}`);
});

/*
This is the main server file for the MovieMobs backend API.
It sets up an Express application with various middlewares and defines API endpoints.
Key functionalities include:
- Environment variable loading (`dotenv`).
- MongoDB connection using Mongoose.
- Middleware:
    - `morgan` for HTTP request logging.
    - `cors` for handling Cross-Origin Resource Sharing, configured with a list of allowed origins.
    - `bodyParser` for parsing JSON and URL-encoded request bodies.
    - `express.static` for serving static files (like documentation).
    - `passport` for JWT-based authentication, with a custom `./passport.js` configuration.
- API Endpoints:
    - User registration (`/users` POST) with validation.
    - User login (`/login` POST, handled by `./auth.js`).
    - CRUD operations for Movies, Genres, Directors, Actors (GET, POST, PUT, DELETE).
    - Endpoints to manage user profiles and favorite movies.
    - All data-accessing endpoints (except login/register) require JWT authentication.
    - Endpoints for searching/filtering movies by title, genre, director.
    - Placeholder admin routes for managing all data.
- Input validation using `express-validator`.
- Robust error handling, including a global error handling middleware that customizes
  responses based on error types and environment (development vs. production).
- The server listens on the port defined by the `PORT` environment variable or defaults to 8080.
*/