const mongoose = require('mongoose');

// HANDLE UNCAUGHT EXCEPTION
process.on('uncaughtException', (err) => {
  console.log('ERROR (uncaughtException) 💥 ', err.name, err.message);
  process.exit(1);
});

const app = require('./app');

let DB;
if (process.env.NODE_ENV === 'development') {
  DB = process.env.DATABASE_LOCAL;
} else if (process.env.NODE_ENV === 'production') {
  DB = process.env.DATABASE_ATLAS.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
  );
}

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() =>
    console.log(`connect to the ${process.env.NODE_ENV} DB successfully.`)
  );

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port: ${port} .`);
});

process.on('unhandledRejection', (err) => {
  console.log('ERROR (unhandledRejection) 💥 ', err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
