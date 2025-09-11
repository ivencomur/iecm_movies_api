// ===================================================================================
//
//  Complete Database Population Script for MovieMobs API
//
//  This script cleans and populates the database with a structure that matches
//  the exact Mongoose schemas in the project's models.js file. It creates five
//  collections: `genres`, `directors`, `actors` (as standalone tables),
//  `movies` (with embedded genre/director), and `users` (including a specific user for testing).
//
// ===================================================================================

use('iecm_movies_api_DB');

print('--- Starting Complete Database Population Script ---');

// --- Step 1: Drop existing collections for a clean slate ---
print('Step 1: Dropping existing collections...');
db.getCollection('genres').drop();
db.getCollection('directors').drop();
db.getCollection('actors').drop();
db.getCollection('movies').drop();
db.getCollection('users').drop();
print('Collections dropped successfully.');

// --- Step 2: Define all original data with PascalCase to match schemas ---

const genresData = [
    { "Name": "Drama", "Description": "Character-driven stories with realistic settings and focus on emotional development." },
    { "Name": "Crime", "Description": "Focuses on criminal actions, detection, and motives." },
    { "Name": "Action", "Description": "Characterized by excitement, stunts, chases, and resourcefulness in battling antagonists." },
    { "Name": "Thriller", "Description": "Evokes excitement, suspense, anticipation, and anxiety." },
    { "Name": "Sci-Fi", "Description": "Speculative fiction dealing with imaginative concepts such as futuristic science and technology." },
    { "Name": "Comedy", "Description": "Intended to make an audience laugh." },
    { "Name": "Fantasy", "Description": "Uses magic and other supernatural phenomena as primary plot elements or themes." },
    { "Name": "Animation", "Description": "Utilizes animation techniques to tell a story." },
    { "Name": "Adventure", "Description": "Features exciting journeys, exploration, and often elements of danger." },
    { "Name": "Mystery", "Description": "Focuses on the solving of a crime or puzzle." },
    { "Name": "Western", "Description": "Films set in the American Old West, typically featuring cowboys, frontier life, and conflicts." }
];

const directorsData = [
    { "Name": "Frank Darabont", "Bio": "American director, screenwriter and producer, known for The Shawshank Redemption and The Green Mile.", "Birth": new Date("1959-01-28T00:00:00.000Z") },
    { "Name": "Francis Ford Coppola", "Bio": "American film director, producer and screenwriter, central figure of the New Hollywood filmmaking movement.", "Birth": new Date("1939-04-07T00:00:00.000Z") },
    { "Name": "Christopher Nolan", "Bio": "British-American filmmaker known for complex narratives and large-scale productions like Inception and The Dark Knight.", "Birth": new Date("1970-07-30T00:00:00.000Z") },
    { "Name": "Quentin Tarantino", "Bio": "American filmmaker and actor known for stylized violence, non-linear storylines, and pop culture references.", "Birth": new Date("1963-03-27T00:00:00.000Z") },
    { "Name": "Robert Zemeckis", "Bio": "American filmmaker known for innovative visual effects in films like Forrest Gump and Back to the Future.", "Birth": new Date("1952-05-14T00:00:00.000Z") },
    { "Name": "Bong Joon-ho", "Bio": "South Korean film director, producer and screenwriter.", "Birth": new Date("1969-09-14T00:00:00.000Z") },
    { "Name": "Hayao Miyazaki", "Bio": "Japanese animated film director, producer, screenwriter, animator, author, and manga artist.", "Birth": new Date("1941-01-05T00:00:00.000Z") },
    { "Name": "Lana Wachowski", "Bio": "American film director, screenwriter and producer, known for The Matrix series.", "Birth": new Date("1965-06-21T00:00:00.000Z") },
    { "Name": "Jonathan Demme", "Bio": "American director, producer, and screenwriter, best known for directing The Silence of the Lambs.", "Birth": new Date("1944-02-22T00:00:00.000Z"), "Death": new Date("2017-04-26T00:00:00.000Z") },
    { "Name": "David Fincher", "Bio": "American film director known for his dark and stylish psychological thrillers.", "Birth": new Date("1962-08-28T00:00:00.000Z") },
    { "Name": "Denis Villeneuve", "Bio": "Canadian film director and writer, known for Arrival, Blade Runner 2049, and Dune.", "Birth": new Date("1967-10-03T00:00:00.000Z") },
    { "Name": "George Miller", "Bio": "Australian film director, producer, screenwriter, and physician. He is best known for his Mad Max franchise.", "Birth": new Date("1945-03-03T00:00:00.000Z") },
    { "Name": "Sergio Leone", "Bio": "Italian film director, producer and screenwriter, credited as the creator of the Spaghetti Western genre.", "Birth": new Date("1929-01-03T00:00:00.000Z"), "Death": new Date("1989-04-30T00:00:00.000Z") }
];

const actorsData = [
    { "Name": "Tim Robbins", "Bio": "American actor, director, screenwriter, producer, activist and musician.", "Birth": new Date("1958-10-16T00:00:00.000Z") },
    { "Name": "Morgan Freeman", "Bio": "American actor, director and narrator known for his distinctive deep voice.", "Birth": new Date("1937-06-01T00:00:00.000Z") },
    { "Name": "Marlon Brando", "Bio": "American actor considered one of the most influential actors of the 20th century.", "Birth": new Date("1924-04-03T00:00:00.000Z"), "Death": new Date("2004-07-01T00:00:00.000Z") },
    { "Name": "Al Pacino", "Bio": "American actor and filmmaker with a career spanning over five decades.", "Birth": new Date("1940-04-25T00:00:00.000Z") },
    { "Name": "Christian Bale", "Bio": "English actor known for his versatility and intense method acting.", "Birth": new Date("1974-01-30T00:00:00.000Z") },
    { "Name": "Heath Ledger", "Bio": "Australian actor and music video director.", "Birth": new Date("1979-04-04T00:00:00.000Z"), "Death": new Date("2008-01-22T00:00:00.000Z") },
    { "Name": "John Travolta", "Bio": "American actor and singer.", "Birth": new Date("1954-02-18T00:00:00.000Z") },
    { "Name": "Samuel L. Jackson", "Bio": "American actor and producer. One of the most widely recognized actors of his generation.", "Birth": new Date("1948-12-21T00:00:00.000Z") },
    { "Name": "Uma Thurman", "Bio": "American actress, writer, producer and model.", "Birth": new Date("1970-04-29T00:00:00.000Z") },
    { "Name": "Tom Hanks", "Bio": "American actor and filmmaker. Known for both his comedic and dramatic roles.", "Birth": new Date("1956-07-09T00:00:00.000Z") },
    { "Name": "Robin Wright", "Bio": "American actress and director.", "Birth": new Date("1966-04-08T00:00:00.000Z") },
    { "Name": "Gary Sinise", "Bio": "American actor, director, musician, producer and philanthropist.", "Birth": new Date("1955-03-17T00:00:00.000Z") },
    { "Name": "Leonardo DiCaprio", "Bio": "American actor and film producer known for his work in biopics and period films.", "Birth": new Date("1974-11-11T00:00:00.000Z") },
    { "Name": "Joseph Gordon-Levitt", "Bio": "American actor, filmmaker, singer, and entrepreneur.", "Birth": new Date("1981-02-17T00:00:00.000Z") },
    { "Name": "Elliot Page", "Bio": "Canadian actor and producer.", "Birth": new Date("1987-02-21T00:00:00.000Z") },
    { "Name": "Song Kang-ho", "Bio": "South Korean actor, prominent figure in the country's film industry.", "Birth": new Date("1967-01-17T00:00:00.000Z") },
    { "Name": "Rumi Hiiragi", "Bio": "Japanese actress (voice actress for Chihiro in Spirited Away).", "Birth": new Date("1987-08-01T00:00:00.000Z") },
    { "Name": "Miyu Irino", "Bio": "Japanese actor and voice actor (voice of Haku in Spirited Away).", "Birth": new Date("1988-02-19T00:00:00.000Z") },
    { "Name": "Tom Hardy", "Bio": "English actor and producer. He made his film debut in Ridley Scott's Black Hawk Down.", "Birth": new Date("1977-09-15T00:00:00.000Z") },
    { "Name": "Charlize Theron", "Bio": "South African and American actress and producer.", "Birth": new Date("1975-08-07T00:00:00.000Z") },
    { "Name": "Jodie Foster", "Bio": "American actress, director, and producer.", "Birth": new Date("1962-11-19T00:00:00.000Z") },
    { "Name": "Anthony Hopkins", "Bio": "Welsh actor, director, and producer.", "Birth": new Date("1937-12-31T00:00:00.000Z") },
    { "Name": "Brad Pitt", "Bio": "American actor and film producer.", "Birth": new Date("1963-12-18T00:00:00.000Z") },
    { "Name": "Gwyneth Paltrow", "Bio": "American actress and businesswoman.", "Birth": new Date("1972-09-27T00:00:00.000Z") },
    { "Name": "Amy Adams", "Bio": "American actress known for both her comedic and dramatic performances.", "Birth": new Date("1974-08-20T00:00:00.000Z") },
    { "Name": "Jeremy Renner", "Bio": "American actor known for his roles in The Hurt Locker and The Avengers.", "Birth": new Date("1971-01-07T00:00:00.000Z") },
    { "Name": "Forest Whitaker", "Bio": "American actor, producer, director, and activist.", "Birth": new Date("1961-07-15T00:00:00.000Z") },
    { "Name": "Clint Eastwood", "Bio": "American actor, film director, composer, and producer.", "Birth": new Date("1930-05-31T00:00:00.000Z") }
];

// --- Step 3: Populate the standalone collections ---
print('Step 3: Populating standalone collections (genres, directors, actors)...');
db.genres.insertMany(genresData);
db.directors.insertMany(directorsData);
db.actors.insertMany(actorsData);
print('Standalone collections populated successfully.');

// --- Step 4: Populate the `movies` collection with all original embedded data ---
print('Step 4: Populating movies collection with embedded data...');
db.movies.insertMany([
    {
        "Title": "The Shawshank Redemption", "Description": "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
        "Genre": { "Name": "Drama", "Description": "Character-driven stories with realistic settings and focus on emotional development." },
        "Director": { "Name": "Frank Darabont", "Bio": "American director, screenwriter and producer, known for The Shawshank Redemption and The Green Mile.", "Birth": new Date("1959-01-28T00:00:00.000Z") },
        "Actors": ["Tim Robbins", "Morgan Freeman"], "ImagePath": "https://upload.wikimedia.org/wikipedia/en/8/81/ShawshankRedemptionMoviePoster.jpg", "Featured": true, "ReleaseYear": 1994, "Rating": 9.3
    },
    {
        "Title": "The Godfather", "Description": "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
        "Genre": { "Name": "Crime", "Description": "Focuses on criminal actions, detection, and motives." },
        "Director": { "Name": "Francis Ford Coppola", "Bio": "American film director, producer and screenwriter, central figure of the New Hollywood filmmaking movement.", "Birth": new Date("1939-04-07T00:00:00.000Z") },
        "Actors": ["Marlon Brando", "Al Pacino"], "ImagePath": "https://upload.wikimedia.org/wikipedia/en/1/1c/Godfather_ver1.jpg", "Featured": true, "ReleaseYear": 1972, "Rating": 9.2
    },
    {
        "Title": "The Dark Knight", "Description": "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
        "Genre": { "Name": "Action", "Description": "Characterized by excitement, stunts, chases, and resourcefulness in battling antagonists." },
        "Director": { "Name": "Christopher Nolan", "Bio": "British-American filmmaker known for complex narratives and large-scale productions like Inception and The Dark Knight.", "Birth": new Date("1970-07-30T00:00:00.000Z") },
        "Actors": ["Christian Bale", "Heath Ledger"], "ImagePath": "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg", "Featured": true, "ReleaseYear": 2008, "Rating": 9.0
    },
    {
        "Title": "Pulp Fiction", "Description": "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
        "Genre": { "Name": "Crime", "Description": "Focuses on criminal actions, detection, and motives." },
        "Director": { "Name": "Quentin Tarantino", "Bio": "American filmmaker and actor known for stylized violence, non-linear storylines, and pop culture references.", "Birth": new Date("1963-03-27T00:00:00.000Z") },
        "Actors": ["John Travolta", "Samuel L. Jackson", "Uma Thurman"], "ImagePath": "https://upload.wikimedia.org/wikipedia/en/3/3b/Pulp_Fiction_%281994%29_poster.jpg", "Featured": false, "ReleaseYear": 1994, "Rating": 8.9
    },
    {
        "Title": "Forrest Gump", "Description": "The presidencies of Kennedy and Johnson, the Vietnam War, and other historical events unfold from the perspective of an Alabama man with an IQ of 75.",
        "Genre": { "Name": "Comedy", "Description": "Intended to make an audience laugh." },
        "Director": { "Name": "Robert Zemeckis", "Bio": "American filmmaker known for innovative visual effects in films like Forrest Gump and Back to the Future.", "Birth": new Date("1952-05-14T00:00:00.000Z") },
        "Actors": ["Tom Hanks", "Robin Wright", "Gary Sinise"], "ImagePath": "https://upload.wikimedia.org/wikipedia/en/6/67/Forrest_Gump_poster.jpg", "Featured": true, "ReleaseYear": 1994, "Rating": 8.8
    },
    {
        "Title": "Inception", "Description": "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
        "Genre": { "Name": "Sci-Fi", "Description": "Speculative fiction dealing with imaginative concepts such as futuristic science and technology." },
        "Director": { "Name": "Christopher Nolan", "Bio": "British-American filmmaker known for complex narratives and large-scale productions like Inception and The Dark Knight.", "Birth": new Date("1970-07-30T00:00:00.000Z") },
        "Actors": ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"], "ImagePath": "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg", "Featured": true, "ReleaseYear": 2010, "Rating": 8.8
    },
    {
        "Title": "Mad Max: Fury Road", "Description": "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the help of a group of female prisoners, a psychotic worshiper, and a drifter named Max.",
        "Genre": { "Name": "Action", "Description": "Characterized by excitement, stunts, chases, and resourcefulness in battling antagonists." },
        "Director": { "Name": "George Miller", "Bio": "Australian film director, producer, screenwriter, and physician. He is best known for his Mad Max franchise.", "Birth": new Date("1945-03-03T00:00:00.000Z") },
        "Actors": ["Tom Hardy", "Charlize Theron"], "ImagePath": "https://m.media-amazon.com/images/M/MV5BN2EwM2I5OWMtMGQyMi00Zjg1LWJkNTctZTdjYTA4OGUwZjMyXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg", "Featured": false, "ReleaseYear": 2015, "Rating": 8.1
    },
    {
        "Title": "Spirited Away", "Description": "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.",
        "Genre": { "Name": "Animation", "Description": "Utilizes animation techniques to tell a story." },
        "Director": { "Name": "Hayao Miyazaki", "Bio": "Japanese animated film director, producer, screenwriter, animator, author, and manga artist.", "Birth": new Date("1941-01-05T00:00:00.000Z") },
        "Actors": ["Rumi Hiiragi", "Miyu Irino"], "ImagePath": "https://m.media-amazon.com/images/M/MV5BMjlmZmI5MDctNDE2YS00YWE0LWE5ZWItZDBhYWQ0NTcxNWRhXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg", "Featured": false, "ReleaseYear": 2001, "Rating": 8.6
    },
    {
        "Title": "Parasite", "Description": "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
        "Genre": { "Name": "Thriller", "Description": "Evokes excitement, suspense, anticipation, and anxiety." },
        "Director": { "Name": "Bong Joon-ho", "Bio": "South Korean film director, producer and screenwriter.", "Birth": new Date("1969-09-14T00:00:00.000Z") },
        "Actors": ["Song Kang-ho"], "ImagePath": "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_SX300.jpg", "Featured": true, "ReleaseYear": 2019, "Rating": 8.6
    },
    {
        "Title": "The Silence of the Lambs", "Description": "A young F.B.I. cadet must receive the help of an incarcerated and manipulative cannibal killer to help catch another serial killer.",
        "Genre": { "Name": "Thriller", "Description": "Evokes excitement, suspense, anticipation, and anxiety." },
        "Director": { "Name": "Jonathan Demme", "Bio": "American director, producer, and screenwriter, best known for directing The Silence of the Lambs.", "Birth": new Date("1944-02-22T00:00:00.000Z"), "Death": new Date("2017-04-26T00:00:00.000Z") },
        "Actors": ["Jodie Foster", "Anthony Hopkins"], "ImagePath": "https://upload.wikimedia.org/wikipedia/en/8/86/The_Silence_of_the_Lambs_poster.jpg", "Featured": true, "ReleaseYear": 1991, "Rating": 8.6
    },
    {
        "Title": "Se7en", "Description": "Two detectives, a rookie and a veteran, hunt a serial killer who uses the seven deadly sins as his motives.",
        "Genre": { "Name": "Mystery", "Description": "Focuses on the solving of a crime or puzzle." },
        "Director": { "Name": "David Fincher", "Bio": "American film director known for his dark and stylish psychological thrillers.", "Birth": new Date("1962-08-28T00:00:00.000Z") },
        "Actors": ["Brad Pitt", "Morgan Freeman", "Gwyneth Paltrow"], "ImagePath": "https://upload.wikimedia.org/wikipedia/en/6/68/Seven_%28movie%29_poster.jpg", "Featured": false, "ReleaseYear": 1995, "Rating": 8.6
    },
    {
        "Title": "The Good, the Bad and the Ugly", "Description": "A bounty hunting scam joins two men in an uneasy alliance against a third in a race to find a fortune in gold buried in a remote cemetery.",
        "Genre": { "Name": "Western", "Description": "Films set in the American Old West, typically featuring cowboys, frontier life, and conflicts." },
        "Director": { "Name": "Sergio Leone", "Bio": "Italian film director, producer and screenwriter, credited as the creator of the Spaghetti Western genre.", "Birth": new Date("1929-01-03T00:00:00.000Z"), "Death": new Date("1989-04-30T00:00:00.000Z") },
        "Actors": ["Clint Eastwood"], "ImagePath": "https://m.media-amazon.com/images/M/MV5BOTQ5NDI3MTI4MF5BMl5BanBnXkFtZTgwNDQ4ODE5MDE@._V1_SX300.jpg", "Featured": false, "ReleaseYear": 1966, "Rating": 8.8
    }
]);
print('Movies collection populated successfully.');

// --- Step 5: Populate users collection with valid movie references and test user ---
print('Step 5: Populating users collection...');

const darkKnight = db.movies.findOne({ "Title": "The Dark Knight" });
const godfather = db.movies.findOne({ "Title": "The Godfather" });
const shawshank = db.movies.findOne({ "Title": "The Shawshank Redemption" });

const usersData = [
  {
    "Username": "testus",
    "Password": "$2b$10$HokEq0lPmIxwTbZeWAq44u29EFVFK06kSCaIPx.ljLowzTqA/yOlS",
    "Email": "testing@testing.com",
    "Birthday": null,
    "FavoriteMovies": shawshank ? [shawshank._id] : []
  },
  {
    "Username": "moviefan",
    "Password": "$2b$10$ycMT59pdkvsziGqb21kqju.4JcczmN30ecA1L5jTEMSpdjrqb5OuK",
    "Email": "moviefan@example.com",
    "Birthday": new Date("1988-05-10T00:00:00.000Z"),
    "FavoriteMovies": (shawshank && godfather) ? [shawshank._id, godfather._id] : []
  },
  {
    "Username": "IVANUSHKA",
    "Password": "$2b$10$36oPS8OQJ1mR0S8QI8T.g.7y2xISm.JzG.1fJz.Qz.qL6Y5K5gC.a", // Hashed for "IvanoBanano3214!$"
    "Email": "ivanushka@test.com",
    "Birthday": null,
    "FavoriteMovies": darkKnight ? [darkKnight._id] : []
  }
];
db.users.insertMany(usersData);
print('Users collection populated successfully.');

// --- Verification Step ---
print('\n--- Verification ---');
print('Genres (standalone) count: ' + db.genres.countDocuments());
print('Directors (standalone) count: ' + db.directors.countDocuments());
print('Actors (standalone) count: ' + db.actors.countDocuments());
print('Movies count: ' + db.movies.countDocuments());
print('User count: ' + db.users.countDocuments());
print('\n--- Script finished successfully! ---');

