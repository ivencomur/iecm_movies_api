//IMport depedencies
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const morgan = require("morgan");
const path = require("path");

//define models
const Models = require("./models.js");
const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director;
const Actors = Models.Actor;

//config
require('dotenv').config()
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI
//setup app
const app = express();
//connect to db
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("common"));


//Requests/endpoints
app.get("/", (req, res) => {
  res.send("Welcome to my MOVIEMOBS API!");
});

app.get("/movies", async (req, res) => {
  try {
    const movies = await Movies.find();
    res.status(200).json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/movies/title/:title", async (req, res) => {
  try {
    const movie = await Movies.findOne({ title: req.params.title });
    if (!movie) {
      return res.status(404).send("Error: Movie not found.");
    }
    res.status(200).json(movie);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/movies/genre/:genreName", async (req, res) => {
  try {
    const movies = await Movies.find({ "genre.name": req.params.genreName });
    res.status(200).json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/movies/director/:directorName", async (req, res) => {
  try {
    const movies = await Movies.find({
      "director.name": req.params.directorName,
    });
    res.status(200).json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/movies/:movieId", async (req, res) => {
  try {
    const movie = await Movies.findById(req.params.movieId);
    if (!movie) {
      return res.status(404).send("Error: Movie not found.");
    }
    res.status(200).json(movie);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.post("/movies", async (req, res) => {
  try {
    const newMovie = await Movies.create(req.body);
    res.status(201).json(newMovie);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.put("/movies/:movieId", async (req, res) => {
  try {
    const updatedMovie = await Movies.findByIdAndUpdate(
      req.params.movieId,
      req.body,
      { new: true }
    );
    if (!updatedMovie) {
      return res.status(404).send("Error: Movie not found.");
    }
    res.status(200).json(updatedMovie);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.delete("/movies/:movieId", async (req, res) => {
  try {
    const deletedMovie = await Movies.findByIdAndDelete(req.params.movieId);
    if (!deletedMovie) {
      return res.status(404).send("Error: Movie not found.");
    }
    res.status(200).send("Movie deleted successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/movies/:movieId/cast", async (req, res) => {
  try {
    const movie = await Movies.findById(req.params.movieId);
    if (!movie) {
      return res.status(404).send("Error: Movie not found.");
    }
    res.status(200).json(movie.actors);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.post("/users", async (req, res) => {
  try {
    const existingUser = await Users.findOne({ username: req.body.username });
    if (existingUser) {
      return res.status(400).send("Error: Username already exists.");
    }
    const newUser = await Users.create(req.body);
    res.status(201).json(newUser);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.put("/users/:username", async (req, res) => {
  try {
    const updatedUser = await Users.findOneAndUpdate(
      { username: req.params.username },
      req.body,
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).send("Error: User not found.");
    }
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.post("/users/:username/favorites/:movieId", async (req, res) => {
  try {
    const user = await Users.findOneAndUpdate(
      { username: req.params.username },
      { $push: { favoriteMovies: req.params.movieId } },
      { new: true }
    ).populate("favoriteMovies");
    if (!user) {
      return res.status(404).send("Error: User not found.");
    }
    res.status(200).json(user.favoriteMovies);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.delete("/users/:username/favorites/:movieId", async (req, res) => {
  try {
    const user = await Users.findOneAndUpdate(
      { username: req.params.username },
      { $pull: { favoriteMovies: req.params.movieId } },
      { new: true }
    ).populate("favoriteMovies");
    if (!user) {
      return res.status(404).send("Error: User not found.");
    }
    res.status(200).json(user.favoriteMovies);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.delete("/users/:username", async (req, res) => {
  try {
    const deletedUser = await Users.findOneAndDelete({
      username: req.params.username,
    });
    if (!deletedUser) {
      return res.status(404).send("Error: User not found.");
    }
    res.status(200).send("User deleted successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/genres", async (req, res) => {
  try {
    const genres = await Genres.find();
    res.status(200).json(genres);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/genres/:name", async (req, res) => {
  try {
    const genre = await Genres.findOne({ name: req.params.name });
    if (!genre) {
      return res.status(404).send("Error: Genre not found.");
    }
    res.status(200).json(genre);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.post("/genres", async (req, res) => {
  try {
    const newGenre = await Genres.create(req.body);
    res.status(201).json(newGenre);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.put("/genres/:name", async (req, res) => {
  try {
    const updatedGenre = await Genres.findOneAndUpdate(
      { name: req.params.name },
      req.body,
      { new: true }
    );
    if (!updatedGenre) {
      return res.status(404).send("Error: Genre not found.");
    }
    res.status(200).json(updatedGenre);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.delete("/genres/:name", async (req, res) => {
  try {
    const deletedGenre = await Genres.findOneAndDelete({
      name: req.params.name,
    });
    if (!deletedGenre) {
      return res.status(404).send("Error: Genre not found.");
    }
    res.status(200).send("Genre deleted successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/directors", async (req, res) => {
  try {
    const directors = await Directors.find();
    res.status(200).json(directors);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/directors/name/:name", async (req, res) => {
  try {
    const director = await Directors.findOne({ name: req.params.name });
    if (!director) {
      return res.status(404).send("Error: Director not found.");
    }
    res.status(200).json(director);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/directors/:directorId", async (req, res) => {
  try {
    const director = await Directors.findById(req.params.directorId);
    if (!director) {
      return res.status(404).send("Error: Director not found.");
    }
    res.status(200).json(director);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.post("/directors", async (req, res) => {
  try {
    const newDirector = await Directors.create(req.body);
    res.status(201).json(newDirector);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.put("/directors/:directorId", async (req, res) => {
  try {
    const updatedDirector = await Directors.findByIdAndUpdate(
      req.params.directorId,
      req.body,
      { new: true }
    );
    if (!updatedDirector) {
      return res.status(404).send("Error: Director not found.");
    }
    res.status(200).json(updatedDirector);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.delete("/directors/:directorId", async (req, res) => {
  try {
    const deletedDirector = await Directors.findByIdAndDelete(
      req.params.directorId
    );
    if (!deletedDirector) {
      return res.status(404).send("Error: Director not found.");
    }
    res.status(200).send("Director deleted successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/actors", async (req, res) => {
  try {
    const actors = await Actors.find();
    res.status(200).json(actors);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/actors/name/:name", async (req, res) => {
  try {
    const actor = await Actors.findOne({ name: req.params.name });
    if (!actor) {
      return res.status(404).send("Error: Actor not found.");
    }
    res.status(200).json(actor);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/actors/:actorId", async (req, res) => {
  try {
    const actor = await Actors.findById(req.params.actorId);
    if (!actor) {
      return res.status(404).send("Error: Actor not found.");
    }
    res.status(200).json(actor);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.post("/actors", async (req, res) => {
  try {
    const newActor = await Actors.create(req.body);
    res.status(201).json(newActor);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.put("/actors/:actorId", async (req, res) => {
  try {
    const updatedActor = await Actors.findByIdAndUpdate(
      req.params.actorId,
      req.body,
      { new: true }
    );
    if (!updatedActor) {
      return res.status(404).send("Error: Actor not found.");
    }
    res.status(200).json(updatedActor);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.delete("/actors/:actorId", async (req, res) => {
  try {
    const deletedActor = await Actors.findByIdAndDelete(req.params.actorId);
    if (!deletedActor) {
      return res.status(404).send("Error: Actor not found.");
    }
    res.status(200).send("Actor deleted successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/admin/users", async (req, res) => {
  try {
    const users = await Users.find();
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/admin/movies", async (req, res) => {
  try {
    const movies = await Movies.find();
    res.status(200).json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/admin/genres", async (req, res) => {
  try {
    const genres = await Genres.find();
    res.status(200).json(genres);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/admin/directors", async (req, res) => {
  try {
    const directors = await Directors.find();
    res.status(200).json(directors);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/admin/actors", async (req, res) => {
  try {
    const actors = await Actors.find();
    res.status(200).json(actors);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("There is an error!");
});

app.listen(PORT, () => {
  console.log("Running on port",PORT )
})