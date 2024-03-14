import { PrismaClient } from "@prisma/client";
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { DateTime } = require("luxon");

const prisma = new PrismaClient();

const filterObj = (obj: any, ...allowedFields: any) => {
  const newObj: any = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllCompanies = catchAsync(async (req: any, res: any, next: any) => {
  const users = await prisma.company.findMany();

  res.status(201).json({
    status: "success",
    data: {
      data: users,
    },
  });
});

exports.getCompany = catchAsync(async (req: any, res: any, next: any) => {
  const user = await prisma.company.findUnique({
    where: {
      id: req.params.id,
    },
    include: {
      employees: true,
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

exports.getMe = (req: any, res: any, next: any) => {
  req.params.id = req.user.id;
  next();
};

exports.updateCompany = catchAsync(async (req: any, res: any, next: any) => {
  const user = await prisma.company.update({
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

exports.updateMe = catchAsync(async (req: any, res: any, next: any) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(
    req.body,
    "name",
    "email",
    "country",
    "industry"
  );

  // 3) Update user document
  const updatedUser = await prisma.company.update({
    where: {
      id: req.user.id,
    },
    data: req.body,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteCompany = catchAsync(async (req: any, res: any, next: any) => {
  const user = await prisma.company.delete({
    where: {
      id: req.params.id,
    },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.deleteMe = catchAsync(async (req: any, res: any, next: any) => {
  const user = await prisma.company.delete({
    where: {
      id: req.user.id,
    },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getBilling = catchAsync(async (req: any, res: any, next: any) => {
  const user = await prisma.company.findUnique({
    where: {
      email: req.user.email,
    },
    include: {
      File: true,
      consumers: true,
    },
  });

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  let message;

  if (
    user.subscription === "free" &&
    user.File.length <= 10 &&
    user.consumers.length <= 1
  ) {
    message = "Your billing for this month: 0$";
  }

  if (
    user.subscription === "basic" &&
    user.File.length <= 100 &&
    user.consumers.length <= 10
  ) {
    message = `Your billing for this month: ${user.consumers.length * 5}$`;
  }

  if (user.subscription === "premium") {
    if (user.File.length <= 1000) {
      message = `Your billing for this month: 300$`;
    } else {
      message = `Your billing for this month: ${
        300 + (user.File.length - 1000) * 0.5
      }$`;
    }
  }

  let paymentDate;

  if (user.subscriptionChangedAt) {
    const date = new Date(
      `${user.subscriptionChangedAt.getFullYear()}-${
        user.subscriptionChangedAt.getMonth() + 1
      }-${user.subscriptionChangedAt.getDate()}`
    );

    paymentDate = DateTime.fromJSDate(new Date(date))
      .plus({ months: 1 })
      .toJSDate();
  } else {
    if (user.registeredAt)
      paymentDate = DateTime.fromJSDate(
        new Date(
          `${user.registeredAt.getFullYear()}-${
            user.registeredAt.getMonth() + 1
          }-${user.registeredAt.getDate()}`
        )
      )
        .plus({ months: 1 })
        .toJSDate();
  }

  res.status(200).json({
    status: "success",
    data: {
      message: `${message}. Next payment is due: ${paymentDate}`,
    },
  });
});

exports.downgradeSubscription = catchAsync(
  async (req: any, res: any, next: any) => {
    const user = await prisma.company.findUnique({
      where: {
        email: req.user.email,
      },
      include: {
        consumers: true,
        File: true,
      },
    });

    if (!user) {
      return next(new AppError("No user found with that ID", 404));
    }

    if (user.subscription === "free") {
      return next(
        new AppError("You can not downgrade free subscription plan!", 404)
      );
    }

    if (
      user.subscription === "basic" &&
      (user.consumers.length > 1 || user.File.length > 100)
    ) {
      return next(
        new AppError(
          "You can not downgrade current subscription plan! Remove files or consumers to be able to perform this action",
          404
        )
      );
    }

    if (
      user.subscription === "premium" &&
      (user.consumers.length > 10 || user.File.length > 1000)
    ) {
      return next(
        new AppError(
          "You can not downgrade current subscription plan! Remove files or consumers to be able to perform this action",
          404
        )
      );
    }

    let subscription: any;

    if (user.subscription === "basic") {
      subscription = "free";
    } else {
      subscription = "basic";
    }

    const company = await prisma.company.update({
      where: {
        id: req.user.id,
      },
      data: {
        subscription,
        subscriptionChangedAt: new Date(Date.now()),
      },
    });

    res.status(200).json({
      status: "success",
      message: "Your subscription plan has been downgraded",
      data: {
        data: company,
      },
    });
  }
);

exports.upgradeSubscription = catchAsync(
  async (req: any, res: any, next: any) => {
    const user = await prisma.company.findUnique({
      where: {
        email: req.user.email,
      },
    });

    if (!user) {
      return next(new AppError("No user found with that ID", 404));
    }

    if (user.subscription === "premium") {
      return next(
        new AppError("You can not upgrade premium subscription plan!", 404)
      );
    }

    let subscription: any;

    if (user.subscription === "free") {
      subscription = "basic";
    } else {
      subscription = "premium";
    }

    const company = await prisma.company.update({
      where: {
        id: req.user.id,
      },
      data: {
        subscription,
        subscriptionChangedAt: new Date(Date.now()),
      },
    });

    res.status(200).json({
      status: "success",
      message: "Your subscription plan has been upgraded",
      data: {
        data: company,
      },
    });
  }
);
