const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    genre: { type: mongoose.Schema.Types.ObjectId, ref: 'Genre', required: true },
    director: { type: mongoose.Schema.Types.ObjectId, ref: 'Director', required: true }, 
    actors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Actor' }],
    imagePath: String,
    featured: { type: Boolean, default: false }
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

const genreSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true }
});

const directorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    bio: { type: String, required: true },
    birth: Date,
    death: Date
});

const actorSchema = new mongoose.Schema({
    name: { type: String, required: true },
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