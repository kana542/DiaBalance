import express from 'express';
import authRouter from './routes/auth-router.js';  // Import the auth router
import entryRouter from './routes/entry-router.js';
import kubiosRouter from './routes/kubios-router.js';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';

const app = express();
const port = process.env.PORT || 3000;
const hostname = 'localhost';

app.use(cors());
app.use(express.json());

// test route
app.get('/', (req, res) => {
  res.send('Diabalance BE (dev)');
});

// route handlers
app.use('/api/auth', authRouter);  // Use auth router for authentication routes
app.use('/api/entries', entryRouter);
app.use('/api/kubios', kubiosRouter);

// error handling
app.use(notFoundHandler);
app.use(errorHandler);

// start server
app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}`);
});
