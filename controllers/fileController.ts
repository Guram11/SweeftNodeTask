import { PrismaClient } from "@prisma/client";
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const prisma = new PrismaClient();

exports.getAllFiles = catchAsync(async (req: any, res: any, next: any) => {
  const files = await prisma.file.findMany();

  res.status(201).json({
    status: "success",
    data: {
      data: files,
    },
  });
});

exports.getFile = catchAsync(async (req: any, res: any, next: any) => {
  const file = await prisma.file.findUnique({
    where: {
      id: req.params.id,
    },
    include: {
      employee: true,
    },
  });

  if (!file) {
    return next(new AppError("No file found with that ID", 404));
  }

  if (req.user.email === file.employee.email) {
    res.status(200).json({
      status: "success",
      data: {
        data: file,
      },
    });
  }

  if (
    file.availableTo.length > 0 &&
    !file.availableTo.includes(req.user.email)
  ) {
    return next(new AppError("You do not have access to this file", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      data: file,
    },
  });
});

exports.updateFile = catchAsync(async (req: any, res: any, next: any) => {
  const file = await prisma.file.update({
    where: {
      id: req.params.id,
    },
    data: req.body,
    include: {
      employee: true,
    },
  });

  if (!file) {
    return next(new AppError("No file found with that ID!", 404));
  }

  if (req.user.role === "admin" || req.user.email === file.employee.email) {
    res.status(200).json({
      status: "success",
      data: {
        data: file,
      },
    });
  } else {
    return next(
      new AppError("You don't have permission to update this file!", 404)
    );
  }
});

exports.deleteFile = catchAsync(async (req: any, res: any, next: any) => {
  const file = await prisma.file.delete({
    where: {
      id: req.params.id,
    },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.addFile = catchAsync(async (req: any, res: any, next: any) => {
  const company = await prisma.company.findUnique({
    where: {
      id: req.user.companyId,
    },
    include: {
      File: true,
    },
  });

  if (!company) {
    return next(new AppError("No company found with that ID", 404));
  }

  if (company.subscription === "free" && company.File.length === 10) {
    return next(
      new AppError(
        "Please upgrade your subscription plan to add more files!",
        400
      )
    );
  }

  if (company.subscription === "basic" && company.File.length === 100) {
    return next(
      new AppError(
        "Please upgrade your subscription plan to add more files!",
        400
      )
    );
  }

  const newFile = await prisma.file.create({
    data: {
      name: req.body.name,
      employeeId: req.user.id,
      companyId: req.user.companyId,
      path: req.file.path,

      // Add emails of all employees who should have access to this file
      // It's available to all by default
      // Make sure that "Key" field in Postman form-data has the name - "availableTo[]" when testing
      // Add multiple "Key" fields with the same name - "availableTo[]" to add multiple emails to an array
      availableTo: req.body.availableTo,
    },
  });

  res.status(201).json({
    status: "success",
    data: {
      data: newFile,
    },
  });
});
