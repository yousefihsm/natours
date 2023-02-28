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
const compression = require('compression');
const cors = require('cors');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const bookingController = require('./controller/bookingController');
const globalErrorHandler = require('./controller/errorController');

const AppError = require('./utils/appError');

dotenv.config({ path: './config.env' });

const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// GLOBAL MIDDLEWARES
// Implement CORS (CORS added to all routes)
app.use(cors());
// access-control-allow-origin
// api.natours.com, front-end natours.com
app.use(
  cors({
    origin: 'https://www.natours.com',
  })
);

/* For the non-simple http verbs(delete and patch) that has preflight phase.
 that means before the non-simple http verbs browser send an options request to the API. */
// app.options('/api/v1/tours/:id', cors()); // work on a specific API.
app.options('*', cors());

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

// Here body would be raw format not json. so we add it here before json parser middleware.
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
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

// Enable compression on application. (we can test it with online services).
app.use(compression());

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
// app.use('/api/v1/bookings',cors(), bookingRouter); // Add the CORS to specific routes

app.all('*', (req, res, next) => {
  next(new AppError(`The server cant find ${req.originalUrl} endpoint.`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
