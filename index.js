// Import dependencies
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const morgan = require("morgan");
const path = require("path");

// Define models
const Models = require("./models.js");
const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director;
const Actors = Models.Actor;

// Config
require("dotenv").config();
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;

// Setup app
const app = express();

// Connect to db
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB");
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("common"));

// Requests/endpoints
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Movie API!" });
});

app.get("/movies", async (req, res) => {
  try {
    const movies = await Movies.find()
      .populate("genre")
      .populate("director")
      .populate("actors");
    res.status(200).json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/movies/title/:title", async (req, res) => {
  try {
    const movie = await Movies.findOne({
      title: { $regex: new RegExp(req.params.title, "i") },
    })
      .populate("genre")
      .populate("director")
      .populate("actors");
    if (!movie) {
      return res.status(404).json({ error: "Movie not found." });
    }
    res.status(200).json(movie);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/movies/genre/:genreName", async (req, res) => {
  try {
    const movies = await Movies.find({
      "genre.name": { $regex: new RegExp(req.params.genreName, "i") },
    })
      .populate("genre")
      .populate("director")
      .populate("actors");
    res.status(200).json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/movies/director/:directorName", async (req, res) => {
  try {
    const movies = await Movies.find({
      "director.name": { $regex: new RegExp(req.params.directorName, "i") },
    })
      .populate("genre")
      .populate("director")
      .populate("actors");
    res.status(200).json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/movies/:movieId", async (req, res) => {
  try {
    const movie = await Movies.findById(req.params.movieId)
      .populate("genre")
      .populate("director")
      .populate("actors");
    if (!movie) {
      return res.status(404).json({ error: "Movie not found." });
    }
    res.status(200).json(movie);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.post("/movies", async (req, res) => {
  try {
    const { title, description, genre, director, actors, imagePath, featured } =
      req.body;

    const genreDoc = await Genres.findOne({ name: genre.name });
    if (!genreDoc) {
      return res.status(400).json({ error: "Genre not found." });
    }

    const directorDoc = await Directors.findOne({ name: director.name });
    if (!directorDoc) {
      return res.status(400).json({ error: "Director not found." });
    }

    const actorDocs = await Actors.find({ name: { $in: actors } });
    const actorIds = actorDocs.map((actor) => actor._id);

    const newMovie = new Movies({
      title,
      description,
      genre: genreDoc._id,
      director: directorDoc._id,
      actors: actorIds,
      imagePath,
      featured,
    });

    const savedMovie = await newMovie.save();
    const populatedMovie = await Movies.findById(savedMovie._id)
      .populate("genre")
      .populate("director")
      .populate("actors");
    res.status(201).json(populatedMovie);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.put("/movies/:movieId", async (req, res) => {
  try {
    const { title, description, genre, director, actors, imagePath, featured } =
      req.body;
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (genre && genre.name) {
      const genreDoc = await Genres.findOne({ name: genre.name });
      if (!genreDoc) return res.status(400).json({ error: "Genre not found." });
      updateData.genre = genreDoc._id;
    }
    if (director && director.name) {
      const directorDoc = await Directors.findOne({ name: director.name });
      if (!directorDoc)
        return res.status(400).json({ error: "Director not found." });
      updateData.director = directorDoc._id;
    }
    if (actors && Array.isArray(actors)) {
      const actorDocs = await Actors.find({ name: { $in: actors } });
      updateData.actors = actorDocs.map((actor) => actor._id);
    }
    if (imagePath) updateData.imagePath = imagePath;
    if (featured !== undefined) updateData.featured = featured;

    const updatedMovie = await Movies.findByIdAndUpdate(
      req.params.movieId,
      updateData,
      { new: true }
    )
      .populate("genre")
      .populate("director")
      .populate("actors");

    if (!updatedMovie) {
      return res.status(404).json({ error: "Movie not found." });
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
      return res.status(404).json({ error: "Movie not found." });
    }
    res.status(200).send("Movie deleted successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/movies/:movieId/actors", async (req, res) => {
  try {
    const movie = await Movies.findById(req.params.movieId).populate("actors");
    if (!movie) {
      return res.status(404).json({ error: "Movie not found." });
    }
    res
      .status(200)
      .json(
        movie.actors.map((actor) => ({ _id: actor._id, name: actor.name }))
      );
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.post("/users", async (req, res) => {
  try {
    const { username, password, email, birthday } = req.body;
    const existingUser = await Users.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists." });
    }
    const existingEmail = await Users.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already exists." });
    }
    const newUser = new Users({ username, password, email, birthday });
    const savedUser = await newUser.save();
    res
      .status(201)
      .json({
        _id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        birthday: savedUser.birthday,
        favoriteMovies: savedUser.favoriteMovies,
      });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.put("/users/:username", async (req, res) => {
  try {
    const { password, email, birthday } = req.body;
    const updatedUser = await Users.findOneAndUpdate(
      { username: req.params.username },
      { password, email, birthday },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }
    res
      .status(200)
      .json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        birthday: updatedUser.birthday,
        favoriteMovies: updatedUser.favoriteMovies,
      });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.post("/users/:username/favorites/:movieId", async (req, res) => {
  try {
    const user = await Users.findOneAndUpdate(
      { username: req.params.username },
      { $addToSet: { favoriteMovies: req.params.movieId } },
      { new: true }
    ).populate("favoriteMovies");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res
      .status(200)
      .json(
        user.favoriteMovies.map((movie) => ({
          _id: movie._id,
          title: movie.title,
        }))
      );
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
      return res.status(404).json({ error: "User not found." });
    }
    res
      .status(200)
      .json(
        user.favoriteMovies.map((movie) => ({
          _id: movie._id,
          title: movie.title,
        }))
      );
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
      return res.status(404).json({ error: "User not found." });
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
    const genre = await Genres.findOne({
      name: { $regex: new RegExp(req.params.name, "i") },
    });
    if (!genre) {
      return res.status(404).json({ error: "Genre not found." });
    }
    res.status(200).json(genre);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.post("/genres", async (req, res) => {
  try {
    const { name, description } = req.body;
    const existingGenre = await Genres.findOne({ name });
    if (existingGenre) {
      return res.status(400).json({ error: "Genre name already exists." });
    }
    const newGenre = new Genres({ name, description });
    const savedGenre = await newGenre.save();
    res.status(201).json(savedGenre);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.put("/genres/:name", async (req, res) => {
  try {
    const { description } = req.body;
    const updatedGenre = await Genres.findOneAndUpdate(
      { name: req.params.name },
      { description },
      { new: true }
    );
    if (!updatedGenre) {
      return res.status(404).json({ error: "Genre not found." });
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
      return res.status(404).json({ error: "Genre not found." });
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
    const director = await Directors.findOne({
      name: { $regex: new RegExp(req.params.name, "i") },
    });
    if (!director) {
      return res.status(404).json({ error: "Director not found." });
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
      return res.status(404).json({ error: "Director not found." });
    }
    res.status(200).json(director);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.post("/directors", async (req, res) => {
  try {
    const { name, bio, birth, death } = req.body;
    const existingDirector = await Directors.findOne({ name });
    if (existingDirector) {
      return res.status(400).json({ error: "Director name already exists." });
    }
    const newDirector = new Directors({ name, bio, birth, death });
    const savedDirector = await newDirector.save();
    res.status(201).json(savedDirector);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.put("/directors/:directorId", async (req, res) => {
  try {
    const { name, bio, birth, death } = req.body;
    const updatedDirector = await Directors.findByIdAndUpdate(
      req.params.directorId,
      { name, bio, birth, death },
      { new: true }
    );
    if (!updatedDirector) {
      return res.status(404).json({ error: "Director not found." });
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
      return res.status(404).json({ error: "Director not found." });
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
    const actor = await Actors.findOne({
      name: { $regex: new RegExp(req.params.name, "i") },
    });
    if (!actor) {
      return res.status(404).json({ error: "Actor not found." });
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
      return res.status(404).json({ error: "Actor not found." });
    }
    res.status(200).json(actor);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.post("/actors", async (req, res) => {
  try {
    const { name, bio, birth, death, pictureUrl } = req.body;
    const existingActor = await Actors.findOne({ name });
    if (existingActor) {
      return res.status(400).json({ error: "Actor name already exists." });
    }
    const newActor = new Actors({ name, bio, birth, death, pictureUrl });
    const savedActor = await newActor.save();
    res.status(201).json(savedActor);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.put("/actors/:actorId", async (req, res) => {
  try {
    const { name, bio, birth, death, pictureUrl } = req.body;
    const updatedActor = await Actors.findByIdAndUpdate(
      req.params.actorId,
      { name, bio, birth, death, pictureUrl },
      { new: true }
    );
    if (!updatedActor) {
      return res.status(404).json({ error: "Actor not found." });
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
      return res.status(404).json({ error: "Actor not found." });
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
    res
      .status(200)
      .json(
        users.map((user) => ({
          _id: user._id,
          username: user.username,
          email: user.email,
          birthday: user.birthday,
        }))
      );
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
});

app.get("/admin/movies", async (req, res) => {
  try {
    const movies = await Movies.find().populate("genre").populate("director");
    res.status(200).json(
      movies.map((movie) => ({
        _id: movie._id,
        title: movie.title,
        description: movie.description,
        genre: movie.genre ? { name: movie.genre.name } : null,
        director: movie.director ? { name: movie.director.name } : null,
        imagePath: movie.imagePath,
        featured: movie.featured,
      }))
    );
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
  console.log("Running on port", PORT);
});
