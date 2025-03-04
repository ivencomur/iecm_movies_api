const express = require('express');
const morgan = require('morgan');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

app.use(morgan('common'));


app.use(express.static(path.join(__dirname, 'public')));


const top10Movies = [
  { title: 'Requiem for a Dream', year: 2000 },
  { title: 'The Godfather', year: 1972 },
  { title: 'The Miracle of Marcelino', year: 1955 },
  { title: 'The Discreet Charm of the Bourgeoisie', year: 1972 },
  { title: "Schindler's List", year: 1993 },
  { title: 'The Silence of the Lambs', year: 1991 },
  { title: 'Pulp Fiction', year: 1994 },
  { title: 'The Fifth Element', year: 1997 },
  { title: 'The Strategy of the Snail', year: 1993 },
  { title: 'Fight Club', year: 1999 },
];


app.get('/movies', (req, res) => {
  res.json(top10Movies);
});


app.get('/', (req, res) => {
  res.send('Welcome to my first movies API!');
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('There is an error!');
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});