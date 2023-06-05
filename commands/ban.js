const { DMGetSenderID, DMSend, DMGetEntities } = require('../utils/direct_messages');
const { getTweetByTweetId } = require('../models/tweetModels');
const { getUserInfoByTwitterId, banUserByUserId } = require('../models/userModels');
const {
  getActionByTargetId,
} = require('../models/actionModels');

async function banCommand(event) {
  const twitterId = DMGetSenderID(event);
  const userInfo = await getUserInfoByTwitterId(twitterId);
  const userBlocked = userInfo[0][0]['is_blocked'];

  if (userBlocked === 1) {
    return;
  }

  const entitiesUrl = DMGetEntities(event)['urls'];

  if (entitiesUrl.length <= 0) {
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
      text: 'Pengirim Tweet tersebut tidak ditemukan!',
    });
    return;
  }

  const postId = tweetResponse[0][0]['post_id'];

  const actionTargetResponse = await getActionByTargetId(postId, 1);
  const tweetSenderId = actionTargetResponse[0][0]['user_id'];
  if (userInfo[0][0]['is_admin'] !== 1) {
    await DMSend({
      recipient_id: twitterId,
      text: 'Kamu bukan Admin/Mod!',
    });
    return;
  }

  await banUserByUserId(tweetSenderId, 1);

  await DMSend({
    recipient_id: twitterId,
    text: 'Berhasil melakukan ban!',
  });
}

async function unbanCommand(event) {
  const twitterId = DMGetSenderID(event);
  const userInfo = await getUserInfoByTwitterId(twitterId);
  const userBlocked = userInfo[0][0]['is_blocked'];

  if (userBlocked === 1) {
    return;
  }

  const entitiesUrl = DMGetEntities(event)['urls'];

  if (entitiesUrl.length <= 0) {
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
      text: 'Pengirim Tweet tersebut tidak ditemukan!',
    });
    return;
  }

  const postId = tweetResponse[0][0]['post_id'];

  const actionTargetResponse = await getActionByTargetId(postId, 1);
  const tweetSenderId = actionTargetResponse[0][0]['user_id'];
  if (userInfo[0][0]['is_admin'] !== 1) {
    await DMSend({
      recipient_id: twitterId,
      text: 'Kamu bukan Admin/Mod!',
    });
    return;
  }

  await banUserByUserId(tweetSenderId, 0);

  await DMSend({
    recipient_id: twitterId,
    text: 'Berhasil melakukan unban!',
  });
}

module.exports = { banCommand, unbanCommand };
