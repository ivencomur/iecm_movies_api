// models.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Keep bcrypt here if you add methods like validatePassword

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  genre: { type: mongoose.Schema.Types.ObjectId, ref: 'Genre', required: true },
  director: { type: mongoose.Schema.Types.ObjectId, ref: 'Director', required: true },
  actors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Actor' }],
  imagePath: String,
  featured: { type: Boolean, default: false },
  releaseYear: { type: Number, min: 1888, max: new Date().getFullYear() + 5 }, // Optional: added some example fields
  rating: { type: Number, min: 0, max: 10 } // Optional: added some example fields
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Password hash stored here
  email: { type: String, required: true, unique: true },
  birthday: Date,
  favoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
  firstname: String,
  lastname: String
  // Consider adding 'role' if you need admin functionality later
  // role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

// Static method to hash password before saving (alternative to hashing in route)
userSchema.statics.hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

// Instance method to validate password (used by passport.js)
userSchema.methods.validatePassword = function(password) {
  // 'this' refers to the specific user document
  return bcrypt.compareSync(password, this.password);
};


const genreSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true }
});

const directorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Added unique constraint
  bio: { type: String, required: true },
  birth: Date,
  death: Date // Nullable if alive
});

const actorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Added unique constraint
  bio: { type: String, required: true },
  birth: Date,
  death: Date, // Nullable if alive
  pictureUrl: String // Optional URL
});

const Movie = mongoose.model('Movie', movieSchema);
const User = mongoose.model('User', userSchema);
const Genre = mongoose.model('Genre', genreSchema);
const Director = mongoose.model('Director', directorSchema);
const Actor = mongoose.model('Actor', actorSchema);

module.exports = { Movie, User, Genre, Director, Actor };