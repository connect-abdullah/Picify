import dotenv from "dotenv";
dotenv.config();

console.log("Cloudinary credentials:");
console.log("Cloud name:", process.env.CLOUD_NAME);
console.log("API Key:", process.env.API_KEY);
