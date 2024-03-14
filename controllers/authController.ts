const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const crypto = require("crypto");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const signToken = (id: any) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user: any, statusCode: any, req: any, res: any) => {
  const token = signToken(user.id);
  const expiresIn: any = process.env.JWT_COOKIE_EXPIRES_IN;

  res.cookie("jwt", token, {
    expires: new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  });

  // Remove password from output
  user.password = undefined;
  user.passwordConfirm = undefined;
  user.passwordChangedAt = undefined;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req: any, res: any, next: any) => {
  if (!validator.isEmail(req.body.email)) {
    return next(new AppError("Please provide a valid Email!", 400));
  }

  if (req.body.password !== req.body.passwordConfirm) {
    return next(
      new AppError("Password and passwordConfirm do not match each other!", 400)
    );
  }

  if (req.body.password.length < 8) {
    return next(
      new AppError("Password must be at least 8 characters long!", 400)
    );
  }

  try {
    const newUser = await prisma.company.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        password: await bcrypt.hash(req.body.password, 12),
        passwordConfirm: await bcrypt.hash(req.body.passwordConfirm, 12),
        country: req.body.country,
        industry: req.body.industry,
      },
    });

    const token = await prisma.token.create({
      data: {
        id: newUser.id,
        token: crypto.randomBytes(16).toString("hex"),
      },
    });

    const url = `${req.protocol}://${req.get("host")}/api/v1/users/${
      newUser.id
    }/verify/user/${token.token}`;

    await sendEmail(newUser.email, "verify email", url);
    res
      .status(201)
      .send({ message: "Please verify email, link is sent to your account" });
  } catch (err: any) {
    console.error("Error sending verification email:", err);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while sending verification email",
    });
  }
});

exports.login = catchAsync(async (req: any, res: any, next: any) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  // 2) Check if user exists && password is correct
  const company = await prisma.company.findUnique({
    where: {
      email,
    },
  });

  const employee = await prisma.employee.findUnique({
    where: {
      email,
    },
  });

  const user = company || employee;

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  if (!user.verified) {
    return next(new AppError("Given email in not verified!", 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, req, res);
});

exports.logout = (req: any, res: any) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

exports.protect = catchAsync(async (req: any, res: any, next: any) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const company = await prisma.company.findUnique({
    where: {
      id: decoded.id,
    },
  });

  const employee = await prisma.employee.findUnique({
    where: {
      id: decoded.id,
    },
  });

  const currentUser = company || employee;

  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  function changedPasswordAfter(JWTTimestamp: number) {
    if (currentUser?.passwordChangedAt) {
      const changedTimestamp = currentUser.passwordChangedAt.getTime() / 1000;
      10;

      return JWTTimestamp < changedTimestamp;
    }

    // False means NOT changed
    return false;
  }

  // 4) Check if user changed password after the token was issued
  if (changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.restrictTo = (...roles: any) => {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

exports.updatePassword = catchAsync(async (req: any, res: any, next: any) => {
  // 1) Get user from collection
  const user = await prisma.company.findUnique({
    where: {
      id: req.user.id,
    },
  });

  if (!user) {
    return next(new AppError("No user found with that Id!", 404));
  }

  // 2) Check if POSTed current password is correct
  if (!(await bcrypt.compare(req.body.passwordCurrent, user?.password))) {
    return next(new AppError("Your current password is wrong!", 401));
  }

  if (req.body.password !== req.body.passwordConfirm) {
    return next(
      new AppError("Password and passwordConfirm do not match each other!", 400)
    );
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  const updatedUser = await prisma.company.update({
    where: {
      id: req.user.id,
    },
    data: {
      password: await bcrypt.hash(req.body.password, 12),
      passwordConfirm: await bcrypt.hash(req.body.passwordConfirm, 12),
    },
  });

  // 4) Log user in, send JWT
  createSendToken(updatedUser, 200, req, res);
});

exports.logout = (req: any, res: any) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

exports.verifyEmail = async (req: any, res: any, next: any) => {
  const token = await prisma.token.findUnique({
    where: {
      token: req.params.token,
    },
  });

  if (!token) {
    return next(new AppError("Invalid verification token!"), 500);
  }

  const user = await prisma.company.update({
    where: {
      id: token.id,
    },
    data: {
      verified: true,
    },
  });

  return res.status(200).json({
    status: "success",
    data: {
      data: user,
    },
  });
};
