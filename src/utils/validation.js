const validator = require("validator");

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

const validateEditProfile = (req) => {
  const allowedEditFields = ["age", "photo", "bio", "skills"];
  const bodyFields = Object.keys(req.body);

  if (bodyFields.length === 0) return false;

  return bodyFields.every((field) => allowedEditFields.includes(field));
};

const validatePasswordField = (req) => {
  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword) {
    return {
      valid: false,
      message: "Password and confirmPassword are required",
    };
  }

  if (newPassword !== confirmPassword) {
    return { valid: false, message: "Passwords do not match" };
  }

  if (
    !validator.isStrongPassword(newPassword, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
  ) {
    return {
      valid: false,
      message:
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
    };
  }

  return { valid: true };
};

const validateEmail = (email) => {
  return validator.isEmail(email);
};

const validateSignupPassword = (password) => {
  if (!password) {
    return {
      valid: false,
      message: "Password is required",
    };
  }

  if (
    !validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
  ) {
    return {
      valid: false,
      message:
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
    };
  }

  return { valid: true };
};

const validateInterestStatus = (status) => {
  const allowed = ["interested", "ignored"];

  if (!status) {
    throw new Error("status is required");
  }

  if (!allowed.includes(status.toLowerCase())) {
    throw new Error(`status: ${status} is not a valid interest status`);
  }

  return true; 
};


module.exports = {
  formatValidationErrors,
  validateEmail,
  validateEditProfile,
  validatePasswordField,
  validateSignupPassword,
  validateInterestStatus
};
