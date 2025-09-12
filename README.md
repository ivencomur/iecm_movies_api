# MovieMobs API

This is the back-end server for the MovieMobs application. It's a RESTful API built with Node.js, Express, and MongoDB that provides data about movies, genres, directors, and users.

## Features

* **User authentication:** Users can register, log in, and manage their profiles. Passwords are encrypted using bcrypt, and authentication is handled using JSON Web Tokens (JWT) with Passport.js.
* **Movie information:** Provides access to a collection of movies with details about their genres, directors, and actors.
* **Favorite movies:** Authenticated users can add and remove movies from their list of favorites.
* **API documentation:** A public folder contains documentation of the API endpoints.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* **Node.js** and **npm**: Download and install from [nodejs.org](https://nodejs.org/).
* **MongoDB**: Make sure you have a running instance of MongoDB. You'll need the connection URI.
* **Create a `.env` file** in the root directory and add the following environment variables:
    ```
    CONNECTION_URI=<your_mongodb_connection_uri>
    JWT_SECRET=<your_jwt_secret>
    ```

### Installation

1.  **Clone the repository:**
    ```sh
    git clone <repository-url>
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd iecm_movies_api-6.5-INITIAL
    ```
3.  **Install dependencies:**
    ```sh
    npm install
    ```

## Available Scripts

* `npm start`: Starts the server in production mode.
* `npm run dev`: Starts the server in development mode with `nodemon`, which automatically restarts the server on file changes.
* `npm run lint`: Lints the project files using ESLint.

## API Endpoints

All movie-related endpoints require a valid JWT for authentication.

### Movies

* `GET /movies`: Get a list of all movies.
* `GET /movies/:Title`: Get a single movie by title.
* `GET /genres/:Name`: Get information about a genre by name.
* `GET /directors/:Name`: Get information about a director by name.

### Users

* `POST /users`: Register a new user.
* `PUT /user`: Update a user's information.
* `POST /user/favorites/:MovieID`: Add a movie to a user's favorites.
* `DELETE /user/favorites/:MovieID`: Remove a movie from a user's favorites.
* `GET /user`: Get a user's profile information.
* `DELETE /user`: Delete a user's account.

### Authentication

* `POST /login`: Log in a user and receive a JWT.

## Built With

* [Express](https://expressjs.com/) - Web framework for Node.js
* [Mongoose](https://mongoosejs.com/) - MongoDB object modeling for Node.js
* [Passport](http://www.passportjs.org/) - Authentication middleware for Node.js
* [JWT](https://jwt.io/) - JSON Web Tokens for authentication
* [Bcrypt](https://www.npmjs.com/package/bcrypt) - Library for hashing passwords