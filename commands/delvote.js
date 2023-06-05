const { Sentry } = require('../config');
const {
  getTweetSenderID,
  getTweetReplyToStatusID,
} = require('../utils/tweet');
const { insertVote, getVote } = require('../models/voteModels');
const { getTweetByTweetId } = require('../models/tweetModels');
const { getUserInfoByTwitterId } = require('../models/userModels');

async function delvoteCommand(event) {
  const twitterId = getTweetSenderID(event);
  const tweetId = getTweetReplyToStatusID(event);

  const userResponse = await getUserInfoByTwitterId(twitterId);
  const userId = userResponse[0][0]['user_id'];
  const tweetResponse = await getTweetByTweetId(tweetId);
  const postId = tweetResponse[0][0]['post_id'];

  const getVoteResponse = await getVote(userId, postId);
  if (getVoteResponse[0].length >= 1) {
    return;
  }

  try {
    await insertVote(userId, postId);
  } catch (error) {
    Sentry.captureException(error);
  }
}

module.exports = { delvoteCommand };
