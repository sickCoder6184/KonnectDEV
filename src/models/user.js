const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Helpers (minimal, targeted)
const capitalizeFirst = (v) => {
  if (!v || typeof v !== 'string') return v;
  return v.charAt(0).toUpperCase() + v.slice(1);
};

// User Schema
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters long"],
      maxlength: [50, "First name must not exceed 50 characters"],
      validate: {
        validator: function (value) {
          return validator.isAlpha(value.replace(/\s/g, ""));
        },
        message: "First name should only contain alphabetic characters",
      },
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters long"],
      maxlength: [50, "Last name must not exceed 50 characters"],
      validate: {
        validator: function (value) {
          return validator.isAlpha(value.replace(/\s/g, ""));
        },
        message: "Last name should only contain alphabetic characters",
      },
    },
    emailId: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: "Please provide a valid email address",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      validate: {
        validator: function (value) {
          return validator.isStrongPassword(value, {
            minLength: 6,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 0,
          });
        },
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      },
    },
    age: {
      type: Number,
      min: [18, "Age must be at least 18"],
      max: [60, "Age must be less than or equalto 60"],
      validate: {
        validator: function (value) {
          return (
            value === undefined ||
            validator.isInt(value.toString(), { min: 18, max: 60 })
          );
        },
        message: "Age must be a valid integer between 18 and 60",
      },
      required: [true, "Age is Required"],
    },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "others"],
        message: "Gender must be either male, female, or others",
      },
      required: [true, "Gender is required"],
      set: (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v), // store normalized lowercase
      get: (v) => capitalizeFirst(v), // output capitalized (Male/Female/Others)
    },
    photo: {
      type: String,
      default:
        "https://www.upay.org.in/wp-content/uploads/2016/08/dummy-prod-1.jpg",
      validate: {
        validator: function (value) {
          return (
            !value ||
            validator.isURL(value, {
              protocols: ["http", "https"],
              require_protocol: true,
            })
          );
        },
        message: "Photo must be a valid URL",
      },
    },
    bio: {
      type: String,
      maxlength: [200, "Bio must not exceed 200 characters"],
      trim: true,
      default: "hi this is my bio",
      validate: {
        validator: function (value) {
          return !value || validator.isLength(value, { min: 0, max: 200 });
        },
        message: "Bio must not exceed 200 characters",
      },
    },
    skills: {
      type: [String],
      validate: {
        validator: function (arr) {
          return (
            arr.every(
              (skill) =>
                typeof skill === "string" &&
                skill.trim().length > 0 &&
                validator.isLength(skill.trim(), { min: 1, max: 50 })
            ) && arr.length <= 10
          );
        },
        message:
          "You can only add up to 10 valid skills, each skill must be 1-50 characters long",
      },
      default: [],
    },
  },
  { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } } // enable getters in outputs
);

userSchema.methods.getJWT = function () {
  // "this" keyword will not work with arrow function
  const user = this;

  const token = jwt.sign({ _id: user._id }, "Secret_key@123", {
    expiresIn: "7d",
  });

  return token;
};

userSchema.methods.validatePassword = async function (passwordInputByUser) {
  const user = this;
  const passwordHash = user.password;

  const isValidPassword = await bcrypt.compare(
    passwordInputByUser,
    passwordHash
  );

  return isValidPassword;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
