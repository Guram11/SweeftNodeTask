const express1 = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express1.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.get("/:id/verify/user/:token", authController.verifyEmail);

// router.post("/forgotPassword", authController.forgotPassword);
// router.patch("/resetPassword/:token", authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch("/updateMyPassword", authController.updatePassword);
router.get("/me", userController.getMe, userController.getCompany);
router.patch("/updateMe", userController.updateMe);
router.delete("/deleteMe", userController.deleteMe);

// Restrict access
router.use(authController.restrictTo("admin"));

router.get("/billing", userController.getBilling);
router.get("/upgrade", userController.upgradeSubscription);
router.get("/downgrade", userController.downgradeSubscription);

router.route("/").get(userController.getAllCompanies);

router
  .route("/:id")
  .get(userController.getCompany)
  .patch(userController.updateCompany)
  .delete(userController.deleteCompany);

module.exports = router;
