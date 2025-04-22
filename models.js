const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  genre: { type: mongoose.Schema.Types.ObjectId, ref: 'Genre', required: true },
  director: { type: mongoose.Schema.Types.ObjectId, ref: 'Director', required: true },
  actors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Actor' }],
  imagePath: String,
  featured: { type: Boolean, default: false },
  releaseYear: { type: Number, min: 1888, max: new Date().getFullYear() + 5 },
  rating: { type: Number, min: 0, max: 10 }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  birthday: Date,
  favoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
  firstname: String,
  lastname: String
});

userSchema.statics.hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

userSchema.methods.validatePassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

const genreSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true }
});

const directorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  bio: { type: String, required: true },
  birth: Date,
  death: Date
});

const actorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  bio: { type: String, required: true },
  birth: Date,
  death: Date,
  pictureUrl: String
});

const Movie = mongoose.model('Movie', movieSchema);
const User = mongoose.model('User', userSchema);
const Genre = mongoose.model('Genre', genreSchema);
const Director = mongoose.model('Director', directorSchema);
const Actor = mongoose.model('Actor', actorSchema);

module.exports = { Movie, User, Genre, Director, Actor };