require('dotenv').config(); // This line reads your .env file

// --- DEBUGGING LINE ---
console.log('CONNECTION_URI loaded:', process.env.CONNECTION_URI);
// --- END DEBUGGING LINE ---

const express = require('express');
const bodyParser = require('body-parser');
const morgan = 'morgan';
const mongoose = require('mongoose');
const Models = require('./models.js');
const { check, validationResult } = require('express-validator');
const cors = require('cors');


// ** Check if environment variables are loaded **
if (!process.env.CONNECTION_URI || !process.env.JWT_SECRET) {
  console.error('Error: Environment variables not loaded. Please check your .env file.');
  process.exit(1);
}


// Initialize Express app
const app = express();

// --- Models ---
const Movies = Models.Movie;
const Users = Models.User;

// --- Middleware ---
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// -- CORS Configuration --
let allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:1234',
  'http://localhost:5173',
  'https://themoviemobs.netlify.app',
  'https://themoviemobs.netlify.app/login'  
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      let message = `The CORS policy for this application does not allow access from origin ${origin}`;
      console.error(message);
      callback(new Error(message), false);
    }
  }
}));


// --- Authentication & Passport ---
let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');


// --- Database Connection ---
mongoose.connect(process.env.CONNECTION_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch(err => console.error('MongoDB connection error:', err));


// --- Static Files ---
app.use(express.static('public'));


// --- API Endpoints ---

// Welcome message
app.get('/', (req, res) => {
  res.send('Welcome to the MovieMobs API!');
});

// GET all movies
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const movies = await Movies.find();
    res.status(200).json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

// GET a single movie by title
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const movie = await Movies.findOne({ Title: req.params.Title });
    if (movie) {
      res.status(200).json(movie);
    } else {
      res.status(404).send('Movie not found');
    }
  } catch (err)
 {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

// GET genre info by name
app.get('/movies/genres/:Name', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const movie = await Movies.findOne({ 'Genre.Name': req.params.Name });
    if (movie) {
      res.status(200).json(movie.Genre);
    } else {
      res.status(404).send('Genre not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

// GET director info by name
app.get('/movies/directors/:Name', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const movie = await Movies.findOne({ 'Director.Name': req.params.Name });
    if (movie) {
      res.status(200).json(movie.Director);
    } else {
      res.status(404).send('Director not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

// POST (register) a new user
app.post('/users', [
    check('Username', 'Username is required (min 5 characters)').isLength({min: 5}),
    check('Username', 'Username contains non-alphanumeric characters.').isAlphanumeric(),
    check('Password', 'Password is required.').not().isEmpty(),
    check('Email', 'A valid email is required.').isEmail()
  ], async (req, res) => {
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  let hashedPassword = Users.hashPassword(req.body.Password);
  try {
    const user = await Users.findOne({ Username: req.body.Username });
    if (user) {
      return res.status(400).send(req.body.Username + ' already exists.');
    } else {
      const newUser = await Users.create({
        Username: req.body.Username,
        Password: hashedPassword,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      });
      res.status(201).json(newUser);
    }
  } catch(error) {
    console.error(error);
    res.status(500).send('Error: ' + error);
  }
});

// GET a user by username
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const user = await Users.findOne({ Username: req.params.Username });
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

// PUT (update) a user's info
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), [
    check('Username', 'Username is required (min 5 characters)').optional().isLength({min: 5}),
    check('Username', 'Username contains non-alphanumeric characters.').optional().isAlphanumeric(),
    check('Password', 'Password is required.').optional().not().isEmpty(),
    check('Email', 'A valid email is required.').optional().isEmail()
  ], async (req, res) => {

  if(req.user.Username !== req.params.Username){
      return res.status(403).send('Permission denied: You can only update your own profile.');
  }

  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  let updateData = {};
  if (req.body.Username) updateData.Username = req.body.Username;
  if (req.body.Password) updateData.Password = Users.hashPassword(req.body.Password);
  if (req.body.Email) updateData.Email = req.body.Email;
  if (req.body.Birthday) updateData.Birthday = req.body.Birthday;

  try {
    const updatedUser = await Users.findOneAndUpdate({ Username: req.params.Username }, { $set: updateData }, { new: true });
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

// POST a movie to a user's list of favorites
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
  if(req.user.Username !== req.params.Username){
      return res.status(403).send('Permission denied: You can only modify your own favorites list.');
  }
  try {
    const updatedUser = await Users.findOneAndUpdate(
      { Username: req.params.Username },
      { $addToSet: { FavoriteMovies: req.params.MovieID } },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

// DELETE a movie from a user's list of favorites
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if(req.user.Username !== req.params.Username){
        return res.status(403).send('Permission denied: You can only modify your own favorites list.');
    }
    try {
        const updatedUser = await Users.findOneAndUpdate(
            { Username: req.params.Username },
            { $pull: { FavoriteMovies: req.params.MovieID } },
            { new: true }
        );
        res.status(200).json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

// DELETE a user by username
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  if(req.user.Username !== req.params.Username){
      return res.status(403).send('Permission denied: You can only delete your own account.');
  }
  try {
    const user = await Users.findOneAndRemove({ Username: req.params.Username });
    if (user) {
      res.status(200).send(req.params.Username + ' was successfully deleted.');
    } else {
      res.status(404).send(req.params.Username + ' was not found.');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});


// --- Error Handling ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// --- Server Listening ---
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
 console.log('Server is running on port ' + port);
});