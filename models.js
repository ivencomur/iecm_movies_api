const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const genreSchema = new mongoose.Schema({
  Name: { type: String, required: true, unique: true },
  Description: { type: String, required: true },
});

const directorSchema = new mongoose.Schema({
  Name: { type: String, required: true, unique: true },
  Bio: { type: String, required: true },
  Birth: Date,
  Death: Date,
});

const actorSchema = new mongoose.Schema({
  Name: { type: String, required: true, unique: true },
  Bio: { type: String, required: true },
  Birth: Date,
  Death: Date,
  PictureUrl: String,
});

const movieSchema = new mongoose.Schema({
  Title: { type: String, required: true, unique: true },
  Description: { type: String, required: true },
  Genre: { type: mongoose.Schema.Types.ObjectId, ref: "Genre", required: true },
  Director: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Director",
    required: true,
  },
  Actors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Actor" }],
  ImagePath: String,
  Featured: { type: Boolean, default: false },
  ReleaseYear: Number,
  Rating: Number,
});

const userSchema = new mongoose.Schema({
  Username: { type: String, required: true, unique: true, trim: true },
  Password: { type: String, required: true },
  Email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  Birthday: Date,
  FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
  Firstname: { type: String, trim: true },
  Lastname: { type: String, trim: true },
});

userSchema.statics.hashPassword = function (password) {
  if (!bcrypt) {
    console.error("bcrypt module not loaded. Cannot hash password.");
    throw new Error("Password hashing dependency not available.");
  }
  try {
    return bcrypt.hashSync(password, 10);
  } catch (error) {
    console.error("Error hashing password:", error);
    throw error;
  }
};

userSchema.methods.validatePassword = function (password) {
  if (!bcrypt) {
    console.error("bcrypt module not loaded. Cannot validate password.");
    return false;
  }
  try {
    return bcrypt.compareSync(password, this.Password);
  } catch (error) {
    console.error("Error comparing password:", error);
    return false;
  }
};

const Movie = mongoose.model("Movie", movieSchema);
const User = mongoose.model("User", userSchema);
const Genre = mongoose.model("Genre", genreSchema);
const Director = mongoose.model("Director", directorSchema);
const Actor = mongoose.model("Actor", actorSchema);

module.exports = { Movie, User, Genre, Director, Actor };
