require("dotenv").config();

const config = {
  PORT: process.env.PORT || 3000,
  HOST_DB: process.env.HOST_DB,
  SECRET_KEY: process.env.SECRET_KEY,
  SERVER_HOST: process.env.SERVER_HOST || `http://localhost:3000`,
  UPLOAD_DIR_TMP: "tmp",
  UPLOAD_DIR_AVATARS: "public/avatars",
  VERIFIED_SENDER_EMAIL: process.env.VERIFIED_SENDER_EMAIL,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
};

module.exports = config;
