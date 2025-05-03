import mongoose from "mongoose";

mongoose.connect("mongodb://localhost:27017/Pinterest")

const postSchema = new mongoose.Schema({
    postText : {
        type : String,
        required : true
    },
    image : {
        type : String
    },
    user : {
       type : mongoose.Schema.Types.ObjectId,
       ref : "User"
    },
    createdAt : {
        type : Date,
        default: Date.now
    },
    likes : {
        type : Array,
        default : []
    }
});

export default mongoose.model("Post", postSchema);