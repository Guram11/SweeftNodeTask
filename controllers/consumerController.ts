import { PrismaClient } from "@prisma/client";
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const prisma = new PrismaClient();

exports.getAllConsumers = catchAsync(async (req: any, res: any, next: any) => {
  const consumers = await prisma.consumer.findMany();

  res.status(201).json({
    status: "success",
    data: {
      data: consumers,
    },
  });
});

exports.getConsumer = catchAsync(async (req: any, res: any, next: any) => {
  const consumer = await prisma.consumer.findUnique({
    where: {
      id: req.params.id,
    },
  });

  if (!consumer) {
    return next(new AppError("No consumer found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      data: consumer,
    },
  });
});

exports.updateConsumer = catchAsync(async (req: any, res: any, next: any) => {
  const consumer = await prisma.consumer.update({
    where: {
      id: req.params.id,
    },
    data: req.body,
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.deleteConsumer = catchAsync(async (req: any, res: any, next: any) => {
  const consumer = await prisma.consumer.delete({
    where: {
      id: req.params.id,
    },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.addConsumer = catchAsync(async (req: any, res: any, next: any) => {
  const company = await prisma.company.findUnique({
    where: {
      email: req.user.email,
    },
    include: {
      consumers: true,
    },
  });

  if (!company) {
    return next(new AppError("No company found with that ID", 404));
  }

  if (company.subscription === "free" && company.consumers.length === 1) {
    return next(
      new AppError(
        "Please upgrade your subscription plan to add more consumers!",
        400
      )
    );
  }

  if (company.subscription === "basic" && company.consumers.length === 10) {
    return next(
      new AppError(
        "Please upgrade your subscription plan to add more consumers!",
        400
      )
    );
  }

  const newConsumer = await prisma.consumer.create({
    data: {
      name: req.body.name,
      email: req.body.email,
      companyId: company.id,
    },
  });

  res.status(201).json({
    status: "success",
    data: {
      data: newConsumer,
    },
  });
});
