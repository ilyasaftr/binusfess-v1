const { DMGetSenderID, DMSend, DMGetEntities } = require('../utils/direct_messages');
const { getTweetByTweetId, getTweetByPostId } = require('../models/tweetModels');
const { getUserInfoByTwitterId, getUserInfoByUserId } = require('../models/userModels');
const { updateVoteByPostId } = require('../models/voteModels');
const {
  insertAction,
  getLastActionByUserId,
  getActionByTargetId,
  getLastAction,
} = require('../models/actionModels');
const { getCurrentTime, addMinuteToTime, getCompareTime } = require('../utils/dayjs');

async function addDeleteAction(postId, userId, lastTweet = false) {
  // Start Add Task
  const userInfo = await getUserInfoByUserId(userId);
  const twitterId = userInfo[0][0]['twitter_id'];
  const tweetResponse = await getTweetByPostId(postId);
  let nextScheduledAt = getCurrentTime();
  let count = 0;
  let addedCount = 0;
  // eslint-disable-next-line no-restricted-syntax
  for (const item of tweetResponse[0]) {
    const isDeleted = item['is_deleted'];

    // eslint-disable-next-line no-await-in-loop
    const actionTargetResponse = await getActionByTargetId(postId, 2);
    if (isDeleted === 1 || actionTargetResponse[0].length >= 1) {
      break;
    }

    // eslint-disable-next-line no-await-in-loop
    const actionLastResponse = await getLastAction(2);
    if (actionLastResponse[0].length >= 1) {
      count += 1;
      nextScheduledAt = addMinuteToTime(actionLastResponse[0][0]['scheduled_at'], 1);
    }

    // eslint-disable-next-line no-await-in-loop
    await insertAction(userId, postId, 2, nextScheduledAt);
    addedCount += 1;
  }

  if (twitterId === 'VOTING') {
    await updateVoteByPostId(postId);
    return;
  }

  if (addedCount === 0) {
    if (lastTweet === true) {
      await DMSend({
        recipient_id: twitterId,
        text: 'Menfess terakhir kamu sudah di hapus! \n\nGunakan "/unsend [menfess_url]" untuk menghapus menfess lama',
      });
      return;
    }

    await DMSend({
      recipient_id: twitterId,
      text: 'Menfess sudah di hapus!',
    });
    return;
  }

  if (count === 0) {
    await DMSend({
      recipient_id: twitterId,
      text: 'Menfess akan mulai dihapus beberapa menit lagi, mohon tunggu!',
    });
    return;
  }

  await DMSend({
    recipient_id: twitterId,
    text: `Menfess akan mulai dihapus pada ${nextScheduledAt} WIB, mohon tunggu!`,
  });
  // End Add Task
}

async function unsendLastTweet(event) {
  const twitterId = DMGetSenderID(event);
  const userInfo = await getUserInfoByTwitterId(twitterId);
  const userId = userInfo[0][0]['user_id'];

  // Delay Check
  const response = await getLastActionByUserId(userId, 1);
  if (response[0].length <= 0) {
    await DMSend({
      recipient_id: twitterId,
      text: 'Kamu belum mengirim menfess',
    });
    return;
  }
  const updatedAt = response[0][0]['updated_at'];

  const currentTime = getCurrentTime();
  const limitTime = addMinuteToTime(updatedAt, process.env.CONFIG_UNSEND_TIME || 30);

  const diffTime = getCompareTime(currentTime, limitTime);
  if (diffTime >= 0) {
    await DMSend({
      recipient_id: twitterId,
      text: `Hanya bisa menghapus menfess ${process.env.CONFIG_UNSEND_TIME || 30} menit terakhir!`,
    });
    return;
  }
  const postId = response[0][0]['target_id'];
  await addDeleteAction(postId, userId, true);
}

async function unsendCommand(event) {
  const twitterId = DMGetSenderID(event);
  const userInfo = await getUserInfoByTwitterId(twitterId);
  const userBlocked = userInfo[0][0]['is_blocked'];

  if (userBlocked === 1) {
    return;
  }

  const entitiesUrl = DMGetEntities(event)['urls'];

  if (entitiesUrl.length <= 0) {
    await unsendLastTweet(event);
    return;
  }

  const tweetUrl = entitiesUrl[0]['expanded_url'].split('/');
  if (tweetUrl[4] !== 'status') {
    await DMSend({
      recipient_id: twitterId,
      text: 'URL Tweet tersebut tidak valid!',
    });
    return;
  }

  const tweetId = tweetUrl[5];
  const tweetResponse = await getTweetByTweetId(tweetId);

  if (tweetResponse[0].length === 0) {
    await DMSend({
      recipient_id: twitterId,
      text: 'Kamu tidak bisa unsend Tweet tersebut, silahkan hubungi admin!',
    });
    return;
  }

  const userId = userInfo[0][0]['user_id'];
  const postId = tweetResponse[0][0]['post_id'];

  const actionTargetResponse = await getActionByTargetId(postId, 1);
  const tweetSenderId = actionTargetResponse[0][0]['user_id'];
  if (userInfo[0][0]['is_admin'] !== 1) {
    if (userId !== tweetSenderId) {
      await DMSend({
        recipient_id: twitterId,
        text: 'Kamu bukan sender Tweet tersebut!',
      });
      return;
    }

    // Delay Check
    const response = await getLastActionByUserId(userId, 1);
    const updatedAt = response[0][0]['updated_at'];

    const currentTime = getCurrentTime();
    const limitTime = addMinuteToTime(updatedAt, process.env.CONFIG_UNSEND_TIME || 30);

    const diffTime = getCompareTime(currentTime, limitTime);
    if (diffTime >= 0) {
      await DMSend({
        recipient_id: twitterId,
        text: `Hanya bisa menghapus menfess ${process.env.CONFIG_UNSEND_TIME || 30} menit terakhir!`,
      });
      return;
    }
  }

  await addDeleteAction(postId, userId);
}

module.exports = { unsendCommand, addDeleteAction };
