# MovieMobs API - Achievement 2

A RESTful API for a movie database application built with Node.js, Express, MongoDB, and JWT authentication. This backend service provides comprehensive movie data management with user authentication and favorites functionality.

## Links

- **Repository**: https://github.com/ivencomur/iecm_movies_api/tree/2b6f9fa67a14051e2f45d45d6ac3d399d5cea908
- **Live API**: https://iecm-movies-app-6966360ed90e.herokuapp.com/

## Overview

MovieMobs API serves as the backend foundation for movie database applications, providing secure endpoints for movie data retrieval, user management, and favorites functionality. Built with modern Node.js technologies and deployed on Heroku for reliable cloud hosting.

## Features

- **RESTful Architecture**: Well-structured API endpoints following REST principles
- **JWT Authentication**: Secure user authentication with JSON Web Tokens
- **MongoDB Integration**: NoSQL database for flexible data storage
- **User Management**: Registration, authentication, and profile management
- **Movie Database**: Comprehensive movie information with genres, directors, and actors
- **Favorites System**: Personal movie favorites for authenticated users
- **Data Validation**: Input validation and sanitization for security
- **CORS Support**: Cross-origin resource sharing for frontend integration
- **Error Handling**: Comprehensive error responses and logging

## Technologies Used

- **Node.js** - Server runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **Passport.js** - Authentication middleware
- **bcrypt** - Password hashing
- **express-validator** - Input validation
- **CORS** - Cross-origin resource sharing
- **Heroku** - Cloud platform deployment

## API Endpoints

### Authentication
- `POST /users` - User registration
- `POST /login` - User authentication

### Movies
- `GET /movies` - Retrieve all movies
- `GET /movies/:title` - Get specific movie by title

### User Management
- `GET /users/:username` - Get user profile
- `PUT /users/:username` - Update user information
- `DELETE /users/:username` - Delete user account

### Favorites
- `POST /users/:username/favorites/:movieId` - Add movie to favorites
- `DELETE /users/:username/favorites/:movieId` - Remove from favorites

### Data Queries
- `GET /genres/:name` - Get genre information
- `GET /directors/:name` - Get director details

## Database Schema

### Users Collection
```javascript
{
  username: String (required, unique),
  password: String (hashed with bcrypt),
  email: String (required),
  birthday: Date,
  favoriteMovies: [ObjectId] // References to movies
}
```

### Movies Collection
```javascript
{
  title: String (required),
  description: String (required),
  genre: {
    name: String,
    description: String
  },
  director: {
    name: String,
    bio: String,
    birthYear: Number,
    deathYear: Number
  },
  actors: [String],
  imagePath: String,
  featured: Boolean
}
```

## Authentication

The API uses JWT (JSON Web Tokens) for secure authentication:

```javascript
// Include token in request headers
Authorization: Bearer <jwt_token>
```

## Error Responses

Standardized error responses with appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: express-validator for request sanitization
- **CORS Configuration**: Controlled cross-origin access
- **JWT Expiration**: Time-limited authentication tokens
- **Data Sanitization**: Protection against injection attacks

## Deployment

The API is deployed on Heroku with:
- **MongoDB Atlas**: Cloud database hosting
- **Environment Variables**: Secure configuration management
- **Process Management**: Automatic scaling and health monitoring
- **SSL/HTTPS**: Secure data transmission

## Development Setup

```bash
# Clone repository
git clone https://github.com/ivencomur/iecm_movies_api.git
cd iecm_movies_api

# Install dependencies
npm install

# Configure environment variables
# Create .env file with:
# CONNECTION_URI=mongodb://localhost:27017/moviedb
# JWT_SECRET=your_jwt_secret

# Start development server
npm start
```

## API Documentation

Complete API documentation is available at the deployed endpoint. The API includes:
- Interactive endpoint testing
- Request/response examples
- Authentication requirements
- Error code explanations

## Testing

The API has been tested with:
- **Postman**: Manual endpoint testing
- **Frontend Integration**: React and Angular clients
- **Error Scenarios**: Validation and authentication testing
- **Performance**: Load testing for scalability

## AI Assistance Declaration

This project required extensive AI assistance to overcome significant technical challenges in backend development:

**Technical Challenges Addressed:**
- MongoDB connection and schema design optimization
- JWT authentication implementation and security best practices
- Express.js middleware configuration and error handling
- API endpoint design following RESTful principles
- Database query optimization and relationship management
- Heroku deployment configuration and environment variable management

**Development Context:**
Backend development complexity, combined with rapidly evolving Node.js ecosystem and deployment requirements, necessitated additional support when course materials referenced outdated packages or deployment methods. AI assistance was crucial for implementing modern security practices and resolving compatibility issues between different package versions.

**Human Oversight:**
All AI-generated solutions were thoroughly tested, reviewed, and customized to ensure security, performance, and functionality standards. API design decisions and database architecture remained under full developer control.

## Performance Optimizations

- **Database Indexing**: Optimized queries for faster data retrieval
- **Connection Pooling**: Efficient database connection management
- **Caching Strategies**: Reduced database load for frequent queries
- **Compression**: Response compression for faster data transfer

## Future Enhancements

- Advanced search and filtering capabilities
- Image upload and storage functionality
- Real-time features with WebSocket integration
- API rate limiting and throttling
- Comprehensive automated testing suite
- API versioning for backward compatibility

## License

This project is licensed under the MIT License.
