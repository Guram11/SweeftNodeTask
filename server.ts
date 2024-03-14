import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const App = require("./app");

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception! Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

console.log(process.env.NODE_ENV);

prisma.$connect().then(() => {
  console.log("Connected to DB!");
});

const port = process.env.PORT || 3000;

const server = App.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on("unhandledRejection", (err: any) => {
  console.log(err.name, err.message);
  console.log("Unhandled rejection! Shutting down...");
  server.close(() => {
    process.exit(1);
  });
});
