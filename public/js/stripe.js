/* eslint-disable */
import axios from 'axios';
import showAlert from './alerts';

var stripe = Stripe(
  'pk_test_51Mcr4MLEsqOvO4yuhWOtbApkV5uPx1tQJShoIhFVPOcy3yk0bMO0xA1bX1NgYi0qBAhdqyokGXByV847db7XrrX700PZ4ElqiR'
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get the checkout session from the API
    const session = await axios.get(
      `/api/v1/booking/checkout-session/${tourId}`
    );

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error: ' + err);
  }
};
