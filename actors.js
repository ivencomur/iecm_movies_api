

const mongoose = require('mongoose');
const actorSchema = require('./models/actor'); 

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

const Actor = mongoose.model('Actor', actorSchema);

const actorsData = [
  {
    name: 'Tom Hardy',
    bio: 'English actor known for his roles in Inception and Mad Max: Fury Road',
    birth: new Date('1977-09-15'),
    death: null,
    pictureUrl: 'tom_hardy.jpg'
  },
  {
    name: 'Charlize Theron',
    bio: 'South African-American actress known for her roles in Mad Max: Fury Road and Monster',
    birth: new Date('1975-08-07'),
    death: null,
    pictureUrl: 'charlize_theron.jpg'
  },
  {
    name: 'Bruce Willis',
    bio: 'American actor known for his role in Die Hard',
    birth: new Date('1955-03-19'),
    death: null,
    pictureUrl: 'bruce_willis.jpg'
  },
  {
    name: 'Alan Rickman',
    bio: 'English actor known for his roles in Die Hard and Harry Potter',
    birth: new Date('1946-02-21'),
    death: new Date('2016-01-14'),
    pictureUrl: 'alan_rickman.jpg'
  },
  {
    name: 'Keanu Reeves',
    bio: 'Canadian actor known for his roles in John Wick and The Matrix',
    birth: new Date('1964-09-02'),
    death: null,
    pictureUrl: 'keanu_reeves.jpg'
  },
  {
    name: 'Willem Dafoe',
    bio: 'American actor known for his roles in Platoon and John Wick',
    birth: new Date('1955-07-22'),
    death: null,
    pictureUrl: 'willem_dafoe.jpg'
  },
  {
    name: 'Mel Gibson',
    bio: 'American actor and filmmaker known for his roles in Lethal Weapon and Braveheart',
    birth: new Date('1956-01-03'),
    death: null,
    pictureUrl: 'mel_gibson.jpg'
  },
  {
    name: 'Danny Glover',
    bio: 'American actor known for his roles in Lethal Weapon and The Color Purple',
    birth: new Date('1946-07-22'),
    death: null,
    pictureUrl: 'danny_glover.jpg'
  },
  {
    name: 'Arnold Schwarzenegger',
    bio: 'Austrian-American actor known for his roles in Terminator and Predator',
    birth: new Date('1947-07-30'),
    death: null,
    pictureUrl: 'arnold_schwarzenegger.jpg'
  },
  {
    name: 'Linda Hamilton',
    bio: 'American actress known for her roles in Terminator',
    birth: new Date('1956-09-26'),
    death: null,
    pictureUrl: 'linda_hamilton.jpg'
  },
  {
    name: 'Harrison Ford',
    bio: 'American actor known for his roles in Indiana Jones and Star Wars',
    birth: new Date('1942-07-13'),
    death: null,
    pictureUrl: 'harrison_ford.jpg'
  },
  {
    name: 'John Travolta',
    bio: 'American actor known for his role \u00A0in Pulp Fiction',
    birth: new Date('1954-02-18'),
    death: null,
    pictureUrl: 'john_travolta.jpg'
  }
];

async function populateActors() {
  try {
    // Clear existing actors (optional, use with caution!)
    // await Actor.deleteMany({});
    // console.log('Existing actors cleared.');

    const result = await Actor.insertMany(actorsData);
    console.log('Actors populated successfully:', result);
  } catch (error) {
    console.error('Error populating actors:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
}

populateActors();