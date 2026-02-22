# MovieMobs API

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![Express](https://img.shields.io/badge/Express-5.1.0-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)
![JWT](https://img.shields.io/badge/JWT-Authentication-orange.svg)

A comprehensive RESTful API for movie database management with user authentication, favorites management, and complete CRUD operations.

[Live API](https://iecm-movies-api.onrender.com) • [Frontend Client](https://iecm-moviemobs-frontend-client-final.onrender.com) • [API Documentation](https://iecm-movies-api.onrender.com/documentation.html)

</div>

## 🚀 Overview

MovieMobs API is a robust backend service that powers the MovieMobs movie database application. Built with modern Node.js technologies, it provides secure user authentication, comprehensive movie data management, and a flexible favorites system. The API serves as the foundation for the MovieMobs Angular client application and can be used by any frontend framework.

## ✨ Features

### 🔐 Authentication & Security
- **JWT-based authentication** with secure password hashing (bcrypt)
- **Passport.js integration** for local and JWT strategies
- **Input validation** using Express Validator
- **CORS configuration** for cross-origin requests
- **Environment-based configuration** for security

### 🎬 Movie Management
- **Complete movie data retrieval** with populated relationships
- **Advanced search capabilities** by title, genre, and director
- **Image path management** for movie posters
- **Populated data responses** for rich frontend experiences

### 👤 User Features
- **User registration and profile management**
- **Personalized favorites system**
- **Profile updates and account deletion**
- **Secure password management**
- **Birthday and personal information storage**

### 📊 Data Relationships
- **Genre associations** with detailed descriptions
- **Director information** with biographies and dates
- **Actor management** with filmography links
- **Populated data responses** for rich frontend experiences

## 🛠 Technologies Used

| Category | Technologies |
|----------|-------------|
| **Runtime** | Node.js (18+) |
| **Framework** | Express.js 5.1.0 |
| **Database** | MongoDB with Mongoose ODM |
| **Authentication** | JWT, Passport.js, bcrypt |
| **Validation** | Express Validator |
| **Security** | CORS, dotenv |
| **Logging** | Morgan |
| **Deployment** | Render.com |

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **MongoDB Atlas account** or local MongoDB installation
- **Git** for version control

## ⚙️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd moviemobs-api
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Database Configuration
CONNECTION_URI=mongodb+srv://username:password@cluster.mongodb.net/moviemobs?retryWrites=true&w=majority

# Security
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_256_bits

# Server Configuration
PORT=8080
NODE_ENV=development

# Optional: Additional Security
BCRYPT_ROUNDS=10
```

### 4. Database Setup
Seed your database with sample data:
```bash
node seed_database.js
```

### 5. Start the Server

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

The API will be available at `http://localhost:8080`

## 🌐 API Endpoints

### Base URL
- **Development**: `http://localhost:8080`
- **Production**: `https://iecm-movies-api.onrender.com`

### 🔑 Authentication

#### Register User
```http
POST /users
Content-Type: application/json

{
  "Username": "newuser123",
  "Password": "securepassword",
  "Email": "user@example.com",
  "Birthday": "1990-01-15"
}
```

#### Login User
```http
POST /login
Content-Type: application/json

{
  "username": "newuser123",
  "password": "securepassword"
}
```

### 👤 User Management

#### Get User Profile
```http
GET /user
Authorization: Bearer <jwt_token>
```

#### Update User Profile
```http
PUT /user
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "Email": "newemail@example.com",
  "Birthday": "1990-01-15"
}
```

#### Add Movie to Favorites
```http
POST /user/favorites/:movieId
Authorization: Bearer <jwt_token>
```

#### Remove Movie from Favorites
```http
DELETE /user/favorites/:movieId
Authorization: Bearer <jwt_token>
```

#### Delete User Account
```http
DELETE /user
Authorization: Bearer <jwt_token>
```

### 🎬 Movies

#### Get All Movies
```http
GET /movies
Authorization: Bearer <jwt_token>
```

#### Get Movie by Title
```http
GET /movies/:Title
Authorization: Bearer <jwt_token>
```

### 🎭 Genres & Directors

#### Get Genre by Name
```http
GET /genres/:Name
Authorization: Bearer <jwt_token>
```

#### Get Director by Name
```http
GET /directors/:Name
Authorization: Bearer <jwt_token>
```

## 📊 Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  Username: String (required, unique, min: 5, alphanumeric),
  Password: String (required, hashed with bcrypt),
  Email: String (required, unique, valid email),
  Birthday: Date,
  FavoriteMovies: [ObjectId] (references Movie),
  FirstName: String,
  LastName: String
}
```

### Movie Model
```javascript
{
  _id: ObjectId,
  Title: String (required, unique),
  Description: String (required),
  Genre: ObjectId (required, references Genre),
  Director: ObjectId (required, references Director),
  Actors: [ObjectId] (references Actor),
  ImagePath: String,
  Featured: Boolean (default: false),
  ReleaseYear: Number,
  Rating: Number
}
```

### Supporting Models
- **Genre**: `{ Name, Description }`
- **Director**: `{ Name, Bio, Birth, Death }`
- **Actor**: `{ Name, Bio, Birth, Death, PictureUrl }`

## 🔒 Security Features

### Authentication Flow
1. User registers with validated credentials
2. Password is hashed using bcrypt (10 rounds)
3. User logs in with username/password
4. JWT token is generated and returned
5. Protected routes verify JWT token
6. Token expires after 7 days

### Input Validation
- **Username**: Minimum 5 characters, alphanumeric only
- **Password**: Required, hashed before storage
- **Email**: Valid email format required
- **Dates**: ISO 8601 format validation

### CORS Configuration
```javascript
// Allowed origins for production
const allowedOrigins = [
  'http://localhost:4200',
  'https://your-frontend-app.onrender.com'
];
```

## 🚀 Deployment

### Render.com Deployment

1. **Connect Repository**
   - Link your GitHub repository to Render
   - Select Node.js environment

2. **Environment Variables**
   ```env
   CONNECTION_URI=mongodb+srv://...
   JWT_SECRET=your_production_secret
   NODE_ENV=production
   ```

3. **Build Command**
   ```bash
   npm install
   ```

4. **Start Command**
   ```bash
   npm start
   ```

### Health Check
Once deployed, verify your API:
```http
GET /
```

**Expected Response:**
```
Welcome to the MovieMobs API!
```

## 🧪 Testing

### Manual Testing with Postman

1. **Import Collection**: Use the provided Postman collection
2. **Set Environment Variables**:
   - `base_url`: `http://localhost:8080`
   - `token`: `<jwt_token_from_login>`

3. **Test Authentication Flow**:
   - Register new user
   - Login user
   - Get user profile
   - Update profile

4. **Test Movie Operations**:
   - Get all movies
   - Search by title/genre/director
   - Add/remove favorites

### Automated Testing
```bash
# Run tests (if implemented)
npm test
```

## 🐛 Error Handling

### HTTP Status Codes

| Code | Description | Example |
|------|-------------|---------|
| 200 | Success | Successful GET request |
| 201 | Created | User registration successful |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Invalid/missing JWT token |
| 404 | Not Found | Movie/User not found |
| 422 | Validation Error | Username too short |
| 500 | Server Error | Database connection failed |

### Error Response Format
```json
{
  "error": "Descriptive error message"
}
```

### Validation Error Format
```json
{
  "errors": [
    {
      "type": "field",
      "msg": "Username is required",
      "path": "Username",
      "location": "body",
      "value": ""
    }
  ]
}
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check your CONNECTION_URI
echo $CONNECTION_URI

# Verify MongoDB Atlas network access
# Ensure IP address is whitelisted
```

#### JWT Token Issues
```bash
# Check JWT_SECRET is set
echo $JWT_SECRET

# Verify token format in Authorization header
Authorization: Bearer <actual_token>
```

#### CORS Errors
```javascript
// Verify allowed origins include your frontend URL
const allowedOrigins = [
  'http://localhost:4200',
  'https://your-frontend.onrender.com'
];
```

#### Port Already in Use
```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Or use different port
PORT=3000 npm start
```

## 📈 Performance Considerations

### Database Optimization
- **Indexes**: Create indexes on frequently queried fields
- **Population**: Use selective field population to reduce payload size
- **Pagination**: Implement pagination for large datasets

### Security Optimization
- **Rate Limiting**: Consider implementing rate limiting for production
- **Helmet.js**: Add security headers with Helmet middleware
- **Input Sanitization**: Sanitize user inputs to prevent injection attacks

## 📝 API Documentation

Complete interactive API documentation is available:
- **Development**: `http://localhost:8080/documentation.html`
- **Production**: `https://iecm-movies-api.onrender.com/documentation.html`

Generated JSDoc documentation:
```bash
npm run docs
open docs/index.html
```

## 🔄 Available Scripts

```bash
# Start production server
npm start

# Start development server with nodemon
npm run dev

# Run ESLint
npm run lint

# Generate JSDoc documentation
npm run docs

# Run tests
npm test
```

## 📁 Project Structure

```
moviemobs-api/
├── public/                     # Static files and documentation
│   ├── css/                   # Stylesheets
│   ├── img/                   # Images and icons
│   ├── index.html            # API homepage
│   └── documentation.html    # Interactive API documentation
├── docs/                      # Generated JSDoc documentation
├── models.js                  # Database models and schemas
├── index.js                   # Main application file
├── auth.js                    # Authentication logic
├── passport.js                # Passport strategies
├── package.json              # Dependencies and scripts
├── .env                       # Environment variables (create this)
├── .gitignore                # Git ignore rules
└── README.md                 # Project documentation
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Ensure all tests pass: `npm test`
5. Submit a pull request

### Code Standards
- Use ESLint configuration provided
- Follow REST API conventions
- Add JSDoc comments for functions
- Write descriptive commit messages

## 🌟 Features Roadmap

- [ ] Rate limiting implementation
- [ ] API versioning
- [ ] Advanced search filters
- [ ] Batch operations for movies
- [ ] Image upload functionality
- [ ] Email verification for users
- [ ] Password reset functionality
- [ ] Admin role management
- [ ] API analytics and monitoring
- [ ] Caching layer implementation

## 📞 Support

For questions, issues, or contributions:
- **Email**: [ivancortes@hotmail.com](mailto:ivancortes@hotmail.com)
- **GitHub**: [@ivencomur](https://github.com/ivencomur)
- **LinkedIn**: [Ivan Cortes Murcia](https://www.linkedin.com/in/ivan-cortes-murcia-22053953)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

---

## 🤖 AI Assistance Declaration

This project was developed with significant assistance from AI tools to overcome technical challenges related to rapidly changing framework versions, deprecated dependencies, and compatibility issues between different package versions.

### AI Assistance Scope
- **Dependency Resolution**: Resolving complex server startup failures due to dependency conflicts
- **Framework Updates**: Adapting to deprecated packages and providing current alternatives
- **Authentication Implementation**: Debugging JWT and Passport.js integration issues
- **Database Connectivity**: Troubleshooting MongoDB connection and Mongoose configuration
- **Code Documentation**: Standardizing JSDoc comments and API documentation format
- **CORS Configuration**: Implementing proper cross-origin request handling for production deployment

### Development Context
Limited mentor availability necessitated extensive independent problem-solving using available resources, including AI assistance, to complete a fully functional application despite significant technical obstacles. This approach enabled successful navigation of deprecated course materials and outdated framework references.

### Human Oversight
All AI-generated solutions underwent thorough testing, code review, and adaptation to meet specific project requirements. Core architectural decisions, security implementations, and API design remained under complete developer control throughout the development process.

The use of AI assistance was instrumental in maintaining development momentum while ensuring modern best practices and security standards were implemented correctly.

---

<div align="center">

**Built with ❤️ using Node.js, Express, and MongoDB**

[⬆ Back to Top](#moviemobs-api)

</div>