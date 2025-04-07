import express from 'express';
import userRouter from './routes/user-router.js';
import entryRouter from './routes/entry-router.js'; 
import kubiosRouter from './routes/kubios-router.js';
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

// Käyttäjäreitit käyttöön (nyt osoitteessa /api/auth)
app.use('/api/auth', userRouter);
app.use('/api/entries', entryRouter);
app.use('/api/kubios', kubiosRouter);

// Virhekäsittelyt
app.use(notFoundHandler);
app.use(errorHandler);

// Palvelimen käynnistys
app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}`);
});
