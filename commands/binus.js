const {
  getCurrentTime,
  getCompareTime,
  addMinuteToTime,
} = require('../utils/dayjs');
const {
  DMGetSenderID,
  DMGetMessageData,
  DMGetEntities,
  DMSend,
  DMSavePhoto,
} = require('../utils/direct_messages');
const {
  SaveFile, getUniqueSlug, DeleteFile,
} = require('../utils/file');
const { nsfwCheck } = require('../utils/api');
const { getUserInfoByTwitterId } = require('../models/userModels');
const { insertPost, getPostByText } = require('../models/postModels');
const { getLastAction, insertAction } = require('../models/actionModels');
const { Sentry, twitterText } = require('../config');

async function binusCommand(event) {
  // Start Clean Text //
  const senderID = DMGetSenderID(event);
  const userInfo = await getUserInfoByTwitterId(senderID);
  const userId = userInfo[0][0]['user_id'];
  const userFollowers = userInfo[0][0]['followers_count'];
  const userCreatedAt = userInfo[0][0]['created_at'];
  const dmUniqueId = getUniqueSlug();

  if (userInfo[0][0]['is_admin'] !== 1) {
    if (userFollowers < 5) {
      await DMSend({
        recipient_id: senderID,
        text: `Followers minimal 5 untuk mengirim menfess! Jumlah followers kamu sekarang ${userFollowers}.`,
      });
      return;
    }
  }

  const currentTime = getCurrentTime();
  const diffTime = getCompareTime(currentTime, userCreatedAt);
  if (diffTime < (7 * 24 * 60 * 60 * 1000)) {
    await DMSend({
      recipient_id: senderID,
      text: 'Umur akun twitter minimal 7 hari.',
    });
    return;
  }

  // const lastAction = await getLastActionByUserId(userId, 1);
  // if (lastAction[0].length >= 1) {
  //   const createdAt = lastAction[0][0]['created_at'];
  //   const countDown = addMinuteToTime(createdAt, 5);
  //   const tempCountDown = getCompareTime(countDown, currentTime, 'minute').toFixed(2);

  //   let finalCountDown;
  //   const splitCountDown = tempCountDown.split('.');
  //   const menit = splitCountDown[0];
  //   const detik = splitCountDown[1];
  //   if (tempCountDown >= 1) {
  //     finalCountDown = `${menit} menit ${detik} detik`;
  //   } else {
  //     finalCountDown = `${detik} detik`;
  //   }

  //   await DMSend({
  //     recipient_id: senderID,
  //     text: `Mohon tunggu selama
  // ${finalCountDown} untuk mengirim menfess lagi.`,
  //   });
  //   return;
  // }

  let text = DMGetMessageData(event);
  const { urls } = DMGetEntities(event);
  let quoteId;
  let foundPhoto;
  let mediaUnsupported;
  let urlFound = false;
  // eslint-disable-next-line no-restricted-syntax
  for (const item of urls) {
    if (item['expanded_url'].includes('twitter.com') === true) {
      const pathURL = item['expanded_url'].split('/');
      if (pathURL[4] === 'media') {
        if (event['direct_message_events']['0']['message_create']['message_data']['attachment']['media']['type'] === 'photo') {
          foundPhoto = true;
        } else {
          mediaUnsupported = true;
        }

        text = text.replace(item['url'], '');
      }

      if (pathURL[4] === 'status') {
        text = text.replace(item['url'], '');
        // eslint-disable-next-line prefer-destructuring
        quoteId = pathURL[5];
        if (quoteId.includes('?') === true) {
          // eslint-disable-next-line prefer-destructuring
          quoteId = quoteId.split('?')[0];
        }
      }
    } else {
      text = text.replace(item['url'], item['expanded_url']);
      urlFound = true;
    }
  }

  const textLength = twitterText.parseTweet(text).weightedLength;
  if (textLength < 15) {
    await DMSend({
      recipient_id: senderID,
      text: `Minimal 15 karakter! Kamu mengirim sebanyak ${textLength} karakter.`,
    });
    return;
  }

  if (textLength > 1500) {
    await DMSend({
      recipient_id: senderID,
      text: `Maksimal 1500 karakter! Kamu mengirim sebanyak ${textLength} karakter.`,
    });
    return;
  }

  if (mediaUnsupported === true) {
    await DMSend({
      recipient_id: senderID,
      text: 'Tidak mendukung media dengan tipe video atau gif, hanya mendukung media dengan tipe photo!',
    });
    return;
  }

  if (urlFound === true) {
    await DMSend({
      recipient_id: senderID,
      text: 'Tidak boleh mengirim menfess yang mengandung link atau url.',
    });
    return;
  }

  if (text.includes('#') === true || text.includes('@') === true) {
    await DMSend({
      recipient_id: senderID,
      text: 'Tidak boleh mengirim menfess yang mengandung hashtag atau mention.',
    });
    return;
  }

  const postResponse = await getPostByText(text);
  if (postResponse[0].length >= 1) {
    await DMSend({
      recipient_id: senderID,
      text: 'Menfess duplikat, silahkan ubah kata-katanya!',
    });
    return;
  }

  let nextScheduledAt = currentTime;

  try {
    const response = await getLastAction(1);
    if (response[0].length >= 1) {
      nextScheduledAt = addMinuteToTime(currentTime, 2);
    }
  } catch (error) {
    await DMSend({
      recipient_id: senderID,
      text: 'Terjadi Kesalahan, mohon hubungi admin. Kode Error : DM-BINUS-01',
    });
    Sentry.captureException(error);
    return;
  }

  let fileImageName;
  if (foundPhoto === true) {
    const urlDownload = event['direct_message_events']['0']['message_create']['message_data']['attachment']['media']['media_url_https'];
    const MediaBuffer = await DMSavePhoto(urlDownload);
    fileImageName = `${senderID}-${dmUniqueId}.jpg`;
    const fullPath = `${process.cwd()}/${process.env.FILE_PATH}`;
    await SaveFile(fullPath, fileImageName, MediaBuffer);

    const nsfwResponse = await nsfwCheck(`${fullPath}/${fileImageName}`);
    if (nsfwResponse === true) {
      await DeleteFile(fullPath);
      await DMSend({
        recipient_id: senderID,
        text: 'Gambar/Foto yang mengandung konten "pornografi/sexy/hentai" dilarang!\n\nBINUSIAN FESS menggunakan teknologi machine learning untuk mendeteksi Gambar/Foto yang mengandung konten "pornografi/sexy/hentai". \n\nSilahkan hubungi admin jika merasa ada kesalahan.',
      });
      return;
    }
  }

  await DMSend({
    recipient_id: senderID,
    text: 'Menfess tersebut akan dikirim beberapa menit lagi, mohon tunggu!',
  });

  try {
    const response = await insertPost(text, fileImageName, quoteId);
    const postId = response[0].insertId;
    await insertAction(userId, postId, 1, nextScheduledAt);
  } catch (error) {
    await DMSend({
      recipient_id: senderID,
      text: 'Terjadi Kesalahan, mohon hubungi admin. Kode Error : DM-BINUS-02',
    });
    Sentry.captureException(error);
  }
}

module.exports = { binusCommand };
