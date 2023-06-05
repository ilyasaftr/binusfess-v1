const { Sentry, ApiResponseError, rateLimitPlugin } = require('../config');
const { getCurrentTime, getCompareTime } = require('../utils/dayjs');
const { getActionByTime, updateActionById, getActionByTargetId } = require('../models/actionModels');
const { getTweetByPostId, updateTweetStatusByTweetId } = require('../models/tweetModels');
const { getUserInfoByUserId } = require('../models/userModels');
const { deleteTweet } = require('../utils/tweet');
const { DMSend } = require('../utils/direct_messages');
const { insertLimit } = require('../models/limitModels');

async function taskDeleteTweet() {
  try {
    const currentTime = getCurrentTime();
    const actionResponse = await getActionByTime(currentTime, 2, 0);
    if (actionResponse[0].length >= 1) {
      console.log(`[INFO] ${actionResponse[0].length} Delete Tweet Task(s)`);

      const actionId = actionResponse[0][0]['action_id'];
      const userId = actionResponse[0][0]['user_id'];
      const postId = actionResponse[0][0]['target_id'];

      const actionCreatorResponse = await getActionByTargetId(postId, 1);
      const updatedAt = actionCreatorResponse[0][0]['updated_at'];

      const userResponse = await getUserInfoByUserId(userId);
      const twitterId = userResponse[0][0]['twitter_id'];

      const tweetResponse = await getTweetByPostId(postId, 0);

      // Can Send DM?
      // 20 hours in ms
      // Jika menfess berhasil dikirim sebelum 24 jam maka kasihan pemberitahuan lewat DM
      // Jika lewat dari 24 jam jangan dikirim karena akan menggunakan API Limit DM
      const diffTime = getCompareTime(currentTime, updatedAt);
      let sendDM = true;
      if (diffTime >= (20 * 60 * 60 * 1000)) {
        sendDM = false;
      }

      let i = 0;

      // eslint-disable-next-line no-restricted-syntax
      for await (const item of tweetResponse[0]) {
        const tweetId = item['tweet_id'];
        i += 1;

        try {
          await deleteTweet(tweetId);
        } catch (error) {
          if (error instanceof ApiResponseError) {
            if (error.rateLimitError && error.rateLimit) {
              console.log(`[ERROR-DELETE-TWEET] You just hit the rate limit! Limit for this endpoint is ${error.rateLimit.limit} requests!`);
              console.log(`[ERROR-DELETE-TWEET] Request counter will reset at timestamp ${error.rateLimit.reset}.`);
            } else if (error.data) {
              console.log(error);
              console.log(`[ERROR-DELETE-TWEET] Error Data Detail : ${error['data']}.`);
              await updateActionById(actionId, 2);
              if (sendDM === true) {
                await DMSend({
                  recipient_id: twitterId,
                  text: `Menfess kamu gagal dihapus. Pesan Error dari Twitter "${error.data}"`,
                });
              }
            } else {
              await updateActionById(actionId, 2);
              if (sendDM === true) {
                await DMSend({
                  recipient_id: twitterId,
                  text: `Menfess kamu gagal dihapus. Pesan Error dari Twitter "${error.data}"`,
                });
              }
              console.log('[ERROR-DELETE-TWEET] Unknown Error.');
              Sentry.captureException(error);
            }
          } else {
            Sentry.captureException(error);
          }
        }

        // Limit
        const currentRateLimit = await rateLimitPlugin.v2.getRateLimit('tweets/:id');
        const quotaLimit = currentRateLimit.limit;
        const remainingLimit = currentRateLimit.remaining;
        const resetAt = currentRateLimit.reset;
        await insertLimit('tweets/:id', quotaLimit, remainingLimit, resetAt);
        // Limit

        await updateTweetStatusByTweetId(tweetId, 1);
        if (i === tweetResponse[0].length) {
          await updateActionById(actionId, 1);

          if (sendDM === true) {
            if (twitterId === 'VOTING') {
              const creatorUserId = actionCreatorResponse[0][0]['user_id'];
              const creatorInfoResponse = await getUserInfoByUserId(creatorUserId);
              const creatorTwitterId = creatorInfoResponse[0][0]['twitter_id'];
              await DMSend({
                recipient_id: creatorTwitterId,
                text: 'Menfess kamu dihapus melalui sistem "/delvote" (Delete Vote Tweet), jika kamu merasa tidak melanggar rules mohon hubungi admin.',
              });
            } else {
              await DMSend({
                recipient_id: twitterId,
                text: 'Permintaan menghapus menfess kamu telah berhasil dilakukan.',
              });
            }
          }
        }
      }
    } else {
      console.log('[INFO] 0 Delete Tweet Task(s)');
    }
  } catch (error) {
    console.log('[ERROR-DELETE-TWEET] Unknown Error.');
    Sentry.captureException(error);
  } finally {
    setTimeout(taskDeleteTweet, 60 * 1000);
  }
}

module.exports = { taskDeleteTweet };
