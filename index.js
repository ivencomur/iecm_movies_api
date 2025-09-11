/**
 * Main server file for the myFlix API.
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

mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connection successful.'))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express();

// --- START OF SIMPLIFIED CORS FIX ---
// This allows all origins.
app.use(cors());
// --- END OF SIMPLIFIED CORS FIX ---

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('common'));

const auth = require('./auth')(app);

// Welcome message
app.get('/', (req, res) => {
  res.send('Welcome to the MovieMobs API!');
});

// All other endpoints remain the same...
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

app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.findOne({ Title: req.params.Title })
    .then((movie) => {
      res.json(movie);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.get('/genres/:Name', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.findOne({ 'Genre.Name': req.params.Name })
    .then((movie) => {
      res.json(movie.Genre);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.get('/directors/:Name', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.findOne({ 'Director.Name': req.params.Name })
    .then((movie) => {
      res.json(movie.Director);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

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
        .then((user) =>{res.status(201).json(user) })
        .catch((error) => {
          console.error(error);
          res.status(500).send('Error: ' + error);
        })
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

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
  .then(updatedUser => {
    res.json(updatedUser);
  })
  .catch(err => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});


app.post('/user/favorites/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Users.findOneAndUpdate({ Username: req.user.Username }, {
     $push: { FavoriteMovies: req.params.MovieID }
   },
   { new: true })
  .then((updatedUser) => {
    res.json(updatedUser);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

app.delete('/user/favorites/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Users.findOneAndUpdate({ Username: req.user.Username }, {
     $pull: { FavoriteMovies: req.params.MovieID }
   },
   { new: true })
  .then((updatedUser) => {
    res.json(updatedUser);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

app.get('/user', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOne({ Username: req.user.Username})
        .then((user) => {
            res.json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

app.delete('/user', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Users.findOneAndDelete({ Username: req.user.Username })
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
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});