const Tour = require('../models/tourModel');
const User = require('../models/userModel');
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
              `${req.protocol}://${req.get('host')}/img/tours/${
                $tour.imageCover
              }`,
            ],
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    // success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${$tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
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

/* exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPRARY, because it is UNSECURE: everyone can create a booking without paying.
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
}); */

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = await User.findOne({ email: session.customer_email });
  const price = session.display_items[0].unit_amount / 100;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object);
  }
  res.status(200).json({ received: true });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
