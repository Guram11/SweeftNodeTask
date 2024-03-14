const express4 = require("express");
const authControllerConsumer = require("../controllers/authController");
const consumerController = require("../controllers/consumerController");

const routerConsumer = express4.Router();

routerConsumer.use(authControllerConsumer.protect);

routerConsumer.get(
  "/",
  authControllerConsumer.restrictTo("admin"),
  consumerController.getAllConsumers
);
routerConsumer.post("/", consumerController.addConsumer);
routerConsumer.get("/:id", consumerController.getConsumer);
routerConsumer.patch("/:id", consumerController.updateConsumer);
routerConsumer.delete("/:id", consumerController.deleteConsumer);

module.exports = routerConsumer;
