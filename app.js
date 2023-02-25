const path = require('path');
const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const globalErrorHandler = require('./controller/errorController');
const AppError = require('./utils/appError');

dotenv.config({ path: './config.env' });

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// GLOBAL MIDDLEWARES
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security http headers
// app.use(helmet());
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: {
      allowOrigins: ['*'],
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ['*'],
        scriptSrc: ["* data: 'unsafe-eval' 'unsafe-inline' blob:"],
      },
    },
  })
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSql query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent param pollution
app.use(
  hpp({
    whitelist: ['filter'],
  })
);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('tiny'));
  app.use(
    morgan('tiny', {
      stream: fs.createWriteStream('./dev-data/log/morgan.log', {
        flags: 'a',
      }),
    })
  );
}

// Limit requests from same API.
const rateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 50,
  message:
    'Too many request is sended to server with this IP. please try again later.',
  standardHeaders: true,
  lagacyHeaders: false,
});
app.use('/api', rateLimiter);

/* 
// Limit users to create two account only everyweek.
const createAccountLimiter = rateLimit({
  windowMs: 7 * 24 * 60 * 60 * 1000,
  max: 2,
  message: `You can create just two accounts everyweek. please try again after 7 days ago`,
  standardHeaders: true,
  lagacyHeaders: false,
});
app.post('/api/v1/users/signup', createAccountLimiter); 
*/

// TEST MIDDLEWARE
app.use((req, res, next) => {
  // console.log(req.cookies);
  next();
});

// ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`The server cant find ${req.originalUrl} endpoint.`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
