const multer = require("multer");
const { v1: uuidv1 } = require("uuid");

const type = {
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
};

const fileUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./uploads");
    },
    filename: (req, file, cb) => {
      const ext = type[file.mimetype];
      cb(null, uuidv1() + "." + ext);
    },
  }),
  fileFilter: (req, file, cb) => {
    const isValid = !!type[file.mimetype];
    let error = isValid ? null : new Error("Invalid Type.");
    cb(error, isValid);
  },
});

module.exports = fileUpload;
