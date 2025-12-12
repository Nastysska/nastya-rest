import express from 'express';
import indexRouter from './routes/index.js';
import healthRouter from './routes/api/health.js';
import usersRouter from './routes/api/users.js';
import categoriesRouter from './routes/api/categories.js';
import recordsRouter from './routes/api/records.js';
import authRouter from './routes/api/auth.js';
import errorHandler from './middlewares/errorHandler.js';
import { authMiddleware } from './middlewares/auth.js';

const app = express();

app.use(express.json());

app.use('/', indexRouter);
app.use('/api/health', healthRouter);

app.use('/', authRouter);

app.use(authMiddleware);

app.use('/', usersRouter);
app.use('/', categoriesRouter);
app.use('/', recordsRouter);

app.use(errorHandler);

export default app;
