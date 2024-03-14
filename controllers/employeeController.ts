import { PrismaClient } from "@prisma/client";
const catchAsync = require("../utils/catchAsync");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const AppError = require("../utils/appError");
const multer = require("multer");

const multerStorage = multer.memoryStorage();

const multerFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadFile = upload.single("file");

const prisma = new PrismaClient();

exports.getAllEmployess = catchAsync(async (req: any, res: any, next: any) => {
  const users = await prisma.employee.findMany();

  res.status(201).json({
    status: "success",
    data: {
      data: users,
    },
  });
});

exports.getEmployee = catchAsync(async (req: any, res: any, next: any) => {
  const user = await prisma.employee.findUnique({
    where: {
      id: req.params.id,
    },
    include: {
      company: true,
      File: true,
    },
  });

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      data: user,
    },
  });
});

exports.updateEmployee = catchAsync(async (req: any, res: any, next: any) => {
  const user = await prisma.employee.update({
    where: {
      id: req.params.id,
    },
    data: req.body,
  });

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      data: user,
    },
  });
});

exports.deleteEmployee = catchAsync(async (req: any, res: any, next: any) => {
  const user = await prisma.employee.delete({
    where: {
      id: req.params.id,
    },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.addEmployee = catchAsync(async (req: any, res: any, next: any) => {
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

  // try {
  const newEmployee = await prisma.employee.create({
    data: {
      name: req.body.name,
      email: req.body.email,
      password: await bcrypt.hash(req.body.password, 12),
      passwordConfirm: await bcrypt.hash(req.body.passwordConfirm, 12),
      companyId: req.user.id,
    },
  });

  const token = await prisma.token.create({
    data: {
      id: newEmployee.id,
      token: crypto.randomBytes(16).toString("hex"),
    },
  });

  const url = `${req.protocol}://${req.get("host")}/api/v1/employees/${
    newEmployee.id
  }/verify/employee/${token.token}`;

  await sendEmail(newEmployee.email, "verify email", url);
  res
    .status(201)
    .send({ message: "Please verify email, link is sent to your account" });
});

exports.verifyEmployeeEmail = async (req: any, res: any, next: any) => {
  const token = await prisma.token.findUnique({
    where: {
      token: req.params.token,
    },
  });

  if (!token) {
    return next(new AppError("Invalid verification token!"), 500);
  }

  const employee = await prisma.employee.update({
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
      data: employee,
    },
  });
};
