const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const factory = require('./factoryHandler');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const api_key =
  process.env.STRIPE_SECRET_KEY ||
  'sk_test_51Mcr4MLEsqOvO4yuelw7opWSGSvPI7IDLtxtB796iymQQWbgXwGXs5gDMwSdVEna69NbIesSqbTfkYsPzYJr5ARP00EFKcGpiL';
const stripe = require('stripe')(api_key);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const $tour = await Tour.findById(req.params.tourId);

  // 2) Create a new checkout session
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: $tour.price * 100,
          product_data: {
            name: `${$tour.name} Tour`,
            description: $tour.summary,
            images: [
              `https://media.tacdn.com/media/attractions-splice-spp-674x446/0a/00/1a/52.jpg`,
            ],
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${$tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${$tour.slug}`,
    client_reference_id: req.params.tourId,
    customer_email: req.user.email,
  });

  // 3) Send the new checkout session to the client
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPRARY, because it is UNSECURE: everyone can create a booking without paying.
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
