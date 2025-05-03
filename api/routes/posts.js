import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

mongoose.connect(`mongodb+srv://${process.env.USERNAME}:${process.env.PASS}@cluster0.6rgbrne.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)

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