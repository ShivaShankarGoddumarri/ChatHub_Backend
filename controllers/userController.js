const { authSchema } = require("../helpers/validations");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signEmailOTpToken,
  verifyEmailOtpToken,
} = require("../helpers/jwt_helpers");
const User = require("../models/UserModel");
const dotenv = require("dotenv");
const Userverify = require("../models/OtpModel");
dotenv.config({ path: "../config.env" });
const twilio = require("twilio");
const UserUpdate = require("../models/UpdateApproval");
const cloudinary = require("../helpers/UploadImage");
const Notification = require("../models/NotificationModel");
const send_Notification_mail = require("../helpers/EmailSending");

exports.getProfile = async (req, res, next) => {
  try {
    const { id } = req.body;
    const userDoesExist = await User.findOne(
      { _id: id },
      { password: 0, chatBlockedBy: 0 }
    )

    // console.log(removePass);
    if (userDoesExist) {
      return res.status(200).json(userDoesExist);
    }
  } catch (error) {
    console.log(error);
  }
};

exports.getApprovalRequestProfile = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const userDoesExist = await UserUpdate.findOne({ _id: userId }, { password: 0 }).populate({
      path: "userInfo",
      select: ["userName", "image", "role", "email"],
    });;

    if (userDoesExist) {
      return res.status(200).json(userDoesExist);
    } else {
      return res.status(400).json("No User Found for request");
    }
  } catch (error) {
    console.log(error);
  }
};




exports.verifyUserPassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // validating email and password
    const validating_email_password = await authSchema.validateAsync(req.body);

    // Checking user already exist or not
    const userDoesExist = await User.findOne({ email: email });
    if (!userDoesExist) {
      return res.status(404).json({ message: "User not found" });
    }

    // comparing password
    if (
      !(await bcrypt.compare(
        validating_email_password.password,
        userDoesExist.password
      ))
    ) {
      return res.status(404).json({ message: "Entered password is wrong" });
    } else {
      return res.send({ message: "Password verification" });
    }
  } catch (err) {
    if (err.isJoi == true) err.status = 422;
    next(err);
  }
};

exports.updateProfileImage = async (req, res, next) => {
  try {
    const { image, userId, email } = req.body;
    const userDoesExist = await User.findOne({ _id: userId });
    if (!userDoesExist) {
      return res.status(400).send("User not found");
    }
    if (userDoesExist.image.public_id !== undefined) {
      await cloudinary.uploader.destroy(
        userDoesExist.image.public_id,
        (error, result) => {
          if (error) {
            console.error("Error deleting image:", error);
          } else {
            console.log("Image deleted successfully:", result);
          }
        }
      );
    }
    const result = await cloudinary.uploader.upload(image, {
      folder: `${email}`,
    });
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          image: {
            public_id: result.public_id,
            url: result.secure_url,
          },
        },
      }
    );
    const accessToken = await signAccessToken(
      {
        email: userDoesExist.email,
        coins: userDoesExist.coins,
        documents: userDoesExist.documents,
        user_id: userDoesExist._id,
        role: userDoesExist.role,
        userName: userDoesExist.userName,
        image: result.secure_url,
        verification: userDoesExist.verification,
      },
      `${userDoesExist._id}`
    );
    const refreshToken = await signRefreshToken(
      { email: userDoesExist.email, _id: userDoesExist._id },
      `${userDoesExist._id}`
    );

    return res.send({ accessToken: accessToken, refreshToken: refreshToken });
  } catch (err) {
    console.log(err);
    return res.status(400).json("Error while updating profile");
  }
};

exports.deleteProfileImage = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const userDoesExist = await User.findOne({ _id: userId });
    if (!userDoesExist) {
      return res.status(400).send("User not found");
    }
    if (userDoesExist.image.public_id !== undefined) {
      await cloudinary.uploader.destroy(
        userDoesExist.image.public_id,
        (error, result) => {
          if (error) {
            console.error("Error deleting image:", error);
          } else {
            console.log("Image deleted successfully:", result);
          }
        }
      );
    }
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          image: "",
        },
      }
    );
    const accessToken = await signAccessToken(
      {
        email: userDoesExist.email,
        coins: userDoesExist.coins,
        documents: userDoesExist.documents,
        user_id: userDoesExist._id,
        role: userDoesExist.role,
        userName: userDoesExist.userName,
        verification: userDoesExist.verification,
        image: "",
      },
      `${userDoesExist._id}`
    );
    const refreshToken = await signRefreshToken(
      { email: userDoesExist.email, _id: userDoesExist._id },
      `${userDoesExist._id}`
    );

    return res.send({ accessToken: accessToken, refreshToken: refreshToken });
  } catch (err) {
    console.log(err);
    return res.status(400).json("Error while updating profile");
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { type } = req.body;
    if (type !== "") {
      let result = await User.find(
        { role: type },
        { projection: { password: 0 } }
      );
      return res.status(200).json(result);
    } else {
      let result = await User.find({}, { password: 0 });
      return res.status(200).json(result);
    }
  } catch (err) {
    return res.status(400).json("Error while fetching");
  }
};

exports.getAllUserProfileRequests = async (req, res, next) => {
  try {
    const { filters } = req.body;
    const result = await UserUpdate.find().populate({
      path: "userInfo",
      select: ["userName", "image", "role"],
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json("Error while fetching");
  }
};



