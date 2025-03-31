import { validationResult } from "express-validator";

/**
 *error generator function
 * @param {string} message -error message
 * @param {number} status - error status code
 * @returns error object
 */
const customError = (message, status) => {
    const error = new Error(message);
    error.status = status;
    return error;

};


/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error); // forward error to error handler
};


/**
* Custom default middleware for handling errors
*/
const errorHandler = (err, req, res, next) => {
  res.status(err.status || 500); // default is 500 if err.status is not defined
  res.json({
      message: err.message,
      status: err.status || 500,
      errors: err.errors,
    
  });
};

/*
* Custom middleware for handling and formatting validation errors
* @param {object} req - request object
* @param {object} res - response object
* @param {function} next - next function
* @return {*} next function call
*/
const validationErrorHandler = (req, res, next) => {
  const errors = validationResult(req, {strictParams: ['body']});
  if (!errors.isEmpty()) {
    // console.log('validation errors', errors.array({onlyFirstError: true}));
    const error = new Error('bad request');
    error.status = 400;
    error.errors = errors.array({onlyFirstError: true}).map((error) => {
      return {field: error.path, message: error.msg};
    });
    return next(error);
  }
  next();
};

export {notFoundHandler, errorHandler, validationErrorHandler, customError};

