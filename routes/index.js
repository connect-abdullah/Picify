import express from 'express';
import mongoose from 'mongoose';
import userModel from './users.js';
import postModel from './posts.js';
import passport from 'passport';
import upload from "./multer.js";

import { Strategy as LocalStrategy } from 'passport-local';
passport.use(new LocalStrategy(userModel.authenticate()));


const router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/login", function (req, res, next) {
  res.render("login",{error : req.flash("error")});
});


router.get("/feed", isLoggedIn,async function (req, res, next) {
  const posts = await postModel.find().populate("user")
  console.log(posts);

  if (!posts.length) {
    return res.status(404).send("No posts found !!!");
  }

  res.render("feed", {posts});
});

router.get("/profile", isLoggedIn ,async (req, res, next) => {
  const user = await userModel.findOne({
    username : req.session.passport.user
  }).populate("posts")
  console.log(user);
  res.render("profile", {user});
});

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

router.post("/login", passport.authenticate("local", {
  successRedirect : "/profile",
  failureRedirect : "/login",
  failureFlash : true
}))

router.post("/upload", isLoggedIn, upload.single("file") , async function (req, res) {
  if (!req.file) {
    return res.status(404).send("No Files Uploaded !!!");
  }

  const user = await userModel.findOne({username : req.session.passport.user});
  const postData = await postModel.create({
    image: req.file.filename,
    postText : req.body.filecaption,
    user : user._id
  });
  user.posts.push(postData._id);
  await user.save();
  res.redirect("/profile")
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

router.post("/profile/edit", isLoggedIn, upload.single("file"), async (req,res) => {
  const user = await userModel.findOne({username : req.session.passport.user});

  user.fullname = req.body.fullname;
  user.dp = req.file.filename;
  await user.save();
  res.redirect("/profile");
})

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

export default router;
