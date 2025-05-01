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

router.get("/feed", function (req, res, next) {
  res.render("feed");
});

router.get("/profile", isLoggedIn ,async (req, res, next) => {
  const user = await userModel.findOne({
    username : req.session.passport.user
  })
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

router.post("/upload", upload.single("file") ,function (req, res) {
  if (!req.file) {
    return res.status(404).send("No Files Uploaded !!!");
  }
  res.send("Files Uploaded Succesfully...");
});

router.get("/logout", (req,res) => {
  req.logout(function(err) {
    if(err) {return next(err);}
    res.redirect("/");
  })
})

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

export default router;
