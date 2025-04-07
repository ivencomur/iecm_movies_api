const mongoose = require('mongoose');


const actorSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  Bio: String,
  Birth: Date,
  Death: Date
});

const movieSchema = new mongoose.Schema({
  Title: { type: String, required: true },
  Description: { type: String, required: true },
  
  Genre: {
    Name: String,
    Description: String
  },
 
  Director: {
    Name: String,
    Bio: String,
    Birth: Date,
    Death: Date
  },
  
  StarringActor: { type: mongoose.Schema.Types.ObjectId, ref: 'Actor' },
  
  Actors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Actor' }],
  ImagePath: String,
  Featured: Boolean
});

const userSchema = new mongoose.Schema({
  Username: { type: String, required: true },
  Password: { type: String, required: true },
  Email: { type: String, required: true },
  Birthday: Date,
  FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }]
});

const genreSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  Description: { type: String, required: true }
});

const directorSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  Bio: String,
  Birth: Date,
  Death: Date
});

const Movie = mongoose.model('Movie', movieSchema);
const User = mongoose.model('User', userSchema);
const Genre = mongoose.model('Genre', genreSchema);
const Director = mongoose.model('Director', directorSchema);
const Actor = mongoose.model('Actor', actorSchema);

module.exports = { Movie, User, Genre, Director, Actor };