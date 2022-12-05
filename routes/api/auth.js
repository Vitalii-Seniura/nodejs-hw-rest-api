const express = require("express");
const { tryCatchWrapper } = require("../../middleware");
const {
  login,
  logout,
  signup,
  verify,
  repeatVerify,
  getCurrent,
  subscriptionStatusUpdate,
  avatarUpdate,
} = require("../../controllers/auth.controller");
const { validation, auth, upload } = require("../../middleware");
const {
  userAuthSchema,
  subscriptionStatusSchema,
  userRepeatVerificationSchema,
} = require("../../validationSchemas");

const router = express.Router();

router.post("/signup", validation(userAuthSchema), tryCatchWrapper(signup));
router.get("/verify/:verificationToken", tryCatchWrapper(verify));
router.post(
  "/verify",
  validation(userRepeatVerificationSchema),
  tryCatchWrapper(repeatVerify)
);
router.post("/login", validation(userAuthSchema), tryCatchWrapper(login));
router.get("/current", auth, tryCatchWrapper(getCurrent));
router.get("/logout", auth, tryCatchWrapper(logout));
router.patch(
  "/",
  auth,
  validation(subscriptionStatusSchema),
  tryCatchWrapper(subscriptionStatusUpdate)
);
router.patch(
  "/avatars",
  auth,
  tryCatchWrapper(upload.single("avatar")),
  tryCatchWrapper(avatarUpdate)
);

module.exports = router;
