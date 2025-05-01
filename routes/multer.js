import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/uploads');  // Destination Folder for Uploads
    },
    filename: function (req, file, cb) {
      const uniqueName = uuidv4(); // Generating a unqiue name for image
      cb(null, uniqueName + path.extname(file.originalname)) 
      // adding image extention too
    }
  })
  
const upload = multer({ storage: storage })

export default upload;