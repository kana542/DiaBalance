import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';

const app = express();
const port = process.env.PORT || 3000;
const hostname = 'localhost';

app.use(cors());
app.use(express.json());

// Testireitti
app.get('/', (req, res) => {
  res.send('Tervetuloa DiaBalance backendiin!');
});

// Virhekäsittelyt
app.use(notFoundHandler);
app.use(errorHandler);

// Palvelimen käynnistys
app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}`);
});
