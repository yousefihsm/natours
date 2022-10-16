const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name.'],
      unique: [true, 'A tour name dont be duplicated'],
      trim: true,
      maxLength: [40, 'A tour name must have 40 characters.'],
      minLength: [10, 'A tour name must have 10 characters.'],
      // validate: [
      //   validator.isAlpha,
      //   'The tour name should only include alphabets.',
      // ],
    },

    slug: String,

    duration: {
      type: Number,
      required: [true, 'A tour must have a duration.'],
    },

    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size.'],
    },

    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'the difficulty must be easy, medium, difficult',
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      max: [5.0, 'The tour ratingsAverage must be less than 5.0'],
      min: [1.0, 'The tour ratingsAverage must be above than 1.0'],
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },

    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price {VALUE} should be below regular price.',
      },
    },

    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary.'],
    },

    description: {
      type: String,
      trim: true,
    },

    imageCover: {
      type: String,
      required: [true, 'A tour must have a image cover.'],
    },

    images: [String],

    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },

    startDates: [Date],

    secretTour: {
      type: Boolean,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// DOCUMENT MIDDLEWARE
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true }); // this here means current document
  next();
});

/*
tourSchema.post('save', function (next) {
  console.log(this);
});
*/

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }); // this here means current query
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`query took ${Date.now() - this.start} milliseconds.`);
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
