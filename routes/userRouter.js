const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");



router.route("/getUser").post(userController.getProfile);
router
  .route("/getApprovalRequestProfile")
  .post(userController.getApprovalRequestProfile);

router.route("/getUsers").post(userController.getUsers);

router.route("/verifyUserPassword").post(userController.verifyUserPassword);


router.route("/getAllRequests").post(userController.getAllUserProfileRequests);



router.route("/updateProfileImage").post(userController.updateProfileImage);
router.route("/deleteProfileImage").post(userController.deleteProfileImage);





module.exports = router;
