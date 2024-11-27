const userModel = require("../../../Database/models/User.model.js");
const tokenModel = require("../../../Database/models/token.model");
const crypto = require('crypto');
const { sendEmail } = require('../../utils/sendEmail.js')
const { forgetPASS, signUpTemp } = require('../../utils/htmlTemplets.js')
const jwt = require("jsonwebtoken");
const Randomstring = require('randomstring');
const slugify = require("slugify");
const { compare, hash } = require('../../utils/HashAndCompare.js')
const { OAuth2Client } = require('google-auth-library')
const { customAlphabet } = require('nanoid')
const http = require('../../folderS,F,E/S,F,E.JS');
const { First, Second, Third } = require('../../utils/httperespons');


// ? Referesh Token Access Token
const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await userModel.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    return { accessToken, refreshToken }
  } catch (error) {
    console.error(error);
    return Third(res, "Something went wrong while generating referesh and access token", 500, http.ERROR);
  }
}

// ? SignUP
const SignUP = async (req, res, next) => {
  try {
    // data from request
    const { userName, email, password } = req.body;
    // check user existence
    const isUser = await userModel.findOne({
      $or: [
        { userName },
        { email }
      ]
    });
    if (isUser) {
      return First(res, "User already registered with this username or email", 409, http.FAIL);
    }
    //generate activationcode
    const activationCode = crypto.randomBytes(64).toString("hex");
    const uniqueNumber = Randomstring.generate({
      length: 1,
      charset: 'numeric',
    });
    const Alphabetic = Randomstring.generate({
      length: 1,
      charset: 'alphabetic',
    });

    // create user
    const user = await userModel.create({
      userName: slugify(`${userName}-${uniqueNumber}${Alphabetic}`),
      email,
      password,
      activationCode
    });

    // create link confirmEmail
    const link = signUpTemp(`${req.protocol}://${req.headers.host}/api/user/confirmEmail/${activationCode}`)
    if (
      !sendEmail({
        to: user.email,
        subject: "Confirmation Email",
        text: "Please Click The Below Link To Confirm Your Email",
        html: link,
      })
    )
      return First(res, "Something went wrong while sending email", 400, http.FAIL);

    //response
    return Second(res, "please review your Email", 200, http.SUCCESS);
  } catch (error) {
    console.error(error);
    return Third(res, "Internal Server Error", 500, http.ERROR);
  }
};

// ? Active Account
const ActivationAccount = async (req, res) => {
  try {
    // find user , update isconfirmed ,  delete activationCode
    const user = await userModel.findOneAndUpdate(
      {
        activationCode: req.params.activationCode
      },
      { isConfirmed: true, $unset: { activationCode: 1 } }
    );
    if (!user)
      return First(res, "user not found!", 404, http.FAIL);

    return Second(res, "Done activate account , try to login now", 200, http.SUCCESS);
  } catch (error) {
    console.error(error);
    return Third(res, "Internal Server Error", 500, http.ERROR);
  }
};

// ? SignIn
const SignIn = async (req, res, next) => {
  try {
    const { userName, password } = req.body;

    // Validate input
    if (!userName || !password) {
      return First(res, "Username and password are required", 400, http.FAIL);
    }

    // Check if user exists
    const user = await userModel.findOne({ userName });
    if (!user) {
      return First(res, "This user does not exist", 404, http.FAIL);
    }

    // Check if account is confirmed
    if (!user.isConfirmed) {
      return First(res, "This account is inactive. Please confirm your email.", 400, http.FAIL);
    }

    // Validate password
    const isPasswordValid = user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return First(res, "Invalid username or password", 401, http.FAIL);
    }

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Update user data
    user.refreshToken = refreshToken;
    user.accessToken = accessToken;
    user.agent = req.headers["user-agent"];
    user.status = "online";
    await user.save();

    // Optional: Save access token to a token model (if needed)
    await tokenModel.create({ token: accessToken, user: user._id, isValied: true });

    // Remove sensitive fields from the response
    const loggedInUser = await userModel
      .findById(user._id)
      .select("-password -refreshToken");

    // Send response
    return Second(res, [{
      message: "User logged in successfully",
      user: loggedInUser,
      accessToken,
      refreshToken,
    }], 200, http.SUCCESS);
  } catch (error) {
    console.error(error);
    return Third(res, "Internal Server Error", 500, http.ERROR);
  }
};

// ? signupOrloginWithGamil
const SignupOrloginWithGmail = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    // Check if idToken exists
    if (!idToken) {
      return First(res, "ID Token is required", 400, http.FAIL);
    }

    // Initialize OAuth client
    const client = new OAuth2Client(process.env.CLIENT_ID);

    // Verify the token
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      console.error("Token verification error:", err);
      return res.status(400).json({ message: "Invalid or expired ID Token" });
    }

    // Extract user data
    const { email, email_verified, name, picture } = payload;

    // Check email verification
    if (!email_verified) {
      return First(res, "Email not verified", 400, http.FAIL);
    }

    // Check if the user exists in the database
    const existingUser = await userModel.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      // If user exists, ensure the provider is Google
      if (existingUser.provider !== "GOOGLE") {
        return First(res, "This email is registered with a different provider", 400, http.FAIL);
      }

      // Generate access and refresh tokens
      const { accessToken, refreshToken } = generateAccessAndRefereshTokens(existingUser._id);

      // Update user details
      existingUser.accessToken = accessToken;
      existingUser.refreshToken = refreshToken;
      existingUser.agent = req.headers["user-agent"];
      existingUser.status = "online";
      await existingUser.save();

      const userToReturn = await userModel
        .findById(existingUser._id)
        .select("-refreshToken -password");

      return Second(res, ["User logged in successfully", { user: userToReturn, accessToken, refreshToken }], 200, http.SUCCESS);
    }

    // Register a new user
    const passwordGenerator = customAlphabet(
      process.env.ALPHABET || "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      parseInt(process.env.PASSWORD_LENGTH, 10) || 12
    );
    const customPassword = passwordGenerator();

    const newUser = new userModel({
      userName: name,
      email,
      password: customPassword,
      provider: "GOOGLE",
      profileImage: { url: picture },
      isConfirmed: true,
    });

    const { accessToken, refreshToken } = generateAccessAndRefereshTokens(newUser._id);

    newUser.accessToken = accessToken;
    newUser.refreshToken = refreshToken;
    newUser.agent = req.headers["user-agent"];
    newUser.status = "online";
    await newUser.save();

    return Second(res, ["User registered and logged in successfully", { accessToken, refreshToken }], 200, http.SUCCESS);
  } catch (error) {
    console.error(error);
    return Third(res, "Internal Server Error", 500, http.ERROR);
  }
};

// ? logout
const Logout = async (req, res) => {
  try {
    // Find the user by ID
    const user = await userModel.findById(req.params._id);

    if (!user) {
      return First(res, "User not found", 404, http.FAIL);
    }

    // Remove the refreshToken and accessToken fields
    await userModel.updateOne(
      { _id: req.params.id },
      { $unset: { refreshToken: "", accessToken: "" } }
    );

    // Set the user's status to offline
    user.status = "offline";
    await user.save();

    // Send success response
    return Second(res, "User logged out successfully", 200, http.SUCCESS);
  } catch (error) {
    console.error(error);
    return Third(res, "Internal Server Error", 500, http.ERROR);
  }
};


// ? refreshAccessToken
const RefreshAccessToken = async (req, res) => {
  try {
    const { authorization } = req.headers;

    // Validate the authorization header
    if (!authorization) {
      return First(res, "Unauthorized request", 401, http.FAIL);
    }

    let decodedToken;
    try {
      // Verify the refresh token
      decodedToken = jwt.verify(authorization, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      console.error("Refresh token verification failed:", err);
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    // Find the user associated with the token
    const user = await userModel.findById(decodedToken?._id);
    if (!user) {
      return First(res, "Invalid refresh token", 401, http.FAIL);
    }

    // Check if the refresh token matches the one stored in the database
    if (authorization !== user.refreshToken) {
      return First(res, "Refresh token is expired or used", 401, http.FAIL);
    }

    // Generate new access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

    // Update the user's tokens in the database
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    await user.save();

    // Respond with the new access token
    return Second(res, ["Access token refreshed successfully", { accessToken, refreshToken }], 200, http.SUCCESS);
  } catch (error) {
    console.error(error);
    return Third(res, "Internal Server Error", 500, http.ERROR);
  }
};

// ? send code forget Password

const ForgetPass = async (req, res, next) => {
  const { email } = req.body;

  try {
    // Check if the user exists
    const user = await userModel.findOne({ email });
    if (!user) {
      return First(res, "User not found! Please create an account.", 401, http.FAIL);
    }

    // Generate a random 4-digit code
    const code = Randomstring.generate({ length: 4, charset: "numeric" });
    console.log(code);

    // Hash the generated code
    const hashCode = hash({ plaintext: code });

    // Save the hashCode to the user document
    user.forgetCode = hashCode;
    await user.save();

    // Send the code to the user's email
    const sendNewPassword = await sendEmail({
      to: email,
      subject: "Forget Code",
      html: forgetPASS(code), // Assuming this is your email template function
    });

    // Handle email sending failure
    if (!sendNewPassword) {
      console.log(sendNewPassword);
      return First(res, "Something went wrong while sending the email.", 400, http.FAIL);
    }

    // Return success message
    return Second(res, "Check your email for the code!", 200, http.SUCCESS);
  } catch (error) {
    console.error(error);
    return Third(res, "Internal Server Error", 500, http.ERROR);
  }
};


// ? resetPassword
const ResetPassword = async (req, res) => {
  try {
    const { forgetCode, email, password } = req.body;
    let user = await userModel.findOne({ email });
    if (!user) return First(res, "In-valid email!", 400, http.FAIL);
    if (!compare({ plaintext: forgetCode, hashValue: user.forgetCode }))
      return First(res, "In-valid code", 401, http.FAIL);
    user = await userModel.findOneAndUpdate(
      { email },
      { $unset: { forgetCode: 1 } }
    );
    user.password = password;
    await user.save();
    return Second(res, "try to login", 200, http.SUCCESS);
  } catch (error) {
    console.error(error);
    return Third(res, "Internal Server Error", 500, http.ERROR);
  }
};

module.exports = {
  SignUP,
  ActivationAccount,
  SignIn,
  SignupOrloginWithGmail,
  Logout,
  RefreshAccessToken,
  ForgetPass,
  ResetPassword,
}