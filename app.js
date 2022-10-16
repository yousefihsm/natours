const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

if (process.env.NODE_ENV === 'development') {
  app.use(
    morgan('tiny', {
      stream: fs.createWriteStream('./dev-data/log/morgan.log', {
        flags: 'a',
      }),
    })
  );
}

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

module.exports = app;
