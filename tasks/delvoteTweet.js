const { addDeleteAction } = require('../commands/unsend');
const { getTopVote, updateVoteByPostId } = require('../models/voteModels');
const { Sentry } = require('../config');

async function taskDelvoteTweet() {
  try {
    const topVoteResponse = await getTopVote();
    if (topVoteResponse[0].length >= 1) {
      console.log(`[INFO] ${topVoteResponse[0].length} Delvote Tweet Task(s)`);

      const postId = topVoteResponse[0][0]['post_id'];

      await addDeleteAction(postId, 2);
      await updateVoteByPostId(postId);
    } else {
      console.log('[INFO] 0 Delvote Tweet Task(s)');
    }
  } catch (error) {
    Sentry.captureException(error);
  } finally {
    setTimeout(taskDelvoteTweet, 60 * 1000);
  }
}

module.exports = { taskDelvoteTweet };
