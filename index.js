require('dotenv').config(); // Loads environment variables from .env file

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

mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Successfully connected to MongoDB.');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('common'));

const auth = require('./auth.js')(app);

// GET: Welcome message
app.get('/', (req, res) => {
  res.send('Welcome to the MovieMobs API!');
});

// GET: Returns a list of ALL movies
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.find()
    .then((movies) => {
      res.status(200).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// GET: Returns data about a single movie by title
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.findOne({ Title: req.params.Title })
    .then((movie) => {
      if (movie) {
        res.status(200).json(movie);
      } else {
        res.status(404).send('Movie not found');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// GET: Returns data about a genre by name
app.get('/genres/:Name', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Models.Genre.findOne({ Name: req.params.Name })
        .then((genre) => {
            if (genre) {
                res.status(200).json(genre);
            } else {
                res.status(404).send('Genre not found');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// GET: Returns data about a director by name
app.get('/directors/:Name', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Models.Director.findOne({ Name: req.params.Name })
        .then((director) => {
            if (director) {
                res.status(200).json(director);
            } else {
                res.status(404).send('Director not found');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// POST: Allows a new user to register
app.post('/users', [
    check('Username', 'Username is required (min 5 characters)').isLength({min: 5}),
    check('Username', 'Username contains non-alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required.').not().isEmpty(),
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
                .then((user) => { res.status(201).json(user) })
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

// GET: Returns a user's profile
app.get('/user', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findById(req.user._id)
    .populate('FavoriteMovies')
    .then((user) => {
        res.status(200).json(user);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// PUT: Updates a user's info
app.put('/user', passport.authenticate('jwt', { session: false }), [
    check('Username', 'Username is required (min 5 characters)').optional().isLength({min: 5}),
    check('Username', 'Username contains non-alphanumeric characters - not allowed.').optional().isAlphanumeric(),
    check('Password', 'Password is required.').optional().not().isEmpty(),
    check('Email', 'Email does not appear to be valid').optional().isEmail()
], async (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    let updatedUser = {};
    if(req.body.Username) updatedUser.Username = req.body.Username;
    if(req.body.Password) updatedUser.Password = Users.hashPassword(req.body.Password);
    if(req.body.Email) updatedUser.Email = req.body.Email;
    if(req.body.Birthday) updatedUser.Birthday = req.body.Birthday;

    await Users.findByIdAndUpdate(req.user._id, { $set: updatedUser }, { new: true })
        .then((user) => {
            res.status(200).json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// POST: Adds a movie to a user's list of favorites
app.post('/user/favorites/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findByIdAndUpdate(req.user._id, {
        $addToSet: { FavoriteMovies: req.params.MovieID }
    }, { new: true })
    .populate('FavoriteMovies')
    .then((user) => {
        res.status(200).json(user);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// DELETE: Removes a movie from a user's list of favorites
app.delete('/user/favorites/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findByIdAndUpdate(req.user._id, {
        $pull: { FavoriteMovies: req.params.MovieID }
    }, { new: true })
    .populate('FavoriteMovies')
    .then((user) => {
        res.status(200).json(user);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// DELETE: Allows a user to deregister
app.delete('/user', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findByIdAndDelete(req.user._id)
        .then((user) => {
            if (!user) {
                res.status(400).send(req.user.Username + ' was not found');
            } else {
                res.status(200).send(req.user.Username + ' was deleted.');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

app.use(express.static('public'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('MovieMobs API Server is listening on Port ' + port);
});

