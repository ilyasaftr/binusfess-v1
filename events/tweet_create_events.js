const {
  getTweetSenderID,
  getTweetText,
  getTweetReplyToSenderID,
} = require('../utils/tweet');
const { insertUser, getUserInfoByTwitterId } = require('../models/userModels');
const { getCurrentTime } = require('../utils/dayjs');
const { delvoteCommand } = require('../commands/delvote');
const { unsend2Command } = require('../commands/unsend2');

async function TweetCreateEvents(event) {
  // Jika pengirim tweet adalah akun bot maka ignore
  const twitterId = getTweetSenderID(event);
  if (twitterId === process.env.TWITTER_BOT_ID) {
    return;
  }

  const senderInfo = event['tweet_create_events'][0]['user'];
  const followersCount = senderInfo['followers_count'];
  const friendsCount = senderInfo['friends_count'];
  const statusesCount = senderInfo['statuses_count'];
  const createdTimestamp = getCurrentTime(senderInfo['created_at']);
  await insertUser(twitterId, followersCount, friendsCount, statusesCount, createdTimestamp);

  const userInfo = await getUserInfoByTwitterId(twitterId);
  const userBlocked = userInfo[0][0]['is_blocked'];

  if (userBlocked === 1) {
    return;
  }

  // Jika pengirim tweet bukan reply ke tweet dari bot maka ignore
  if (getTweetReplyToSenderID(event) !== process.env.TWITTER_BOT_ID) {
    return;
  }

  const tweetText = getTweetText(event);
  if (tweetText.includes('/delvote') === true) {
    delvoteCommand(event);
  } else if (tweetText.includes('/unsend') === true) {
    unsend2Command(event);
  }
}

module.exports = { TweetCreateEvents };
