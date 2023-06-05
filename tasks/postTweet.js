const { Sentry, ApiResponseError, rateLimitPlugin } = require('../config');
const { getCurrentTime, getCompareTime } = require('../utils/dayjs');
const { getActionByTime, updateActionById } = require('../models/actionModels');
const { getPostByPostId } = require('../models/postModels');
const { insertTweet } = require('../models/tweetModels');
const { postTweetThread } = require('../utils/tweet');
const { DMSend } = require('../utils/direct_messages');
const { getUserInfoByUserId } = require('../models/userModels');
const { insertLimit, getLimitByName } = require('../models/limitModels');

async function taskPostTweet() {
  const currentTime = getCurrentTime();

  const limitResponse = await getLimitByName('tweets');
  if (limitResponse[0].length >= 1) {
    const limitRemaining = limitResponse[0][0]['api_remaining'];
    const resetAt = limitResponse[0][0]['reseted_at'];

    if (limitRemaining === 0 && getCompareTime(currentTime, resetAt) <= 0) {
      return;
    }
  }

  const actionResponse = await getActionByTime(currentTime, 1, 0);
  if (actionResponse[0].length >= 1) {
    console.log(`[INFO] ${actionResponse[0].length} Post Tweet Task(s)`);

    // Action Response
    const actionId = actionResponse[0][0]['action_id'];
    const postId = actionResponse[0][0]['target_id'];
    const createdAt = actionResponse[0][0]['created_at'];

    // User Response
    const userId = actionResponse[0][0]['user_id'];
    const userInfo = await getUserInfoByUserId(userId);
    const twitterId = userInfo[0][0]['twitter_id'];

    // Post Response
    const postResponse = await getPostByPostId(postId);
    const tweetText = postResponse[0][0]['tweet_text'];
    const tweetMediaPhoto = postResponse[0][0]['tweet_media_photo'];
    const tweetQuoteId = postResponse[0][0]['tweet_quote_id'];

    // Can Send DM?
    // 20 hours in ms
    // Jika menfess berhasil dikirim sebelum 24 jam maka kasihan pemberitahuan lewat DM
    // Jika lewat dari 24 jam jangan dikirim karena akan menggunakan API Limit DM
    const diffTime = getCompareTime(currentTime, createdAt);
    let sendDM = true;
    if (diffTime >= (20 * 60 * 60 * 1000)) {
      sendDM = false;
    }

    try {
      const tweetResponse = await postTweetThread(tweetText, tweetMediaPhoto, tweetQuoteId);

      // Limit
      const currentRateLimit = await rateLimitPlugin.v2.getRateLimit('tweets');
      const quotaLimit = currentRateLimit.limit;
      const remainingLimit = currentRateLimit.remaining;
      const resetAt = currentRateLimit.reset;
      await insertLimit('tweets', quotaLimit, remainingLimit, resetAt);
      // Limit

      const firstTweetId = tweetResponse[0]['data']['id'];

      if (sendDM === true) {
        await DMSend({
          recipient_id: twitterId,
          text: `Menfess kamu berhasil di-Tweet. Ketik "/unsend" untuk menghapus (batas waktu ${process.env.CONFIG_UNSEND_TIME || 30} menit dari sekarang!) https://twitter.com/binus_fess/status/${firstTweetId}`,
        });
      }
      // eslint-disable-next-line no-restricted-syntax
      for (const item of tweetResponse) {
        const tweetId = item['data']['id'];
        // eslint-disable-next-line no-await-in-loop
        await insertTweet(tweetId, postId);
      }
      await updateActionById(actionId, 1);
    } catch (error) {
      if (error instanceof ApiResponseError) {
        if (error.rateLimitError && error.rateLimit) {
          console.log(`[ERROR-TWEET] You just hit the rate limit! Limit for this endpoint is ${error.rateLimit.limit} requests!`);
          console.log(`[ERROR-TWEET] Request counter will reset at timestamp ${error.rateLimit.reset}.`);
        } else if (error.data) {
          console.log(`[ERROR-TWEET] Error Data Detail : ${error.data['detail']}`);
          await updateActionById(actionId, 2);
          if (sendDM === true) {
            await DMSend({
              recipient_id: twitterId,
              text: `Menfess kamu gagal dikirim. Pesan Error dari Twitter "${error.data['detail']}"`,
            });
          }
        } else {
          Sentry.captureException(error);
        }
      } else {
        Sentry.captureException(error);
      }
    } finally {
      setTimeout(taskPostTweet, 60 * 1000);
    }
  } else {
    console.log('[INFO] 0 Post Tweet Task(s)');
    setTimeout(taskPostTweet, 60 * 1000);
  }
}

module.exports = { taskPostTweet };
