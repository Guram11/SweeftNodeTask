const multer = require("multer");

const MIME_TYPE_MAP: any = {
  "text/csv": "csv",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

const fileUpload = multer({
  limits: 500000,
  storage: multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
      cb(null, "uploads/files");
    },
    filename: (req: any, file: any, cb: any) => {
      const ext = MIME_TYPE_MAP[file.mimetype];
      cb(null, Date.now() + "." + ext);
    },
  }),
  fileFilter: (req: any, file: any, cb: any) => {
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    let error = isValid ? null : new Error("Invalid mime type!");
    cb(error, isValid);
  },
});

module.exports = fileUpload;
