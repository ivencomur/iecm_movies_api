const express = require("express");
const morgan = require("morgan");
const path = require("path");
const { Client } = require("pg");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT || 8080;

app.use(morgan("common"));

const dbConfig = {
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "your_password",
  database: "iecm_movies_api_DB",
};

const connectDB = async () => {
  const client = new Client(dbConfig);
  await client.connect();
  return client;
};

const disconnectDB = async (client) => {
  await client.end();
};

const mapMovieResult = (row, directors, genres, actors) => {
  return {
    movieId: row.movieid,
    title: row.title,
    description: row.description,
    director: directors.find((d) => d.directorid === row.directorid) || null,
    genre: genres.find((g) => g.genreid === row.genreid) || null,
    imageURL: row.imageurl,
    featured: row.featured,
    releaseYear: row.releaseyear,
    rating: row.rating,
    actors: actors.filter((actor) => actor.movieIds.includes(row.movieid)),
  };
};

const getActorsWithMovieIds = async (client) => {
  const actorsResult = await client.query(`SELECT * FROM actors;`);
  const movieCastResult = await client.query(`SELECT * FROM moviecast;`);

  const actors = actorsResult.rows.map((actor) => ({
    ...actor,
    movieIds: movieCastResult.rows
      .filter((mc) => mc.actorid === actor.actorid)
      .map((mc) => mc.movieid),
  }));
  return actors;
};

app.get("/movies/title/:title", async (req, res) => {
  try {
    const client = await connectDB();
    const { title } = req.params;

    const movieResult = await client.query(
      `SELECT * FROM movies WHERE title = $1`,
      [title]
    );
    const directorsResult = await client.query(`SELECT * FROM directors;`);
    const genresResult = await client.query(`SELECT * FROM genres;`);
    const actors = await getActorsWithMovieIds(client);

    if (movieResult.rows.length > 0) {
      const movie = mapMovieResult(
        movieResult.rows[0],
        directorsResult.rows,
        genresResult.rows,
        actors
      );
      res.status(200).json(movie);
    } else {
      res.status(404).send("Movie not found.");
    }
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.get("/movies/genre/:genreName", async (req, res) => {
  try {
    const client = await connectDB();
    const { genreName } = req.params;

    const genreResult = await client.query(
      `SELECT genreid FROM genres WHERE name = $1`,
      [genreName]
    );
    if (genreResult.rows.length === 0) {
      await disconnectDB(client);
      return res.status(404).send("Genre not found");
    }
    const genreId = genreResult.rows[0].genreid;
    const moviesResult = await client.query(
      `SELECT * FROM movies WHERE genreid = $1`,
      [genreId]
    );
    const directorsResult = await client.query(`SELECT * FROM directors;`);
    const genresResult = await client.query(`SELECT * FROM genres;`);
    const actors = await getActorsWithMovieIds(client);

    const movies = moviesResult.rows.map((movie) =>
      mapMovieResult(movie, directorsResult.rows, genresResult.rows, actors)
    );
    res.status(200).json(movies);
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.get("/movies/director/:directorName", async (req, res) => {
  try {
    const client = await connectDB();
    const { directorName } = req.params;

    const directorResult = await client.query(
      `SELECT directorid FROM directors WHERE name = $1`,
      [directorName]
    );
    if (directorResult.rows.length === 0) {
      await disconnectDB(client);
      return res.status(404).send("Director not found");
    }
    const directorId = directorResult.rows[0].directorid;

    const moviesResult = await client.query(
      `SELECT * FROM movies WHERE directorid = $1`,
      [directorId]
    );
    const directorsResult = await client.query(`SELECT * FROM directors;`);
    const genresResult = await client.query(`SELECT * FROM genres;`);
    const actors = await getActorsWithMovieIds(client);

    const movies = moviesResult.rows.map((movie) =>
      mapMovieResult(movie, directorsResult.rows, genresResult.rows, actors)
    );
    res.status(200).json(movies);
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.get("/movies/:movieId", async (req, res) => {
  try {
    const client = await connectDB();
    const { movieId } = req.params;
    const movieResult = await client.query(
      `SELECT * FROM movies WHERE movieid = $1`,
      [movieId]
    );
    const directorsResult = await client.query(`SELECT * FROM directors;`);
    const genresResult = await client.query(`SELECT * FROM genres;`);
    const actors = await getActorsWithMovieIds(client);

    if (movieResult.rows.length > 0) {
      const movie = mapMovieResult(
        movieResult.rows[0],
        directorsResult.rows,
        genresResult.rows,
        actors
      );
      res.status(200).json(movie);
    } else {
      res.status(404).send("Movie not found.");
    }
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.post("/movies", async (req, res) => {
  try {
    const client = await connectDB();
    const {
      title,
      description,
      directorid,
      genreid,
      imageurl,
      featured,
      releaseyear,
      rating,
    } = req.body;
    const result = await client.query(
      `INSERT INTO movies (title, description, directorid, genreid, imageurl, featured, releaseyear, rating) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        title,
        description,
        directorid,
        genreid,
        imageurl,
        featured,
        releaseyear,
        rating,
      ]
    );
    res.status(201).json(result.rows[0]);
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.put("/movies/:movieId", async (req, res) => {
  try {
    const client = await connectDB();
    const { movieId } = req.params;
    const {
      title,
      description,
      directorid,
      genreid,
      imageurl,
      featured,
      releaseyear,
      rating,
    } = req.body;

    const result = await client.query(
      `UPDATE movies SET title = $2, description = $3, directorid = $4, genreid = $5, imageurl = $6, featured = $7, releaseyear = $8, rating = $9 WHERE movieid = $1 RETURNING *`,
      [
        movieId,
        title,
        description,
        directorid,
        genreid,
        imageurl,
        featured,
        releaseyear,
        rating,
      ]
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send("Movie not found.");
    }
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.delete("/movies/:movieId", async (req, res) => {
  try {
    const client = await connectDB();
    const { movieId } = req.params;
    const result = await client.query(
      `DELETE FROM movies WHERE movieid = $1 RETURNING *`,
      [movieId]
    );
    if (result.rows.length > 0) {
      res.status(200).send("Movie deleted successfully.");
    } else {
      res.status(404).send("Movie not found.");
    }
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.get("/movies/:movieId/cast", async (req, res) => {
  try {
    const client = await connectDB();
    const { movieId } = req.params;
    const result = await client.query(
      `SELECT a.* FROM actors a JOIN moviecast mc ON a.actorid = mc.actorid WHERE mc.movieid = $1`,
      [movieId]
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows);
    } else {
      res.status(404).send("Movie not found.");
    }
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.get("/actors/movie/:movieId", async (req, res) => {
  try {
    const client = await connectDB();
    const { movieId } = req.params;
    const result = await client.query(
      `SELECT a.* FROM actors a JOIN moviecast mc ON a.actorid = mc.actorid WHERE mc.movieid = $1`,
      [movieId]
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows);
    } else {
      res.status(404).send("Movie not found.");
    }
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.get("/actors/genre/:genreName", async (req, res) => {
  try {
    const client = await connectDB();
    const { genreName } = req.params;
    const result = await client.query(
      `SELECT a.* FROM actors a JOIN moviecast mc ON a.actorid = mc.actorid JOIN movies m ON mc.movieid = m.movieid JOIN genres g ON m.genreid = g.genreid WHERE g.name = $1`,
      [genreName]
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows);
    } else {
      res.status(404).send("No actors found for this genre.");
    }
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.get("/actors/name/:name", async (req, res) => {
  try {
    const client = await connectDB();
    const { name } = req.params;
    const result = await client.query(`SELECT * FROM actors WHERE name = $1`, [
      name,
    ]);
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send("Actor not found.");
    }
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.get("/actors/:actorId", async (req, res) => {
  try {
    const client = await connectDB();
    const { actorId } = req.params;
    const result = await client.query(
      `SELECT * FROM actors WHERE actorid = $1`,
      [actorId]
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send("Actor not found.");
    }
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.get("/actors", async (req, res) => {
  try {
    const client = await connectDB();
    const result = await client.query(`SELECT * FROM actors`);
    res.status(200).json(result.rows);
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.post("/actors", async (req, res) => {
  try {
    const client = await connectDB();
    const { name, bio, birthdate, deathdate, pictureurl } = req.body;
    const result = await client.query(
      `INSERT INTO actors (name, bio, birthdate, deathdate, pictureurl) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, bio, birthdate, deathdate, pictureurl]
    );
    res.status(201).json(result.rows[0]);
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.put("/actors/:actorId", async (req, res) => {
  try {
    const client = await connectDB();
    const { actorId } = req.params;
    const { name, bio, birthdate, deathdate, pictureurl } = req.body;
    const result = await client.query(
      `UPDATE actors SET name = $2, bio = $3, birthdate = $4, deathdate = $5, pictureurl = $6 WHERE actorid = $1 RETURNING *`,
      [actorId, name, bio, birthdate, deathdate, pictureurl]
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send("Actor not found.");
    }
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.delete("/actors/:actorId", async (req, res) => {
  try {
    const client = await connectDB();
    const { actorId } = req.params;
    const result = await client.query(
      `DELETE FROM actors WHERE actorid = $1 RETURNING *`,
      [actorId]
    );
    if (result.rows.length > 0) {
      res.status(200).send("Actor deleted successfully.");
    } else {
      res.status(404).send("Actor not found.");
    }
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.get("/genres", async (req, res) => {
  try {
    const client = await connectDB();
    const result = await client.query(`SELECT * FROM genres`);
    res.status(200).json(result.rows);
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.delete("/genres/:name", async (req, res) => {
  try {
    const client = await connectDB();
    const { name } = req.params;
    const result = await client.query(
      `DELETE FROM genres WHERE name = $1 RETURNING *`,
      [name]
    );
    if (result.rows.length > 0) {
      res.status(200).send("Genre deleted successfully.");
    } else {
      res.status(404).send("Genre not found.");
    }
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.put("/genres/:name", async (req, res) => {
  try {
    const client = await connectDB();
    const { name } = req.params;
    const { description } = req.body;
    const result = await client.query(
      `UPDATE genres SET description = $2 WHERE name = $1 RETURNING *`,
      [name, description]
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send("Genre not found.");
    }
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.get("/directors", async (req, res) => {
  try {
    const client = await connectDB();
    const result = await client.query(`SELECT * FROM directors`);
    res.status(200).json(result.rows);
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.get("/directors/name/:name", async (req, res) => {
  try {
    const client = await connectDB();
    const { name } = req.params;
    const result = await client.query(
      `SELECT * FROM directors WHERE name = $1`,
      [name]
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send("Director not found.");
    }
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.get("/directors/:directorId", async (req, res) => {
  try {
    const client = await connectDB();
    const { directorId } = req.params;
    const result = await client.query(
      `SELECT * FROM directors WHERE directorid = $1`,
      [directorId]
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send("Director not found.");
    }
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.post("/users", async (req, res) => {
  try {
    const client = await connectDB();
    const { username, email, firstname, lastname } = req.body;
    const checkResult = await client.query(
      `SELECT * FROM users WHERE username = $1`,
      [username]
    );
    if (checkResult.rows.length > 0) {
      await disconnectDB(client);
      return res
        .status(400)
        .send(
          "Username already exists. <a href='/documentation.html#register-user'>Try again?</a>"
        );
    } else {
      const result = await client.query(
        `INSERT INTO users (username, email, firstname, lastname) VALUES ($1, $2, $3, $4) RETURNING *`,
        [username, email, firstname, lastname]
      );
      res.status(201).json(result.rows[0]);
    }
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.put("/users/:username", async (req, res) => {
  try {
    const client = await connectDB();
    const { username } = req.params;
    const { email, firstname, lastname } = req.body;
    const result = await client.query(
      `UPDATE users SET email = $2, firstname = $3, lastname = $4 WHERE username = $1 RETURNING *`,
      [username, email, firstname, lastname]
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send("User not found.");
    }
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.delete("/users/:username", async (req, res) => {
  try {
    const client = await connectDB();
    const { username } = req.params;
    const result = await client.query(
      `DELETE FROM users WHERE username = $1 RETURNING *`,
      [username]
    );
    if (result.rows.length > 0) {
      res.status(200).send("User deregistered successfully.");
    } else {
      res.status(404).send("User not found.");
    }
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.post("/users/:username/favorites/:movieId", async (req, res) => {
  try {
    const client = await connectDB();
    const { username, movieId } = req.params;

    const userResult = await client.query(
      `SELECT userid FROM users WHERE username = $1`,
      [username]
    );
    if (userResult.rows.length === 0) {
      await disconnectDB(client);
      return res.status(404).send("User not found.");
    }
    const userId = userResult.rows[0].userid;

    const checkResult = await client.query(
      `SELECT * FROM usersmovies WHERE userid = $1 AND movieid = $2`,
      [userId, parseInt(movieId, 10)]
    );
    if (checkResult.rows.length > 0) {
      await disconnectDB(client);
      return res
        .status(400)
        .send("Movie is already in user's favorites.");
    }

    const result = await client.query(
      `INSERT INTO usersmovies (userid, movieid) VALUES ($1, $2) RETURNING *`,
      [userId, parseInt(movieId, 10)]
    );
    if (result.rows.length > 0) {
      res.status(200).send("Movie added to favorites.");
    } else {
      res.status(500).send("Failed to add movie to favorites.");
    }
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.delete("/users/:username/favorites/:movieId", async (req, res) => {
  try {
    const client = await connectDB();
    const { username, movieId } = req.params;

    const userResult = await client.query(
      `SELECT userid FROM users WHERE username = $1`,
      [username]
    );
    if (userResult.rows.length === 0) {
      await disconnectDB(client);
      return res.status(404).send("User not found.");
    }
    const userId = userResult.rows[0].userid;

    const result = await client.query(
      `DELETE FROM usersmovies WHERE userid = $1 AND movieid = $2 RETURNING *`,
      [userId, parseInt(movieId, 10)]
    );
    if (result.rows.length > 0) {
      res.status(200).send("Movie removed from favorites.");
    } else {
      res.status(404).send("Movie not found in favorites.");
    }
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.get("/", (req, res) => {
  res.send("Welcome to the Movie API!");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("We are sorry, there has been an error.");
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

app.get("/admin/users", async (req, res) => {
  try {
    const client = await connectDB();
    const result = await client.query(`SELECT * FROM users`);
    res.status(200).json(result.rows);
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.get("/admin/movies", async (req, res) => {
  try {
    const client = await connectDB();
    const moviesResult = await client.query(`SELECT * FROM movies`);
    const directorsResult = await client.query(`SELECT * FROM directors`);
    const genresResult = await client.query(`SELECT * FROM genres`);
    const actors = await getActorsWithMovieIds(client);

    const movies = moviesResult.rows.map((movie) =>
      mapMovieResult(movie, directorsResult.rows, genresResult.rows, actors)
    );
    res.status(200).json(movies);
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.get("/admin/genres", async (req, res) => {
  try {
    const client = await connectDB();
    const result = await client.query(`SELECT * FROM genres`);
    res.status(200).json(result.rows);
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.get("/admin/directors", async (req, res) => {
  try {
    const client = await connectDB();
    const result = await client.query(`SELECT * FROM directors`);
    res.status(200).json(result.rows);
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});

app.get("/admin/actors", async (req, res) => {
  try {
    const client = await connectDB();
    const result = await client.query(`SELECT * FROM actors`);
    res.status(200).json(result.rows);
    await disconnectDB(client);
  } catch (err) {
    console.error(err);
    res.status(500).send("We are sorry, there has been an error.");
  }
});