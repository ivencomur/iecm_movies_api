require('dotenv').config();

const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const path = require("path");
const { validationResult, check } = require("express-validator");
const passport = require('passport');
const cors = require('cors');

require('./passport');

let Models;
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

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("FATAL ERROR: MONGO_URI environment variable is not set.");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
    console.warn("WARNING: JWT_SECRET environment variable is not set. Authentication will likely fail.");
}

const app = express();

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Successfully connected to MongoDB using Mongoose."))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

app.use(morgan("common"));

const allowedOrigins = ['http://localhost:1234', 'http://localhost:4200', 'https://yourfrontenddomain.com', '*'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') ) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

let auth = require('./auth')(app);
app.use(passport.initialize());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("/documentation", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'documentation.html'));
});

app.post("/users",
  [
    check('username', 'Username must be alphanumeric and at least 5 characters long').isLength({ min: 5 }).isAlphanumeric(),
    check('password', 'Password is required and must be at least 8 characters long').isLength({ min: 8 }),
    check('email', 'A valid email address is required').isEmail(),
    check('birthday', 'Birthday must be a valid date').optional().isISO8601().toDate(),
    check('firstname', 'First name must be a string').optional().isString().notEmpty(),
    check('lastname', 'Last name must be a string').optional().isString().notEmpty()
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { username, password, email, birthday, firstname, lastname } = req.body;
      const existingUser = await Users.findOne({ $or: [{ username: username }, { email: email }] });
      if (existingUser) {
        const message = existingUser.username === username
          ? `Username "${username}" already exists.`
          : `Email "${email}" is already registered.`;
        return res.status(400).json({ error: message });
      }
      const hashedPassword = Users.hashPassword(password);
      const newUser = new Users({ username, password: hashedPassword, email, birthday, firstname, lastname });
      const savedUser = await newUser.save();
      const userResponse = { ...savedUser.toJSON() };
      delete userResponse.password;
      res.status(201).json(userResponse);
    } catch (err) {
       next(err);
    }
  });

const requireJWTAuth = passport.authenticate('jwt', { session: false });

app.get("/movies", requireJWTAuth, async (req, res, next) => {
  try {
    const movies = await Movies.find().populate("genre", "name description").populate("director", "name bio").populate("actors", "name");
    res.status(200).json(movies);
  } catch (err) { next(err); }
});

app.get("/movies/:movieId", requireJWTAuth, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) return res.status(400).json({ error: "Invalid Movie ID format." });
    const movie = await Movies.findById(req.params.movieId).populate("genre").populate("director").populate("actors");
    if (!movie) return res.status(404).json({ error: "Movie not found." });
    res.status(200).json(movie);
  } catch (err) { next(err); }
});

app.get("/movies/title/:title", requireJWTAuth, async (req, res, next) => {
  try {
    const titleSearch = decodeURIComponent(req.params.title);
    const movie = await Movies.findOne({ title: { $regex: new RegExp('^' + titleSearch + '$', "i") } }).populate("genre").populate("director").populate("actors");
    if (!movie) return res.status(404).json({ error: `Movie with title "${titleSearch}" not found.` });
    res.status(200).json(movie);
  } catch (err) { next(err); }
});

app.get("/movies/genre/:genreName", requireJWTAuth, async (req, res, next) => {
   try {
     const genreNameSearch = decodeURIComponent(req.params.genreName);
     const genre = await Genres.findOne({ name: { $regex: new RegExp('^' + genreNameSearch + '$', "i") } });
     if (!genre) return res.status(404).json({ error: `Genre "${genreNameSearch}" not found.` });
     const movies = await Movies.find({ genre: genre._id }).populate("genre", "name").populate("director", "name").populate("actors", "name");
     res.status(200).json(movies);
   } catch (err) { next(err); }
 });

app.get("/movies/director/:directorName", requireJWTAuth, async (req, res, next) => {
  try {
    const directorNameSearch = decodeURIComponent(req.params.directorName);
    const director = await Directors.findOne({ name: { $regex: new RegExp('^' + directorNameSearch + '$', "i") } });
     if (!director) return res.status(404).json({ error: `Director "${directorNameSearch}" not found.` });
    const movies = await Movies.find({ director: director._id }).populate("genre", "name").populate("director", "name").populate("actors", "name");
    res.status(200).json(movies);
  } catch (err) { next(err); }
});

app.post("/movies", requireJWTAuth,
  [
    check('title', 'Title is required').trim().notEmpty(), check('description', 'Description is required').trim().notEmpty(),
    check('genre', 'Genre name is required').trim().notEmpty(), check('director', 'Director name is required').trim().notEmpty(),
    check('actors', 'Actors must be an array of names').optional().isArray(), check('imagePath', 'ImagePath must be a URL').optional({ checkFalsy: true }).isURL(),
    check('featured', 'Featured must be a boolean').optional().isBoolean(), check('releaseYear', 'Release year must be a valid year').optional().isInt({ min: 1888, max: new Date().getFullYear() + 5 }),
    check('rating', 'Rating must be between 0 and 10').optional().isFloat({ min: 0, max: 10 })
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { title, description, genre: genreName, director: directorName, actors: actorNames = [], imagePath, featured, releaseYear, rating } = req.body;
      const existingMovie = await Movies.findOne({ title: title });
      if (existingMovie) return res.status(400).json({ error: `Movie with title "${title}" already exists.` });
      const genreDoc = await Genres.findOne({ name: { $regex: new RegExp('^' + genreName + '$', "i") } });
      if (!genreDoc) return res.status(400).json({ error: `Genre "${genreName}" not found.` });
      const directorDoc = await Directors.findOne({ name: { $regex: new RegExp('^' + directorName + '$', "i") } });
      if (!directorDoc) return res.status(400).json({ error: `Director "${directorName}" not found.` });
      let actorIds = [];
      if (actorNames.length > 0) {
          const actorDocs = await Actors.find({ name: { $in: actorNames.map(name => new RegExp('^' + name + '$', 'i')) } });
          actorIds = actorDocs.map((actor) => actor._id);
          if (actorIds.length !== actorNames.length) console.warn("POST /movies: Some actors provided were not found:", actorNames.filter(name => !actorDocs.find(doc => doc.name.toLowerCase() === name.toLowerCase())));
      }
      const newMovie = new Movies({ title, description, releaseYear, rating, genre: genreDoc._id, director: directorDoc._id, actors: actorIds, imagePath, featured });
      const savedMovie = await newMovie.save();
      const populatedMovie = await Movies.findById(savedMovie._id).populate("genre").populate("director").populate("actors");
      res.status(201).json(populatedMovie);
    } catch (err) { next(err); }
  });

app.put("/movies/:movieId", requireJWTAuth,
  [
    check('title', 'Title must be a non-empty string').optional().trim().notEmpty(), check('description', 'Description must be a non-empty string').optional().trim().notEmpty(),
    check('genre', 'Genre name must be a non-empty string').optional().trim().notEmpty(), check('director', 'Director name must be a non-empty string').optional().trim().notEmpty(),
    check('actors', 'Actors must be an array of names').optional().isArray(), check('imagePath', 'ImagePath must be a URL').optional({ checkFalsy: true }).isURL(),
    check('featured', 'Featured must be a boolean').optional().isBoolean(), check('releaseYear', 'Release year must be a valid year').optional().isInt({ min: 1888, max: new Date().getFullYear() + 5 }),
    check('rating', 'Rating must be between 0 and 10').optional().isFloat({ min: 0, max: 10 })
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) return res.status(400).json({ error: "Invalid Movie ID format." });
    try {
      const { title, description, genre: genreName, director: directorName, actors: actorNames, imagePath, featured, releaseYear, rating } = req.body;
      const updateData = {};
      if (title !== undefined) updateData.title = title; if (description !== undefined) updateData.description = description;
      if (imagePath !== undefined) updateData.imagePath = imagePath; if (featured !== undefined) updateData.featured = featured;
      if (releaseYear !== undefined) updateData.releaseYear = releaseYear; if (rating !== undefined) updateData.rating = rating;
      if (genreName !== undefined) { const genreDoc = await Genres.findOne({ name: { $regex: new RegExp('^' + genreName + '$', "i") } }); if (!genreDoc) return res.status(400).json({ error: `Genre "${genreName}" not found.` }); updateData.genre = genreDoc._id; }
      if (directorName !== undefined) { const directorDoc = await Directors.findOne({ name: { $regex: new RegExp('^' + directorName + '$', "i") } }); if (!directorDoc) return res.status(400).json({ error: `Director "${directorName}" not found.` }); updateData.director = directorDoc._id; }
      if (actorNames !== undefined) { if (!Array.isArray(actorNames)) return res.status(400).json({ error: "Actors field must be an array of names." }); const actorDocs = await Actors.find({ name: { $in: actorNames.map(name => new RegExp('^' + name + '$', 'i')) } }); updateData.actors = actorDocs.map((actor) => actor._id); if (updateData.actors.length !== actorNames.length) console.warn("PUT /movies: Some actors provided were not found."); }
      if (Object.keys(updateData).length === 0) return res.status(400).json({ error: "No valid fields provided for update." });
      const updatedMovie = await Movies.findByIdAndUpdate(req.params.movieId, { $set: updateData }, { new: true, runValidators: true }).populate("genre").populate("director").populate("actors");
      if (!updatedMovie) return res.status(404).json({ error: "Movie not found." });
      res.status(200).json(updatedMovie);
    } catch (err) { next(err); }
  });

app.delete("/movies/:movieId", requireJWTAuth, async (req, res, next) => {
   if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) return res.status(400).json({ error: "Invalid Movie ID format." });
  try {
    const deletedMovie = await Movies.findByIdAndDelete(req.params.movieId);
    if (!deletedMovie) return res.status(404).json({ error: "Movie not found." });
    await Users.updateMany({ favoriteMovies: req.params.movieId }, { $pull: { favoriteMovies: req.params.movieId } });
    res.status(200).json({ message: `Movie "${deletedMovie.title}" deleted successfully.` });
  } catch (err) { next(err); }
});

app.get("/movies/:movieId/actors", requireJWTAuth, async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) return res.status(400).json({ error: "Invalid Movie ID format." });
  try {
    const movie = await Movies.findById(req.params.movieId).populate("actors", "name bio birth death pictureUrl");
    if (!movie) return res.status(404).json({ error: "Movie not found." });
    res.status(200).json(movie.actors || []);
  } catch (err) { next(err); }
});

app.get('/users/:username', requireJWTAuth, async (req, res, next) => {
    if (req.user.username !== req.params.username) return res.status(403).json({ error: "Forbidden: You can only view your own profile."});
    try {
        const user = await Users.findOne({ username: req.params.username }).select('-password').populate('favoriteMovies');
        if (!user) return res.status(404).json({ error: "User not found." });
        res.status(200).json(user);
    } catch (err) { next(err); }
});

app.put('/users/:username', requireJWTAuth,
    [
        check('username', 'Username must be alphanumeric and at least 5 characters long').optional().isLength({ min: 5 }).isAlphanumeric(), check('email', 'A valid email address is required').optional().isEmail(),
        check('birthday', 'Birthday must be a valid date').optional().isISO8601().toDate(), check('firstname', 'First name must be a string').optional().isString().notEmpty(),
        check('lastname', 'Last name must be a string').optional().isString().notEmpty()
    ],
    async (req, res, next) => {
        if (req.user.username !== req.params.username) return res.status(403).json({ error: "Forbidden: You can only update your own profile."});
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        try {
            const { username, email, birthday, firstname, lastname } = req.body; const updateData = {};
            if (username !== undefined) updateData.username = username; if (email !== undefined) updateData.email = email;
            if (birthday !== undefined) updateData.birthday = birthday; if (firstname !== undefined) updateData.firstname = firstname;
            if (lastname !== undefined) updateData.lastname = lastname;
            if (username || email) { const orChecks = []; if (username) orChecks.push({ username: username }); if (email) orChecks.push({ email: email }); const existingUser = await Users.findOne({ $or: orChecks, _id: { $ne: req.user._id } }); if (existingUser) { const message = existingUser.username === username ? `Username "${username}" is already taken.` : `Email "${email}" is already registered.`; return res.status(400).json({ error: message }); } }
            if (Object.keys(updateData).length === 0) return res.status(400).json({ error: "No valid fields provided for update." });
            const updatedUser = await Users.findOneAndUpdate({ username: req.params.username }, { $set: updateData }, { new: true, runValidators: true }).select('-password');
            if (!updatedUser) return res.status(404).json({ error: "User not found for update." });
            res.status(200).json(updatedUser);
        } catch (err) { next(err); }
});

app.post("/users/:username/favorites/:movieId", requireJWTAuth, async (req, res, next) => {
    if (req.user.username !== req.params.username) return res.status(403).json({ error: "Forbidden: You can only modify your own favorites."});
    if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) return res.status(400).json({ error: "Invalid Movie ID format." });
  try {
      const movie = await Movies.findById(req.params.movieId); if (!movie) return res.status(404).json({ error: "Movie not found." });
      const user = await Users.findByIdAndUpdate(req.user._id, { $addToSet: { favoriteMovies: movie._id } }, { new: true }).select('-password').populate('favoriteMovies');
    if (!user) return res.status(404).json({ error: "User not found." });
    res.status(200).json(user);
  } catch (err) { next(err); }
});

app.delete("/users/:username/favorites/:movieId", requireJWTAuth, async (req, res, next) => {
    if (req.user.username !== req.params.username) return res.status(403).json({ error: "Forbidden: You can only modify your own favorites."});
    if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) return res.status(400).json({ error: "Invalid Movie ID format." });
  try {
    const user = await Users.findByIdAndUpdate(req.user._id, { $pull: { favoriteMovies: req.params.movieId } }, { new: true }).select('-password').populate('favoriteMovies');
    if (!user) return res.status(404).json({ error: "User not found." });
    res.status(200).json(user);
  } catch (err) { next(err); }
});

app.delete("/users/:username", requireJWTAuth, async (req, res, next) => {
    if (req.user.username !== req.params.username) return res.status(403).json({ error: "Forbidden: You can only delete your own account."});
  try {
    const deletedUser = await Users.findByIdAndDelete(req.user._id);
    if (!deletedUser) { console.warn(`Attempted to delete user ${req.params.username} (ID: ${req.user._id}) but they were already gone.`); return res.status(404).json({ error: "User not found (already deleted)." }); }
    res.status(200).json({ message: `User account "${deletedUser.username}" deleted successfully.` });
  } catch (err) { next(err); }
});

app.get("/genres", requireJWTAuth, async (req, res, next) => {
  try { const genres = await Genres.find().select('name description'); res.status(200).json(genres); } catch (err) { next(err); }
});

app.get("/genres/:name", requireJWTAuth, async (req, res, next) => {
  try { const genreNameSearch = decodeURIComponent(req.params.name); const genre = await Genres.findOne({ name: { $regex: new RegExp('^' + genreNameSearch + '$', "i") } }); if (!genre) return res.status(404).json({ error: `Genre "${genreNameSearch}" not found.` }); res.status(200).json(genre); } catch (err) { next(err); }
});

app.post("/genres", requireJWTAuth,
  [ check('name', 'Name is required').trim().notEmpty(), check('description', 'Description is required').trim().notEmpty() ],
  async (req, res, next) => {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try { const { name, description } = req.body; const newGenre = new Genres({ name, description }); const savedGenre = await newGenre.save(); res.status(201).json(savedGenre); }
    catch (err) { if (err.code === 11000) return res.status(400).json({ error: `Genre name "${req.body.name}" already exists.` }); next(err); }
  });

app.put("/genres/:name", requireJWTAuth,
  [ check('description', 'Description is required').trim().notEmpty() ],
  async (req, res, next) => {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try { const genreNameSearch = decodeURIComponent(req.params.name); const { description } = req.body; const updatedGenre = await Genres.findOneAndUpdate({ name: { $regex: new RegExp('^' + genreNameSearch + '$', "i") } }, { $set: { description } }, { new: true, runValidators: true }); if (!updatedGenre) return res.status(404).json({ error: `Genre "${genreNameSearch}" not found.` }); res.status(200).json(updatedGenre); } catch (err) { next(err); }
  });

app.delete("/genres/:name", requireJWTAuth, async (req, res, next) => {
  try { const genreNameSearch = decodeURIComponent(req.params.name); const genre = await Genres.findOne({ name: { $regex: new RegExp('^' + genreNameSearch + '$', "i") } }); if (!genre) return res.status(404).json({ error: `Genre "${genreNameSearch}" not found.` }); const moviesUsingGenre = await Movies.find({ genre: genre._id }).limit(1); if (moviesUsingGenre.length > 0) return res.status(400).json({ error: `Cannot delete genre "${genre.name}" as it is assigned to movie(s).` }); const deletedGenre = await Genres.findByIdAndDelete(genre._id); if (!deletedGenre) return res.status(404).json({ error: `Genre "${genreNameSearch}" not found (concurrent delete?).` }); res.status(200).json({ message: `Genre "${deletedGenre.name}" deleted successfully.` }); } catch (err) { next(err); }
});

app.get("/directors", requireJWTAuth, async (req, res, next) => {
  try { const directors = await Directors.find().select('name bio birth death'); res.status(200).json(directors); } catch (err) { next(err); }
});

app.get("/directors/name/:name", requireJWTAuth, async (req, res, next) => {
  try { const directorNameSearch = decodeURIComponent(req.params.name); const directors = await Directors.find({ name: { $regex: new RegExp(directorNameSearch, "i") } }); if (!directors || directors.length === 0) return res.status(404).json({ error: `No directors found matching "${directorNameSearch}".` }); res.status(200).json(directors); } catch (err) { next(err); }
});

app.post("/directors", requireJWTAuth,
  [ check('name', 'Name is required').trim().notEmpty(), check('bio', 'Bio is required').trim().notEmpty(), check('birth', 'Birth date must be a valid date').notEmpty().isISO8601().toDate(), check('death', 'Death date must be a valid date if provided').optional({ nullable: true }).isISO8601().toDate() ],
  async (req, res, next) => {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try { const { name, bio, birth, death } = req.body; const newDirector = new Directors({ name, bio, birth, death: death || null }); const savedDirector = await newDirector.save(); res.status(201).json(savedDirector); }
    catch (err) { if (err.code === 11000) return res.status(400).json({ error: `Director name "${req.body.name}" already exists.` }); next(err); }
  });

app.put("/directors/:directorId", requireJWTAuth,
  [ check('name', 'Name must be a non-empty string').optional().trim().notEmpty(), check('bio', 'Bio must be a non-empty string').optional().trim().notEmpty(), check('birth', 'Birth date must be a valid date').optional().isISO8601().toDate(), check('death', 'Death date must be a valid date or null').optional({ nullable: true }).isISO8601().toDate() ],
  async (req, res, next) => {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() }); if (!mongoose.Types.ObjectId.isValid(req.params.directorId)) return res.status(400).json({ error: "Invalid Director ID format." });
    try { const { name, bio, birth, death } = req.body; const updateData = {}; if (name !== undefined) updateData.name = name; if (bio !== undefined) updateData.bio = bio; if (birth !== undefined) updateData.birth = birth; if (death !== undefined) updateData.death = death; if (Object.keys(updateData).length === 0) return res.status(400).json({ error: "No valid fields provided for update." }); const updatedDirector = await Directors.findByIdAndUpdate(req.params.directorId, { $set: updateData }, { new: true, runValidators: true }); if (!updatedDirector) return res.status(404).json({ error: "Director not found." }); res.status(200).json(updatedDirector); }
    catch (err) { if (err.code === 11000 && err.keyPattern && err.keyPattern.name) return res.status(400).json({ error: `Cannot update: Director name "${req.body.name}" is already taken.` }); next(err); }
  });

app.delete("/directors/:directorId", requireJWTAuth, async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.directorId)) return res.status(400).json({ error: "Invalid Director ID format." });
  try { const moviesUsingDirector = await Movies.find({ director: req.params.directorId }).limit(1); if (moviesUsingDirector.length > 0) { const director = await Directors.findById(req.params.directorId).select('name'); return res.status(400).json({ error: `Cannot delete director "${director ? director.name : 'ID: '+req.params.directorId}" as they are assigned to movie(s).` }); } const deletedDirector = await Directors.findByIdAndDelete(req.params.directorId); if (!deletedDirector) return res.status(404).json({ error: "Director not found." }); res.status(200).json({ message: `Director "${deletedDirector.name}" deleted successfully.` }); } catch (err) { next(err); }
});

app.get("/actors", requireJWTAuth, async (req, res, next) => {
  try { const actors = await Actors.find().select('name bio birth death pictureUrl'); res.status(200).json(actors); } catch (err) { next(err); }
});

app.get("/actors/name/:name", requireJWTAuth, async (req, res, next) => {
  try { const actorNameSearch = decodeURIComponent(req.params.name); const actors = await Actors.find({ name: { $regex: new RegExp(actorNameSearch, "i") } }); if (!actors || actors.length === 0) return res.status(404).json({ error: `No actors found matching "${actorNameSearch}".` }); res.status(200).json(actors); } catch (err) { next(err); }
});

app.get("/actors/:actorId", requireJWTAuth, async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.actorId)) return res.status(400).json({ error: "Invalid Actor ID format." });
  try { const actor = await Actors.findById(req.params.actorId); if (!actor) return res.status(404).json({ error: "Actor not found." }); res.status(200).json(actor); } catch (err) { next(err); }
});

app.post("/actors", requireJWTAuth,
  [ check('name', 'Name is required').trim().notEmpty(), check('bio', 'Bio is required').trim().notEmpty(), check('birth', 'Birth date must be a valid date').notEmpty().isISO8601().toDate(), check('death', 'Death date must be a valid date if provided').optional({ nullable: true }).isISO8601().toDate(), check('pictureUrl', 'Picture URL must be a valid URL if provided').optional({ nullable: true, checkFalsy: true }).isURL() ],
  async (req, res, next) => {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try { const { name, bio, birth, death, pictureUrl } = req.body; const newActor = new Actors({ name, bio, birth, death: death || null, pictureUrl: pictureUrl || null }); const savedActor = await newActor.save(); res.status(201).json(savedActor); }
    catch (err) { if (err.code === 11000) return res.status(400).json({ error: `Actor name "${req.body.name}" already exists.` }); next(err); }
  });

app.put("/actors/:actorId", requireJWTAuth,
  [ check('name', 'Name must be a non-empty string').optional().trim().notEmpty(), check('bio', 'Bio must be a non-empty string').optional().trim().notEmpty(), check('birth', 'Birth date must be a valid date').optional().isISO8601().toDate(), check('death', 'Death date must be a valid date or null').optional({ nullable: true }).isISO8601().toDate(), check('pictureUrl', 'Picture URL must be a valid URL or null').optional({ nullable: true, checkFalsy: true }).isURL() ],
  async (req, res, next) => {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() }); if (!mongoose.Types.ObjectId.isValid(req.params.actorId)) return res.status(400).json({ error: "Invalid Actor ID format." });
    try { const { name, bio, birth, death, pictureUrl } = req.body; const updateData = {}; if (name !== undefined) updateData.name = name; if (bio !== undefined) updateData.bio = bio; if (birth !== undefined) updateData.birth = birth; if (death !== undefined) updateData.death = death; if (pictureUrl !== undefined) updateData.pictureUrl = pictureUrl; if (Object.keys(updateData).length === 0) return res.status(400).json({ error: "No valid fields provided for update." }); const updatedActor = await Actors.findByIdAndUpdate(req.params.actorId, { $set: updateData }, { new: true, runValidators: true }); if (!updatedActor) return res.status(404).json({ error: "Actor not found." }); res.status(200).json(updatedActor); }
    catch (err) { if (err.code === 11000 && err.keyPattern && err.keyPattern.name) return res.status(400).json({ error: `Cannot update: Actor name "${req.body.name}" is already taken.` }); next(err); }
  });

app.delete("/actors/:actorId", requireJWTAuth, async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.actorId)) return res.status(400).json({ error: "Invalid Actor ID format." });
  try { const moviesWithActor = await Movies.find({ actors: req.params.actorId }).limit(1); if (moviesWithActor.length > 0) { const actor = await Actors.findById(req.params.actorId).select('name'); return res.status(400).json({ error: `Cannot delete actor "${actor ? actor.name : 'ID: '+req.params.actorId}" as they are assigned to movie(s).` }); } const deletedActor = await Actors.findByIdAndDelete(req.params.actorId); if (!deletedActor) return res.status(404).json({ error: "Actor not found." }); res.status(200).json({ message: `Actor "${deletedActor.name}" deleted successfully.` }); } catch (err) { next(err); }
});

const isAdmin = (req, res, next) => {
  console.warn("Admin check not implemented for /admin routes"); next();
};

app.get("/admin/users", requireJWTAuth, isAdmin, async (req, res, next) => {
  try { const users = await Users.find().select('-password'); res.status(200).json(users); } catch (err) { next(err); }
});

app.get("/admin/movies", requireJWTAuth, isAdmin, async (req, res, next) => {
  try { const movies = await Movies.find().populate("genre", "name").populate("director", "name").populate("actors", "name"); res.status(200).json(movies); } catch (err) { next(err); }
});

app.get("/admin/genres", requireJWTAuth, isAdmin, async (req, res, next) => {
  try { const genres = await Genres.find(); res.status(200).json(genres); } catch (err) { next(err); }
});

app.get("/admin/directors", requireJWTAuth, isAdmin, async (req, res, next) => {
  try { const directors = await Directors.find(); res.status(200).json(directors); } catch (err) { next(err); }
});

app.get("/admin/actors", requireJWTAuth, isAdmin, async (req, res, next) => {
  try { const actors = await Actors.find(); res.status(200).json(actors.map((actor) => ({ _id: actor._id, name: actor.name, bio: actor.bio, birth: actor.birth, death: actor.death, pictureUrl: actor.pictureUrl }))); } catch (err) { next(err); }
});

app.use((err, req, res, next) => {
  console.error("--- Global Error Handler ---"); console.error("Error Name:", err.name); console.error("Error Message:", err.message); console.error("Error Stack:", err.stack); console.error("--- End Global Error Handler ---");
  let statusCode = err.status || 500; let errorMessage = err.message || "An unexpected internal server error occurred.";
  if (err.name === 'UnauthorizedError' || err.message === 'No auth token') { statusCode = 401; errorMessage = "Invalid or missing authentication token."; }
  else if (err.name === 'ValidationError') { statusCode = 400; errorMessage = `Validation Error: ${err.message}`; }
  else if (err instanceof mongoose.Error.CastError) { statusCode = 400; errorMessage = `Invalid ID format for parameter '${err.path}'. Value: '${err.value}'`; }
  else if (err.code === 11000) { statusCode = 400; const field = Object.keys(err.keyValue)[0]; errorMessage = `${field.charAt(0).toUpperCase() + field.slice(1)} '${err.keyValue[field]}' already exists.`; }
  res.status(statusCode).json({ error: errorMessage });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MovieMobs API Server is listening on Port ${PORT}`);
  console.log(`Access documentation at http://localhost:${PORT}/documentation.html`);
});