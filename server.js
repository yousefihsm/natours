const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

dotenv.config({ path: './config.env' });

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
app.listen(port, () => {
  console.log(`App running on port: ${port} .`);
});
