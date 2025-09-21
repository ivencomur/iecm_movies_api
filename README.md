# MovieMobs API

The MovieMobs API serves as the complete backend for a client-side application that provides users with a rich database of movie information. It handles everything from user authentication and profile management to delivering detailed data about movies, genres, and directors.

This RESTful API is built with a modern Node.js and Express stack, interacting with a MongoDB database to ensure robust and persistent data storage. It is designed to be secure, scalable, and easy to integrate with any front-end application.

---

## Table of Contents

* [About The Project](#about-the-project)
* [Core Features](#core-features)
* [Built With](#built-with)
* [Getting Started](#getting-started)
    * [Prerequisites](#prerequisites)
    * [Installation](#installation)
    * [Running the Application](#running-the-application)
* [Authentication Flow](#authentication-flow)
* [API Endpoint Documentation](#api-endpoint-documentation)
    * [Authentication](#authentication)
    * [User Management](#user-management)
    * [Movie Data](#movie-data)
    * [Favorite Movies Management](#favorite-movies-management)

---

## About The Project

This project provides the server-side logic for the MovieMobs web application. Its primary function is to expose a series of secure RESTful endpoints that allow a client application to:

* Register new users and authenticate existing ones.
* Access a comprehensive collection of movie data.
* Allow users to manage their profiles and maintain a personal list of favorite movies.

The API uses **JWT (JSON Web Token)** authentication to secure its endpoints, ensuring that user data is protected and can only be accessed by authenticated and authorized users.

---

## Core Features

* **Secure User Authentication**: Robust user registration and login system using Passport.js with JWTs. Sensitive endpoints are protected, and passwords are encrypted using bcrypt.
* **Full CRUD Functionality**: Users have complete control over their profiles and their list of favorite movies through standard Create, Read, Update, and Delete operations.
* **Rich Data Models**: Utilizes Mongoose to define clear schemas for movies and users, allowing for detailed information on genres, directors, and more.
* **RESTful Architecture**: A clean and predictable API design that follows REST principles, making it easy to understand and consume.
* **CORS Enabled**: Configured with Cross-Origin Resource Sharing (CORS) to securely handle requests from the deployed front-end application.

---

## Built With

This project relies on a modern set of technologies from the JavaScript ecosystem:

* **Node.js**: A JavaScript runtime built on Chrome's V8 JavaScript engine.
* **Express.js**: A fast, unopinionated, minimalist web framework for Node.js used to build the API server.
* **MongoDB**: A NoSQL document database used for storing all movie and user information.
* **Mongoose**: An Object Data Modeling (ODM) library for MongoDB and Node.js, used for schema definition and data validation.
* **Passport.js**: The primary authentication middleware for Node.js, configured with `passport-local` for username/password login and `passport-jwt` for token-based authentication.
* **JSON Web Token (JWT)**: Used for creating secure access tokens that are passed between the client and server.
* **Bcrypt**: A library used to hash user passwords before storing them in the database.
* **dotenv**: A zero-dependency module that loads environment variables from a `.env` file into `process.env`.

---

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have the following software installed on your machine:
* **Node.js** (which includes npm)
* **MongoDB** (either running locally or a connection string to a cloud instance like MongoDB Atlas)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/ivencomur/iecm_movies_api.git](https://github.com/ivencomur/iecm_movies_api.git)
    ```
2.  **Navigate into the project directory:**
    ```sh
    cd iecm_movies_api
    ```
3.  **Install NPM packages:**
    ```sh
    npm install
    ```
4.  **Set up environment variables:**
    Create a file named `.env` in the root of your project and add your database connection string and a secret key for JWTs.
    ```env
    CONNECTION_URI='your_mongodb_connection_string_here'
    JWT_SECRET='your_super_secret_and_long_jwt_key_here'
    ```

### Running the Application

* **To run the server in production mode:**
    ```sh
    npm start
    ```
* **To run the server in development mode (with auto-restarting via nodemon):**
    ```sh
    npm run dev
    ```
The server will start, typically on `http://localhost:8080`.

---

## Authentication Flow

The API is secured using JWTs. The authentication process is as follows:
1.  A user sends their `Username` and `Password` to the `/login` endpoint.
2.  The server verifies the credentials. If they are correct, it generates a JWT and sends it back to the client in the response.
3.  For every subsequent request to a protected endpoint, the client must include this token in the `Authorization` header with the `Bearer` scheme.

    **Example Header:**
    `Authorization: Bearer <your_jwt_here>`

---

## API Endpoint Documentation

All endpoints (except for `/users` [POST] and `/login`) are protected and require a valid JWT Bearer Token in the Authorization header.

### Authentication

| Action              | URL Endpoint | HTTP Method | Request Body                             | Response                               |
| ------------------- | ------------ | ----------- | ---------------------------------------- | -------------------------------------- |
| User Registration   | `/users`     | POST        | JSON with `Username`, `Password`, `Email`  | JSON object of the new user          |
| User Login          | `/login`     | POST        | JSON with `Username` and `Password`    | JSON with user object and JWT          |

### User Management

| Action                  | URL Endpoint     | HTTP Method | Request Body                             | Response                               |
| ----------------------- | ---------------- | ----------- | ---------------------------------------- | -------------------------------------- |
| Get a User by Username  | `/users/:Username` | GET         | None                                     | JSON object of the user's data       |
| Update User Information | `/users/:Username` | PUT         | JSON with fields to update (e.g., `Email`) | JSON object of the updated user        |
| Delete a User Account   | `/users/:Username` | DELETE      | None                                     | A success or failure message         |

### Movie Data

| Action                    | URL Endpoint                      | HTTP Method | Request Body | Response                                   |
| ------------------------- | --------------------------------- | ----------- | ------------ | ------------------------------------------ |
| Get All Movies            | `/movies`                         | GET         | None         | Array of all movie objects in JSON format  |
| Get Movie by Title        | `/movies/:Title`                  | GET         | None         | JSON object of the specified movie       |
| Get Genre Information     | `/movies/genres/:Name`            | GET         | None         | JSON object with genre name and description |
| Get Director Information  | `/movies/directors/:Name`         | GET         | None         | JSON object with director name and bio    |

### Favorite Movies Management

| Action                       | URL Endpoint                       | HTTP Method | Request Body | Response                                   |
| ---------------------------- | ---------------------------------- | ----------- | ------------ | ------------------------------------------ |
| Add Movie to Favorites       | `/users/:Username/movies/:MovieID` | POST        | None         | JSON object of the updated user profile    |
| Remove Movie from Favorites  | `/users/:Username/movies/:MovieID` | DELETE      | None         | JSON object of the updated user profile    |