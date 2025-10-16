import express from 'express';
import indexRouter from './routes/index.js';
import healthRouter from './routes/api/health.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();
app.use(express.json());

app.use('/', indexRouter);
app.use('/api/health', healthRouter);

app.use(errorHandler);

export default app;
