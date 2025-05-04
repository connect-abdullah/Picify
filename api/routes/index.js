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
  }).populate("posts");
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

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

export default router;
