const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");

const globalErrorHandler = require("./controllers/errorController");
const appError1 = require("./utils/appError");
const userRouter = require("./routes/userRoutes");
const employeeRouter = require("./routes/employeeRoutes");
const fileRouter = require("./routes/fileRoutes");
const consumerRouter = require("./routes/consumerRoutes");

const app = express();

app.use("/uploads/files", express.static(path.join("uploads", "files")));

app.use(cors());

app.options("*", cors());

app.use(helmet());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});

app.use("/api", limiter);

app.use(express.json({ limit: "10kb" }));

app.use(cookieParser());

app.use(xss());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/employees", employeeRouter);
app.use("/api/v1/files", fileRouter);
app.use("/api/v1/consumers", consumerRouter);

app.all("*", (req: any, res: any, next: any) => {
  if (req.file) {
    fs.unlink(req.file.path, (err: any) => {
      console.log(err);
    });
  }

  next(new appError1(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
