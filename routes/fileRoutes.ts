const express3 = require("express");
const fileController = require("../controllers/fileController");
const authControllerFile = require("../controllers/authController");
const uploadFile = require("../utils/fileUpload");

const routerFile = express3.Router();

routerFile.use(authControllerFile.protect);

routerFile.get(
  "/",
  authControllerFile.restrictTo("admin"),
  fileController.getAllFiles
);
routerFile.post(
  "/",
  // Make sure the field name in postman or name attribute in HTML form is "file" and matches the one below
  uploadFile.single("file"),
  fileController.addFile
);
routerFile.get("/:id", fileController.getFile);
routerFile.patch("/:id", fileController.updateFile);
routerFile.delete("/:id", fileController.deleteFile);

module.exports = routerFile;
