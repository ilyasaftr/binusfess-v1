const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { Sentry } = require('../config');

async function nsfwCheck(fullPath) {
  try {
    const formData = new FormData();
    const file = fs.createReadStream(fullPath);
    formData.append('files', file);

    const config = {
      method: 'post',
      url: 'https://nsfw-api.kodex.id/api/v3/classificationupload',
      headers: {
        ...formData.getHeaders(),
      },
      data: formData,
    };

    try {
      const response = await axios(config);
      if (response.status === 200 && response.data.status === 'SUCCESS') {
        const dataScore = response.data.data[0].data[0];
        if (dataScore.Hentai >= 0.7 || dataScore.Sexy >= 0.7 || dataScore.Porn >= 0.7) {
          return true;
        }
        return false;
      }
      return false;
    } catch (err) {
      return false;
    }
  } catch (error) {
    Sentry.captureException(error);
    return false;
  }
}

module.exports = { nsfwCheck };
