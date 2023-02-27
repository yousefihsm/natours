const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

/**
 * create token
 * @param {*} id
 * @returns
 */
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

/**
 * Send token to user
 * @param {*} user
 * @param {*} statusCode
 * @param {*} res
 */
const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token: token,
    user,
  });
};

/**
 * Signup
 * @param req
 * @param res
 */
exports.signup = catchAsync(async (req, res) => {
  const $user = await User.create(req.body);
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email($user, url).sendWelcome();
  createSendToken($user, 201, req, res);
});

// const removeProp = (obj, propToRemove) => {
//   const { [propToRemove]: removed, ...rest } = obj;
//   return rest;
// };

/**
 * Login
 * @param req
 * @param res
 * @param next
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400));
  }

  const $user = await User.findOne({ email }).select('+password');
  if (!$user || !(await $user.correctPassword(password, $user.password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  // const userWithoutPassword = removeProp($user._doc, 'password');
  createSendToken($user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

/**
 * Protect routes
 * @param req
 * @param res
 * @param next
 */
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError(
        'You are not logged in, to access the resources please first login.',
        401
      )
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const $user = await User.findById(decoded.id);
  if (!$user) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  if ($user.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. please login again.', 401)
    );
  }

  req.user = $user;
  res.locals.user = $user;
  next();
});

/**
 * Only for rendered pages, no errors.
 * @param req
 * @param res
 * @param next
 */
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      const $user = await User.findById(decoded.id);
      if (!$user) {
        return next();
      }

      if ($user.changePasswordAfter(decoded.iat)) {
        return next();
      }

      res.locals.user = $user;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

/**
 * Restrict user
 * @param  {...any} roles
 * @returns
 */
exports.restrictTo = function (...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};

/**
 * Forgot passwordand send the reset token to user email
 * @param req
 * @param res
 * @param next
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const $user = await User.findOne({ email: req.body.email });
  if (!$user) {
    return next(new AppError('There is no user with that email.', 404));
  }

  const resetToken = $user.createPasswordResetToken();
  await $user.save({ validateBeforeSave: false });

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email($user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to e-mail.',
    });
  } catch (err) {
    $user.passwordResetToken = undefined;
    $user.passwordResetExpires = undefined;
    await $user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error in sending email. try again later', 500)
    );
  }
});

/**
 * Reset the password
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
exports.resetPassword = async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const $user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!$user) {
    return next(new AppError('Token is invalid or has been expired.', 400));
  }

  $user.password = req.body.password;
  $user.passwordConfirm = req.body.passwordConfirm;
  $user.passwordResetToken = undefined;
  $user.passwordResetExpires = undefined;
  await $user.save();
  createSendToken($user, 200, req, res);
};

/**
 * Update the password
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
  const $user = await User.findById(req.user.id).select('+password');
  if (!$user) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  if (
    !(await $user.correctPassword(req.body.currentPassword, $user.password))
  ) {
    return next(
      new AppError(
        'current password entered is incorrect. please send the last password.',
        400
      )
    );
  }

  $user.password = req.body.newPassword;
  $user.passwordConfirm = req.body.newPasswordConfirm;
  //findByIdAndUpdate() will not work as indeed.
  await $user.save();
  createSendToken($user, 200, req, res);
});
