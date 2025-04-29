import mongoose from "mongoose";
import plm from "passport-local-mongoose";


mongoose.connect("mongodb://localhost:27017/Pinterest")

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
  }
});

userSchema.plugin(plm);

export default mongoose.model("User", userSchema);