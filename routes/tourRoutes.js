const express = require('express');
const tourController = require('../controller/tourController');

const router = express.Router();

// router.param('id', tourController.checkID);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getTours);

router.route('/tour-stats').get(tourController.getTourState);
router.route('/montly-plan/:year').get(tourController.getMonthlyPlan);

// prettier-ignore
router
  .route('/')
  .get(tourController.getTours)
  .post(tourController.createTour); // tourController.checkBody,

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
