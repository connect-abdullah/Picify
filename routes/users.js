import mongoose from "mongoose";
import plm from "passport-local-mongoose";

import dotenv from "dotenv";
dotenv.config();

mongoose.connect(`mongodb+srv://${process.env.USERNAME}:${process.env.PASS}@cluster0.6rgbrne.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)

const userSchema = new mongoose.Schema({
  username : {
    type : String,
    required : true,
    unique : true
  },
  password : {
    type : String
  },
  posts : [{
    type : mongoose.Schema.Types.ObjectId,
    ref : "Post"
  }],
  dp : {
    type : String
  },
  email : {
    type : String,
    required : true,
    unique : true
  },
  fullname : {
    type : String,
    required : true,
  },
  googleId : {
    type : String
  },
  otp: {
    type : String
  },
  otpExpires: {
    type : Date,
    default : Date.now()
  },
  savedPost : [{
    type : mongoose.Schema.Types.ObjectId,
    ref : "Post"
  }]

});

userSchema.plugin(plm);

export default mongoose.model("User", userSchema);