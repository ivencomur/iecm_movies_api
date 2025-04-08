const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    genre: {
        name: String,
        description: String
    },
    director: {
        name: String,
        bio: String,
        birth: Date,
        death: Date
    },
    actors: [String],
    imagePath: String,
    featured: Boolean
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    birthday: Date,
    favoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }] // References Movie IDs
});

const genreSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true }
});

const directorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    bio: String,
    birth: Date,
    death: Date
});

const Movie = mongoose.model('Movie', movieSchema);
const User = mongoose.model('User', userSchema);
const Genre = mongoose.model('Genre', genreSchema);
const Director = mongoose.model('Director', directorSchema);

module.exports = { Movie, User, Genre, Director };