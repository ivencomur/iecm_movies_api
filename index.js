const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 8080;


const logStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'});
const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${req.method} ${req.url}\n`;
  logStream.write(logEntry);
  next();
};


const movies = [
  {
    id: 1,
    title: "Inception",
    director: "Christopher Nolan",
    genre: "Sci-Fi",
    year: 2010
  },
  {
    id: 2,
    title: "The Godfather",
    director: "Francis Ford Coppola",
    genre: "Crime",
    year: 1972
  },
  {
    id: 3,
    title: "Pulp Fiction",
    director: "Quentin Tarantino",
    genre: "Crime",
    year: 1994
  }
];


app.use(logger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


app.get('/', (req, res) => {
  res.sendFile('index.html');
});


app.get('/documentation', (req, res) => {
  res.sendFile(path.join(__dirname, 'documentation.html'));
});


app.get('/movies', (req, res) => {
  res.json(movies);
});


app.get('/movies/:id', (req, res) => {
  const movie = movies.find(movie => movie.id === parseInt(req.params.id));
  if (movie) {
    res.json(movie);
  } else {
    res.status(404).send('Movie not found');
  }
});


app.get('/movies/genre/:genreName', (req, res) => {
  const genreMovies = movies.filter(movie => 
    movie.genre.toLowerCase() === req.params.genreName.toLowerCase()
  );
  
  if (genreMovies.length > 0) {
    res.json(genreMovies);
  } else {
    res.status(404).send('No movies found with that genre');
  }
});


app.get('/movies/director/:directorName', (req, res) => {
  const directorMovies = movies.filter(movie => 
    movie.director.toLowerCase().includes(req.params.directorName.toLowerCase())
  );
  
  if (directorMovies.length > 0) {
    res.json(directorMovies);
  } else {
    res.status(404).send('No movies found by that director');
  }
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});