const { mysqlPool } = require('../config');

/**
 * @param {string} text - Menfess Text
 * @param {string} photo - Tweet Media Photo
 * @param {string} quoteId - Tweet Quote ID
 * @returns {Object}
 */
async function insertPost(
  text,
  photo = null,
  quoteId = null,
) {
  const params = [null, text, photo, quoteId];
  const sql = mysqlPool.format('INSERT INTO `posts` (`post_id`, `tweet_text`, `tweet_media_photo`, `tweet_quote_id`) VALUES (?, ?, ?, ?);', params);
  return mysqlPool.query(sql);
}

/**
 * @param {number} postId - Post ID
 * @returns {Object}
 */
async function getPostByPostId(postId) {
  const params = [postId];
  const sql = mysqlPool.format('SELECT * FROM `posts` WHERE `post_id` = ?;', params);
  return mysqlPool.query(sql);
}

/**
 * @param {string} tweetText - Tweet Text
 * @returns {Object}
 */
async function getPostByText(tweetText) {
  const params = [tweetText];
  const sql = mysqlPool.format('SELECT `p`.`post_id` FROM `posts` as `p` INNER JOIN `actions` as `a` ON `p`.`post_id` = `a`.`target_id` WHERE `p`.`tweet_text` = ? AND `a`.`type` = 1 AND `a`.`created_at` >= NOW() - INTERVAL 14 DAY;', params);
  return mysqlPool.query(sql);
}

module.exports = {
  insertPost,
  getPostByPostId,
  getPostByText,
};
