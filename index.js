/**
 * @fileoverview MovieMobs API Server - Main application file
 * @description RESTful API for movie database with user authentication and favorites management
 * @author Ivan Cortes
 * @version 1.0.0
 */

require('dotenv').config();
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

/**
 * Connect to MongoDB database using environment variable
 * @function connectDatabase
 */
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connection successful.'))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express();

/**
 * CORS configuration - allowed origins for cross-origin requests
 * @constant {Array} allowedOrigins - List of allowed origins
 */
let allowedOrigins = ['http://localhost:8080', 'http://localhost:4200', 'https://ivencomur.github.io'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      let message = 'The CORS policy for this application does not allow access from origin ' + origin;
      return callback(new Error(message), false);
    }
    return callback(null, true);
  }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('common'));

const auth = require('./auth')(app);

/**
 * Welcome endpoint - API root
 * @name GET/
 * @function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {string} Welcome message
 */
app.get('/', (req, res) => {
  res.send('Welcome to the MovieMobs API!');
});

/**
 * Get all movies with populated genre, director, and actors information
 * @name GET/movies
 * @function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} 200 - Array of movie objects with populated data
 * @returns {Object} 401 - Unauthorized access
 * @returns {Object} 500 - Internal server error
 * @requires authentication JWT token required
 */
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const movies = await Movies.find()
      .populate('Genre', 'Name Description')
      .populate('Director', 'Name Bio Birth Death')
      .populate('Actors', 'Name Bio Birth Death');
    
    console.log('Movies fetched with populated data:', movies.length);
    res.status(200).json(movies);
  } catch (err) {
    console.error('Error fetching movies:', err);
    res.status(500).send('Error: ' + err);
  }
});

/**
 * Get single movie by title
 * @name GET/movies/:Title
 * @function
 * @param {Object} req - Express request object
 * @param {string} req.params.Title - Movie title
 * @param {Object} res - Express response object
 * @returns {Object} 200 - Movie object with populated data
 * @returns {Object} 404 - Movie not found
 * @returns {Object} 500 - Internal server error
 * @requires authentication JWT token required
 */
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const movie = await Movies.findOne({ Title: req.params.Title })
      .populate('Genre', 'Name Description')
      .populate('Director', 'Name Bio Birth Death')
      .populate('Actors', 'Name Bio Birth Death');
    
    if (!movie) {
      return res.status(404).send('Movie not found');
    }
    
    res.json(movie);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

/**
 * Get genre information by name
 * @name GET/genres/:Name
 * @function
 * @param {Object} req - Express request object
 * @param {string} req.params.Name - Genre name
 * @param {Object} res - Express response object
 * @returns {Object} 200 - Genre object
 * @returns {Object} 500 - Internal server error
 * @requires authentication JWT token required
 */
app.get('/genres/:Name', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.findOne({ 'Genre.Name': req.params.Name })
    .then((movie) => res.json(movie.Genre))
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Get director information by name
 * @name GET/directors/:Name
 * @function
 * @param {Object} req - Express request object
 * @param {string} req.params.Name - Director name
 * @param {Object} res - Express response object
 * @returns {Object} 200 - Director object
 * @returns {Object} 500 - Internal server error
 * @requires authentication JWT token required
 */
app.get('/directors/:Name', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.findOne({ 'Director.Name': req.params.Name })
    .then((movie) => res.json(movie.Director))
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Register a new user
 * @name POST/users
 * @function
 * @param {Object} req - Express request object
 * @param {Object} req.body - User registration data
 * @param {string} req.body.Username - User's username (min 5 chars, alphanumeric)
 * @param {string} req.body.Password - User's password
 * @param {string} req.body.Email - User's email address
 * @param {string} [req.body.Birthday] - User's birthday (optional)
 * @param {Object} res - Express response object
 * @returns {Object} 201 - Created user object
 * @returns {Object} 400 - User already exists
 * @returns {Object} 422 - Validation errors
 * @returns {Object} 500 - Internal server error
 */
app.post('/users', [
    check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ], async (req, res) => {
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  let hashedPassword = Users.hashPassword(req.body.Password);
  await Users.findOne({ Username: req.body.Username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + ' already exists');
      } else {
        Users.create({
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday
        })
        .then((user) => res.status(201).json(user))
        .catch((error) => {
          console.error(error);
          res.status(500).send('Error: ' + error);
        });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

/**
 * Update user information
 * @name PUT/user
 * @function
 * @param {Object} req - Express request object
 * @param {Object} req.body - Updated user data
 * @param {string} req.body.Username - User's username
 * @param {string} [req.body.Password] - User's new password (optional)
 * @param {string} [req.body.Email] - User's new email (optional)
 * @param {string} [req.body.Birthday] - User's new birthday (optional)
 * @param {Object} res - Express response object
 * @returns {Object} 200 - Updated user object
 * @returns {Object} 400 - Permission denied
 * @returns {Object} 500 - Internal server error
 * @requires authentication JWT token required
 */
app.put('/user', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if(req.user.Username !== req.body.Username){
        return res.status(400).send('Permission denied');
    }
	await Users.findOneAndUpdate({ Username: req.body.Username }, { $set:
    {
      Username: req.body.Username,
      Password: req.body.Password ? Users.hashPassword(req.body.Password) : req.user.Password,
      Email: req.body.Email,
      Birthday: req.body.Birthday
    }
  },
  { new: true })
  .then(updatedUser => res.json(updatedUser))
  .catch(err => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

/**
 * Add movie to user's favorites
 * @name POST/user/favorites/:MovieID
 * @function
 * @param {Object} req - Express request object
 * @param {string} req.params.MovieID - Movie ID to add to favorites
 * @param {Object} res - Express response object
 * @returns {Object} 200 - Updated user object with new favorite
 * @returns {Object} 500 - Internal server error
 * @requires authentication JWT token required
 */
app.post('/user/favorites/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Users.findOneAndUpdate({ Username: req.user.Username }, {
     $push: { FavoriteMovies: req.params.MovieID }
   },
   { new: true })
  .then((updatedUser) => res.json(updatedUser))
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

/**
 * Remove movie from user's favorites
 * @name DELETE/user/favorites/:MovieID
 * @function
 * @param {Object} req - Express request object
 * @param {string} req.params.MovieID - Movie ID to remove from favorites
 * @param {Object} res - Express response object
 * @returns {Object} 200 - Updated user object without the favorite
 * @returns {Object} 500 - Internal server error
 * @requires authentication JWT token required
 */
app.delete('/user/favorites/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Users.findOneAndUpdate({ Username: req.user.Username }, {
     $pull: { FavoriteMovies: req.params.MovieID }
   },
   { new: true })
  .then((updatedUser) => res.json(updatedUser))
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

/**
 * Get user profile information
 * @name GET/user
 * @function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} 200 - User object
 * @returns {Object} 500 - Internal server error
 * @requires authentication JWT token required
 */
app.get('/user', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOne({ Username: req.user.Username})
        .then((user) => res.json(user))
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/**
 * Delete user account
 * @name DELETE/user
 * @function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} 200 - Success message
 * @returns {Object} 400 - User not found
 * @returns {Object} 500 - Internal server error
 * @requires authentication JWT token required
 */
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

app.use(express.static('public'));

/**
 * Global error handler middleware
 * @function
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

/**
 * Start the server
 * @constant {number} port - Server port from environment or default 8080
 */
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});