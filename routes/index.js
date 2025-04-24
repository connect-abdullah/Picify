import express from 'express';
import mongoose from 'mongoose';
import userModel from './users.js';
import postModel from './posts.js';

const router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/createuser", async function (req, res) {
  let createdUser = await userModel.create({
    username: "Rana@2",
    password: "rana123",
    email: "rana@gmail.com",
    fullName: "Rana Ali",
  });

  res.send(createdUser);
});

router.get("/createpost", async function (req, res) {
    let createdPost = await postModel.create({
      postText: "Burger Khila Dy ",
      user: "68097d1a7a461430cccc532a",
    });
    let user = await userModel.findOne({_id: "68097d1a7a461430cccc532a"});
    user.posts.push(createdPost._id);
    await user.save();
    res.send("Done")

});

router.get("/alluserposts", async function(req, res) {
  try {
    const userData = await userModel.find({
      _id: { $in: ["6809778ccf03a1bad23b0047", "68097d1a7a461430cccc532a"] }
    }).populate("posts");
    res.send(userData);
  } catch (error) {
    res.status(500).send({ error: "Something went wrong", details: error.message });
  }
});

export default router;
