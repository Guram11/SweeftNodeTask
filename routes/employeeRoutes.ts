const express2 = require("express");
const employeeController = require("../controllers/employeeController");
const authControllerEmp = require("../controllers/authController");

const routerEmp = express2.Router();

routerEmp.get(
  "/:id/verify/employee/:token",
  employeeController.verifyEmployeeEmail
);

routerEmp.use(authControllerEmp.protect);

routerEmp.use(authControllerEmp.restrictTo("admin"));

routerEmp.get("/", employeeController.getAllEmployess);
routerEmp.post("/", employeeController.addEmployee);
routerEmp.get("/:id", employeeController.getEmployee);
routerEmp.patch("/:id", employeeController.updateEmployee);
routerEmp.delete("/:id", employeeController.deleteEmployee);

module.exports = routerEmp;
