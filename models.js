/**

 * @fileoverview Database models for MovieMobs API

 * @description Mongoose schemas and models for Movie, User, Genre, Director, and Actor collections

 * @requires mongoose

 * @requires bcrypt

 */

const mongoose = require("mongoose");

const bcrypt = require("bcrypt");

/**

 * Movie schema definition

 * @typedef {Object} MovieSchema

 * @property {string} Title - Movie title (required, unique)

 * @property {string} Description - Movie description (required)

 * @property {Object} Genre - Embedded Genre document (Corrected from ObjectId)

 * @property {Object} Director - Embedded Director document (Corrected from ObjectId)

 * @property {string[]} Actors - Array of Actor names (Corrected from ObjectId)

 * @property {string} ImagePath - URL path to movie poster image

 * @property {boolean} Featured - Whether movie is featured (default: false)

 * @property {number} ReleaseYear - Year movie was released

 * @property {number} Rating - Movie rating score

 */

const movieSchema = new mongoose.Schema({
  Title: String,
  Description: String,
  Genre:    { type: mongoose.Schema.Types.ObjectId, ref: 'Genre' },
  Director: { type: mongoose.Schema.Types.ObjectId, ref: 'Director' },
  Actors:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Actor' }],
  ImagePath: String,
  Featured: Boolean,
  ReleaseYear: Number,
  Rating: Number
});

/**

 * User schema definition

 * @typedef {Object} UserSchema

 * @property {string} Username - User's username (required, unique)

 * @property {string} Password - Hashed password (required)

 * @property {string} Email - User's email (required, unique)

 * @property {Date} Birthday - User's birth date

 * @property {ObjectId[]} FavoriteMovies - Array of favorite movie references

 * @property {string} FirstName - User's first name

 * @property {string} LastName - User's last name

 */

const userSchema = new mongoose.Schema({
  Username: { type: String, required: true, unique: true },

  Password: { type: String, required: true },

  Email: { type: String, required: true, unique: true },

  Birthday: Date,

  FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],

  FirstName: String,

  LastName: String,
});

/**

 * Hash password using bcrypt

 * @function hashPassword

 * @static

 * @memberof User

 * @param {string} password - Plain text password to hash

 * @returns {string} Hashed password using bcrypt with salt rounds of 10

 * @throws {Error} If bcrypt is not available or hashing fails

 * @description Creates a secure hash of the provided password using bcrypt

 */

userSchema.statics.hashPassword = (password) => {
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

/**

 * Validate password against stored hash

 * @function validatePassword

 * @memberof User

 * @instance

 * @param {string} password - Plain text password to validate

 * @returns {boolean} True if password matches stored hash, false otherwise

 * @description Compares plain text password with stored bcrypt hash

 */

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

/**

 * Genre schema definition

 * @typedef {Object} GenreSchema

 * @property {string} Name - Genre name (required, unique)

 * @property {string} Description - Genre description (required)

 */

const genreSchema = new mongoose.Schema({
  Name: { type: String, required: true, unique: true },

  Description: { type: String, required: true },
});

/**

 * Director schema definition

 * @typedef {Object} DirectorSchema

 * @property {string} Name - Director's full name (required, unique)

 * @property {string} Bio - Director's biography (required)

 * @property {Date} Birth - Director's birth date

 * @property {Date} Death - Director's death date (if applicable)

 */

const directorSchema = new mongoose.Schema({
  Name: { type: String, required: true, unique: true },

  Bio: { type: String, required: true },

  Birth: Date,

  Death: Date,
});

/**

 * Actor schema definition

 * @typedef {Object} ActorSchema

 * @property {string} Name - Actor's full name (required, unique)

 * @property {string} Bio - Actor's biography (required)

 * @property {Date} Birth - Actor's birth date

 * @property {Date} Death - Actor's death date (if applicable)

 * @property {string} PictureUrl - URL to actor's profile picture

 */

const actorSchema = new mongoose.Schema({
  Name: { type: String, required: true, unique: true },

  Bio: { type: String, required: true },

  Birth: Date,

  Death: Date,

  PictureUrl: String,
});

/**

 * Movie model

 * @type {mongoose.Model}

 * @description Mongoose model for movie documents

 */

const Movie = mongoose.model("Movie", movieSchema);

/**

 * User model

 * @type {mongoose.Model}

 * @description Mongoose model for user documents with password hashing methods

 */

const User = mongoose.model("User", userSchema);

/**

 * Genre model

 * @type {mongoose.Model}

 * @description Mongoose model for genre documents

 */

const Genre = mongoose.model("Genre", genreSchema);

/**

 * Director model

 * @type {mongoose.Model}

 * @description Mongoose model for director documents

 */

const Director = mongoose.model("Director", directorSchema);

/**

 * Actor model

 * @type {mongoose.Model}

 * @description Mongoose model for actor documents

 */

const Actor = mongoose.model("Actor", actorSchema);

module.exports = { Movie, User, Genre, Director, Actor };
