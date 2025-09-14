# MovieMobs API

A RESTful API for a movie database application built with Node.js, Express, MongoDB, and JWT authentication.

## Overview

MovieMobs API provides endpoints for movie data management, user authentication, and favorites functionality. The API serves as the backend for the MovieMobs Angular client application.

## Features

- **User Authentication**: JWT-based authentication with secure password hashing
- **Movie Database**: Complete CRUD operations for movies, genres, directors, and actors
- **User Profiles**: User registration, profile management, and account deletion
- **Favorites System**: Add and remove movies from user favorites
- **Data Relationships**: Populated movie data with genre, director, and actor information
- **Input Validation**: Comprehensive request validation using Express Validator
- **CORS Support**: Cross-origin resource sharing for frontend integration

## Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Passport.js** - Authentication middleware
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing
- **Express Validator** - Input validation
- **Morgan** - HTTP request logger

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- npm package manager

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd moviemobs-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   CONNECTION_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=8080
   ```

4. Seed the database (optional):
   ```bash
   node seed_database.js
   ```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The API will be available at `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /login` - User login
- `POST /users` - User registration

### Movies
- `GET /movies` - Get all movies
- `GET /movies/:Title` - Get movie by title

### User Management
- `GET /user` - Get user profile
- `PUT /user` - Update user profile
- `DELETE /user` - Delete user account
- `POST /user/favorites/:MovieID` - Add movie to favorites
- `DELETE /user/favorites/:MovieID` - Remove movie from favorites

### Data Queries
- `GET /genres/:Name` - Get genre information
- `GET /directors/:Name` - Get director information

## Documentation

Complete API documentation is available in the `/docs` folder. Open `docs/index.html` in your browser to view the full documentation generated with JSDoc.

## Database Schema

### Users
- Username (required, unique)
- Password (hashed with bcrypt)
- Email (required, unique)
- Birthday
- FavoriteMovies (array of movie references)

### Movies
- Title (required, unique)
- Description (required)
- Genre (reference to Genre)
- Director (reference to Director)
- Actors (array of Actor references)
- ImagePath, Featured, ReleaseYear, Rating

### Supporting Collections
- **Genres**: Name, Description
- **Directors**: Name, Bio, Birth, Death
- **Actors**: Name, Bio, Birth, Death, PictureUrl

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## AI Assistance Declaration

This project was developed with significant assistance from AI tools to overcome technical challenges related to outdated dependencies, deprecated packages, and compatibility issues between framework versions. 

**AI assistance was essential for:**
- Resolving complex server startup failures due to dependency conflicts
- Reconstructing implementations when course materials referenced deprecated packages
- Debugging authentication and database connection issues
- Standardizing code documentation and comment formatting
- Providing alternative approaches when original tutorials became obsolete

**Development Context:**
Limited mentor availability necessitated independent problem-solving using available resources, including AI assistance, to complete a functional application despite significant technical obstacles. This resourceful approach enabled successful project completion while maintaining code quality and functionality standards.

**Human Oversight:**
All AI-generated solutions were thoroughly tested, reviewed, and adapted to meet specific project requirements. Architectural decisions and implementation strategies remained under full developer control.

## License

This project is licensed under the MIT License.