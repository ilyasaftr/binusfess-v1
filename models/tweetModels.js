const { mysqlPool } = require('../config');

/**
 * @param {string} tweetId - Tweet ID from Twitter api
 * @param {number} postId - Post ID
 * @returns {Object}
 */
async function insertTweet(tweetId, postId) {
  const params = [tweetId, postId];
  const sql = mysqlPool.format('INSERT INTO `tweets` (`tweet_id`, `post_id`, `is_deleted`) VALUES (?, ?, 0);', params);
  return mysqlPool.query(sql);
}

/**
 * @param {string} tweetId - Tweet ID from Twitter api
 * @param {number} status - 0 = not deleted, 1 = deleted
 * @returns {Object}
 */
async function updateTweetStatusByTweetId(tweetId, status) {
  const params = [status, tweetId];
  const sql = mysqlPool.format('UPDATE `tweets` SET `is_deleted` = ? WHERE `tweets`.`tweet_id` = ?;', params);
  return mysqlPool.query(sql);
}

/**
 * @param {string} tweetId - Tweet ID from Twitter api
 * @param {number} postId - Post ID
 * @returns {Object}
 */
async function getTweetByTweetId(tweetId) {
  const params = [tweetId];
  const sql = mysqlPool.format('SELECT * FROM `tweets` WHERE `tweet_id` = ?;', params);
  return mysqlPool.query(sql);
}

/**
 * @param {number} postId - postId
 * @param {number} status - 0 = not deleted, 1 = deleted
 * @returns {Object}
 */
async function getTweetByPostId(postId, status = null) {
  if (status === null) {
    const params = [postId];
    const sql = mysqlPool.format('SELECT * FROM `tweets` WHERE `post_id` = ?;', params);
    return mysqlPool.query(sql);
  }

  const params = [postId, status];
  const sql = mysqlPool.format('SELECT * FROM `tweets` WHERE `post_id` = ? AND `is_deleted` = ?;', params);
  return mysqlPool.query(sql);
}

/**
 * @param {string} tweetId - Tweet ID from Twitter api
 * @returns {Object}
 */
async function getTweetByScheduleId(tweetId) {
  const params = [tweetId];
  const sql = mysqlPool.format('SELECT `tweets`.`tweet_id` AS `tweet_id`, `tweets`.`schedule_id` AS `schedule_id`, `tweet_schedules_post`.`twitter_id` FROM `tweets` INNER JOIN `tweet_schedules_post` ON `tweets`.`schedule_id` = `tweet_schedules_post`.`schedule_id` WHERE `tweets`.`schedule_id` = ?;', params);
  return mysqlPool.query(sql);
}

module.exports = {
  insertTweet,
  updateTweetStatusByTweetId,
  getTweetByTweetId,
  getTweetByPostId,
  getTweetByScheduleId,
};
