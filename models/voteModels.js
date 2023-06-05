require('dotenv').config();
const { mysqlPool } = require('../config');

/**
 * @param {number} userId - User ID
 * @param {number} postId - Post ID
 * @returns {Object}
 */
async function insertVote(userId, postId) {
  const params = [null, userId, postId];
  const sql = mysqlPool.format('INSERT INTO `votes` (`vote_id`, `user_id`, `post_id`, `status`, `created_at`) VALUES (?, ?, ?, 0, current_timestamp());', params);
  return mysqlPool.query(sql);
}

/**
 * @param {number} userId - User ID
 * @param {number} postId - Post ID
 * @returns {Object}
 */
async function getVote(userId, postId) {
  const params = [userId, postId];
  const sql = mysqlPool.format('SELECT * FROM `votes` WHERE `user_id` = ? AND `post_id` = ?', params);
  return mysqlPool.query(sql);
}

async function getTopVote() {
  const params = [process.env.CONFIG_MINIMUM_DELVOTE];
  const sql = mysqlPool.format('SELECT `vote_id`, `post_id`, COUNT(DISTINCT(`user_id`)) as `total_vote` FROM `votes` WHERE `status` = 0 AND `created_at` >= NOW() - INTERVAL 1 DAY GROUP BY `post_id` HAVING `total_vote` >= ? ORDER BY `total_vote` DESC LIMIT 1;', params);
  return mysqlPool.query(sql);
}

/**
 * @param {number} postId - Post ID
 * @returns {Object}
 */
async function updateVoteByPostId(postId) {
  const params = [postId];
  const sql = mysqlPool.format('UPDATE `votes` SET `status` = 1 WHERE `votes`.`post_id` = ?;', params);
  return mysqlPool.query(sql);
}

module.exports = {
  insertVote,
  getVote,
  getTopVote,
  updateVoteByPostId,
};
