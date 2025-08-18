const validator = require("validator");

/**
 * Format mongoose validation + duplicate errors
 */
const formatValidationErrors = (err) => {
  if (err.name === "ValidationError") {
    return Object.keys(err.errors).map(
      (field) => `${field}: ${err.errors[field].message}`
    );
  }

  if (err.code === 11000) {
    return [
      `Duplicate value for field: ${Object.keys(err.keyValue).join(", ")}`,
    ];
  }

  return ["Something went wrong"];
};

//Email Validation
const validateEmail = (email) => {
  return validator.isEmail(email);
};

module.exports = {
  formatValidationErrors,
  validateEmail,
};
