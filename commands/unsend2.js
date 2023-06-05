const {
  getTweetSenderID,
  getTweetReplyToStatusID,
} = require('../utils/tweet');
const { addDeleteAction } = require('./unsend');
const { getTweetByTweetId } = require('../models/tweetModels');
const { getUserInfoByTwitterId } = require('../models/userModels');

async function unsend2Command(event) {
  const twitterId = getTweetSenderID(event);
  const tweetId = getTweetReplyToStatusID(event);

  const userResponse = await getUserInfoByTwitterId(twitterId);
  const userId = userResponse[0][0]['user_id'];
  const tweetResponse = await getTweetByTweetId(tweetId);
  const postId = tweetResponse[0][0]['post_id'];

  // khusus admin/mod
  if (userResponse[0][0]['is_admin'] !== 1) {
    return;
  }

  await addDeleteAction(postId, userId);
}

module.exports = { unsend2Command };
