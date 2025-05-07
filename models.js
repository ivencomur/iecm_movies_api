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
    releaseYear: Number,
    rating: Number
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


userSchema.methods.validatePassword = function(password) {
   
   if (!bcrypt) {
      console.error("bcrypt module not loaded. Cannot validate password.");
      
      return false;
   }
   try {
      
      return bcrypt.compareSync(password, this.password);
   } catch (error) {
      console.error("Error comparing password:", error);
      return false; 
   }
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