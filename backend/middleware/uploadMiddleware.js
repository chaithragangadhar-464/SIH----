const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_FILE_SIZE =
  (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10) * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.doc',
  '.docx',
  '.mp4',
  '.zip',
];

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// subfolder: 'certifications' | 'problem-evidence' | 'solution-files'
const buildUploader = (subfolder) => {
  const destPath = path.join(
    process.cwd(),
    '..',
    UPLOAD_DIR,
    subfolder
  );

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      ensureDir(destPath);
      cb(null, destPath);
    },

    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}`;

      const ext = path.extname(file.originalname).toLowerCase();

      cb(
        null,
        `${file.fieldname}-${uniqueSuffix}${ext}`
      );
    },
  });

  const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(
        new Error(`File type ${ext} is not allowed`),
        false
      );
    }

    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: MAX_FILE_SIZE,
    },
  });
};

module.exports = {
  uploadCertification: buildUploader('certifications'),
  uploadProblemEvidence: buildUploader('problem-evidence'),
  uploadSolutionFiles: buildUploader('solution-files'),
};
