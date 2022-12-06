const jwt = require("jsonwebtoken");
const fs = require("fs/promises");
const path = require("path");

const { User } = require("../models");
const {
  createConflictError,
  createAuthError,
  createCustomError,
  createNotFoundHttpError,
} = require("../helpers/errorHelpers");
const { avatarResize } = require("../helpers/avatarResize");
const { sendVerificationMail } = require("../helpers/mailSender");

const { SECRET_KEY, SERVER_HOST, UPLOAD_DIR_AVATARS } = require("../config");

const signup = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    return next(createConflictError());
  }

  const { email, subscription, verificationToken } = await User.create(
    req.body
  );

  sendVerificationMail({ email, verificationToken });
  return res.status(201).json({
    user: { email, subscription },
  });
};

const verify = async (req, res, next) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });

  if (!user) {
    return next(createCustomError(404, "User not found"));
  }

  const verifiedUser = await User.findByIdAndUpdate(
    user._id,
    { verificationToken: null, verify: true },
    { new: true }
  );

  if (!verifiedUser) {
    return next(
      createCustomError(
        500,
        `Something wrong! Can't update user with ID ${user._id}`
      )
    );
  }

  return res.status(200).json({
    message: "Verification successful!",
  });
};

const repeatVerify = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return next(createNotFoundHttpError());
  }

  if (user.verify) {
    return next(createCustomError(400, "Verification has already been passed"));
  }

  sendVerificationMail({
    email,
    verificationToken: user.verificationToken,
    isRepeat: true,
  });
  return res.status(200).json({
    message: "Verification email sent",
  });
};

const login = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user || !user.comparePassword(req.body.password)) {
    return next(createAuthError("Email or password is wrong"));
  }

  if (!user.verify) {
    return next(createAuthError("User not verified"));
  }

  const { _id, email, subscription } = user;
  const result = jwt.sign({ userId: _id }, SECRET_KEY, { expiresIn: "1h" });

  const { token } = await User.findByIdAndUpdate(
    _id,
    { token: result },
    { new: true }
  );

  if (!token) {
    return next(createCustomError());
  }

  return res.status(200).json({
    token,
    user: { email, subscription },
  });
};

const logout = async (req, res, next) => {
  const { _id, token } = req.user;

  if (!token) {
    return res.status(204).json();
  }

  const result = await User.findByIdAndUpdate(
    _id,
    { token: null },
    { new: true }
  );

  if (!result) {
    return next(createCustomError());
  }

  return res.status(204).json();
};

const getCurrent = async (req, res, next) => {
  const { token, email, subscription, avatarURL } = req.user;

  return res.status(200).json({
    token,
    user: { email, subscription, avatarURL },
  });
};

const subscriptionStatusUpdate = async (req, res, next) => {
  const { _id, email } = req.user;

  const { subscription } = req.body;
  const user = await User.findByIdAndUpdate(
    _id,
    { subscription },
    { new: true }
  );

  if (!user) {
    return next(createCustomError());
  }

  return res.status(200).json({ user: { email, subscription } });
};

const avatarUpdate = async (req, res, next) => {
  const {
    user: { _id },
    file,
  } = req;
  const avatarDirPath = path.join(__dirname, "../", UPLOAD_DIR_AVATARS);

  try {
    await avatarResize({ file, size: 250 });
    await fs.rename(file.path, path.join(avatarDirPath, file.filename));

    const user = await User.findByIdAndUpdate(
      _id,
      { avatarURL: encodeURI(`${SERVER_HOST}/avatars/${file.filename}`) },
      { new: true }
    );
    return res.status(201).json({ avatarURL: user.avatarURL });
  } catch (err) {
    await fs.unlink(file.path);
    throw createCustomError(500, `File not saved. Error: ${err.message}`);
  }
};

module.exports = {
  login,
  logout,
  signup,
  verify,
  repeatVerify,
  getCurrent,
  subscriptionStatusUpdate,
  avatarUpdate,
};
