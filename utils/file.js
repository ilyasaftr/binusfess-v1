const fs = require('fs').promises;
const uniqueSlug = require('unique-slug');
const { Sentry } = require('../config');

async function exists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function MakeDir(path) {
  try {
    const response = await exists(path);
    if (response === false) {
      fs.mkdir(path);
    }
  } catch (error) {
    Sentry.captureException(error);
  }
}

async function SaveFile(fullPath, fileName, data, isJson = false) {
  try {
    await MakeDir(fullPath);
    if (isJson === true) {
      fs.writeFile(`${fullPath}/${fileName}`, JSON.stringify(data), 'utf8');
    } else {
      fs.writeFile(`${fullPath}/${fileName}`, data);
    }
  } catch (error) {
    Sentry.captureException(error);
  }
}

async function DeleteFile(fileName) {
  try {
    fs.unlink(fileName);
  } catch (error) {
    Sentry.captureException(error);
  }
}

function getUniqueSlug() {
  return uniqueSlug();
}

module.exports = {
  SaveFile,
  DeleteFile,
  MakeDir,
  getUniqueSlug,
};
