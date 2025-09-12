require('dotenv').config(); // This must be the very first line
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Models = require('./models.js');
const cors = require('cors');
const { check, validationResult } = require('express-validator');
const passport = require('passport');
require('./passport.js');

const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director;
const Actors = Models.Actor;

// Connect to the database using the environment variable
mongoose.connect(process.env.CONNECTION_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
})
  .then(() => console.log('MongoDB Atlas connection successful - connected to database:', mongoose.connection.db.databaseName))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('common'));

const auth = require('./auth')(app);

// Welcome message
app.get('/', (req, res) => {
  res.send('Welcome to the MovieMobs API!');
});

// Get all movies
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const movies = await Movies.find()
      .populate('Genre', 'Name Description')
      .populate('Director', 'Name Bio Birth Death')
      .populate('Actors', 'Name Bio Birth Death PictureUrl');
    res.status(200).json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

// Get a single movie by title
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const movie = await Movies.findOne({ Title: req.params.Title })
      .populate('Genre', 'Name Description')
      .populate('Director', 'Name Bio Birth Death')
      .populate('Actors', 'Name Bio Birth Death PictureUrl');
    
    if (movie) {
      res.status(200).json(movie);
    } else {
      res.status(404).send('Movie not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

// Get genre by name
app.get('/genres/:Name', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const genre = await Genres.findOne({ Name: { $regex: new RegExp(req.params.Name, 'i') } });
    if (genre) {
      res.status(200).json(genre);
    } else {
      res.status(404).send('Genre not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

// Get director by name
app.get('/directors/:Name', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const director = await Directors.findOne({ Name: { $regex: new RegExp(req.params.Name, 'i') } });
    if (director) {
      res.status(200).json(director);
    } else {
      res.status(404).send('Director not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

// Register a new user
app.post('/users', [
  check('Username', 'Username is required').isLength({ min: 5 }),
  check('Username', 'Username contains non-alphanumeric characters - not allowed.').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()
], async (req, res) => {
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  let hashedPassword = Users.hashPassword(req.body.Password);
  try {
    const user = await Users.findOne({ Username: req.body.Username });
    if (user) {
      return res.status(400).send(req.body.Username + ' already exists');
    } else {
      const newUser = await Users.create({
        Username: req.body.Username,
        Password: hashedPassword,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      });
      res.status(201).json(newUser);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: ' + error);
  }
});

// Update user information
app.put('/user', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const updatedUser = await Users.findOneAndUpdate(
      { Username: req.user.Username }, 
      {
        $set: {
          Username: req.body.username || req.user.Username,
          Password: req.body.password ? Users.hashPassword(req.body.password) : req.user.Password,
          Email: req.body.email || req.user.Email,
          Birthday: req.body.birthday || req.user.Birthday
        }
      }, 
      { new: true }
    );
    
    const userResponse = updatedUser.toObject();
    delete userResponse.Password;
    res.json(userResponse);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

// Add a movie to a user's list of favorites
app.post('/user/favorites/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const updatedUser = await Users.findOneAndUpdate(
      { Username: req.user.Username }, 
      {
        $push: { FavoriteMovies: req.params.MovieID }
      }, 
      { new: true }
    ).populate('FavoriteMovies');
    
    const userResponse = updatedUser.toObject();
    delete userResponse.Password;
    res.json(userResponse);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

// Remove a movie from a user's list of favorites
app.delete('/user/favorites/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const updatedUser = await Users.findOneAndUpdate(
      { Username: req.user.Username }, 
      {
        $pull: { FavoriteMovies: req.params.MovieID }
      }, 
      { new: true }
    ).populate('FavoriteMovies');
    
    const userResponse = updatedUser.toObject();
    delete userResponse.Password;
    res.json(userResponse);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

// Get user profile by username
app.get('/user', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const user = await Users.findOne({ Username: req.user.Username })
      .populate('FavoriteMovies');
    
    const userResponse = user.toObject();
    delete userResponse.Password;
    res.json(userResponse);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

// Delete a user by username
app.delete('/user', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const user = await Users.findOneAndDelete({ Username: req.user.Username });
    if (!user) {
      res.status(400).send(req.user.Username + ' was not found');
    } else {
      res.status(200).send(req.user.Username + ' was deleted.');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

// Serve static documentation file
app.use(express.static('public'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Listen for requests
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('MovieMobs API Server is listening on Port ' + port);
});