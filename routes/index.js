import express from 'express';
import mongoose from 'mongoose';
import userModel from './users.js';
import postModel from './posts.js';
import passport from 'passport';
const { authenticate } = passport;
import upload from "./multer.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

import dotenv from 'dotenv';
dotenv.config();

// Passport Strategy
import { Strategy as LocalStrategy } from 'passport-local';
passport.use(new LocalStrategy(userModel.authenticate()));

// Google Strategy
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
  },
  async (accessToken,refreshToken,profile,done) => {
    try {
      let existingUser = await userModel.findOne({googleId: profile.id});

      if(existingUser) {
        return done(null, existingUser)
      };

      const newUser = new userModel({
        username: profile.emails[0].value,
        fullname: profile.displayName,
        email: profile.emails[0].value,
        googleId: profile.id,
        dp: profile.photos[0].value,
      });

      const savedUser = await newUser.save();
      done(null, savedUser);
    } catch (err) {
      done(err,null)
    }
  }
))

const router = express.Router();

// Middleware 
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

// Login and Register
router.get("/login", function (req, res, next) {
  res.render("login",{error : req.flash("error")});
});

router.post("/login", passport.authenticate("local", {
  successRedirect : "/profile",
  failureRedirect : "/login",
  failureFlash : true
}))

router.post("/register", (req,res) => {
  const userData = new userModel({
    username : req.body.username,
    email : req.body.email,
    fullname : req.body.fullname
  });

  userModel.register(userData, req.body.password)
  .then(() => {
    passport.authenticate("local")(req,res, () => {
      res.redirect("/profile");
    })
  })
})

// Google Login
router.get("/auth/google", 
  passport.authenticate("google", {scope:["profile","email"]})
)

router.get("/auth/google/callback", passport.authenticate("google",{
  failureRedirect : "/login",
  failureFlash : true
}),(req,res) => {
  res.redirect("/profile")
})

// All Other Routes
router.get("/feed", isLoggedIn,async function (req, res, next) {
  const posts = await postModel.find().populate("user");

  if (!posts.length) {
    return res.status(404).send("No posts found !!!");
  }

  res.render("feed", {posts});
});

router.get("/profile", isLoggedIn ,async (req, res, next) => {
  const user = await userModel.findOne({
    username : req.session.passport.user
  }).populate("posts");
  res.render("profile", {user});
});

router.post("/upload", isLoggedIn, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(404).send("No Files Uploaded !!!");
    }

    const user = await userModel.findOne({ username: req.session.passport.user });

    // Create a post with the Cloudinary URL
    const post = await postModel.create({
      image: req.file.path,
      postText: req.body.filecaption,
      user: user._id
    });

    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).send("An error occurred while uploading the file.");
  }
});

router.get("/logout", (req,res) => {
  req.logout(function(err) {
    if(err) {return next(err);}
    res.redirect("/");
  })
})

router.get("/profile/edit", isLoggedIn,(req,res) => {
  res.render("edit");
})

router.post("/profile/edit", isLoggedIn, upload.single("file"), async (req, res) => {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });

    user.fullname = req.body.fullname;
    user.username = req.body.username;

    if (req.file) {
      user.dp = req.file.path; 
    }

    await user.save();
    res.redirect("/profile");
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).send("Failed to update profile.");
  }
});

router.post("/profile/delete/:postId", isLoggedIn, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userName = req.session.passport.user;
    
    const user = await userModel.findOne({username : userName})
    
    const post = await postModel.findById(postId);

    if (!post) {
      return res.status(404).send("Post not found");
    }
    
    if (post.user.toString() !== user._id.toString()) {
      return res.status(403).send("You are not authorized to delete this post");
    }

    await postModel.findByIdAndDelete(postId);
    res.redirect("/profile");
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).send("Failed to delete post.");
  }
});

router.post("/feed/like/:postId", isLoggedIn, async (req, res) => {
  const userId = req.session.passport.user;
  const postId = req.params.postId;

  try {
    const post = await postModel.findById(postId);

    if (!post) {
      return res.status(404).send("Post not found");
    }

    const liked = post.likes.includes(userId);

    if (liked) {
      // If already liked, remove
      post.likes.pull(userId);
    } else {
      // If not liked, add
      post.likes.push(userId);
    }

    await post.save();
    res.json({ likesCount: post.likes.length, liked: !liked });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong");
  }
});

// Forgot Password
router.get("/forgot", (req,res) => {
  res.render("forgot");
})

router.post("/forgot", async (req, res) => {
  const user = await userModel.findOne({ email: req.body.email });

  if (!user) {
    req.flash("error", "Email not found");
    return res.redirect("/forgot");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit

  // Setting to Database
  user.otp = otp;
  user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  await transporter.sendMail({
    to: user.email,
    from: `"Picify Support" <${process.env.GMAIL_USER}>`,
    subject: "Your OTP for password reset",
    html: `<p>Your OTP is: <strong>${otp}</strong></p>`
  });

  res.render("enter-otp", { email: user.email, error: null });
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp, password } = req.body;

  const user = await userModel.findOne({
    email,
    otp,
    otpExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.render("enter-otp", { email, error: "Invalid or expired OTP" });
  }

  await user.setPassword(password); // from passport-local-mongoose
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  req.login(user, (err) => {
    if (err) {
      console.error(err);
      return res.redirect("/login");
    }
    res.redirect("/profile");
  });
});


export default router;
