require('dotenv').config();
const mongoose = require('mongoose');
const Models = require('./models.js');

async function checkMovies() {
  try {
    await mongoose.connect(process.env.CONNECTION_URI);
    const count = await Models.Movie.countDocuments();
    console.log(`Total movies in database: ${count}`);
    
    if (count > 0) {
      const movies = await Models.Movie.find().limit(3);
      console.log('Sample movies:');
      movies.forEach(movie => console.log(`- ${movie.Title || movie.title}`));
    } else {
      console.log('No movies found - database needs to be seeded');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}
checkMovies();
