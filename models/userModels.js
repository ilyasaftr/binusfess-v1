const { generateUsername } = require('unique-username-generator');
const { mysqlPool } = require('../config');

/**
 * @param {string} twitteriD - Twitter ID from Twitter api
 * @returns {Object}
 */
async function getUserInfoByTwitterId(twitterId) {
  const params = [twitterId];
  const sql = mysqlPool.format('SELECT *  FROM `users` WHERE `twitter_id` = ?;', params);
  return mysqlPool.query(sql);
}

/**
 * @param {number} userId - User ID
 * @param {string} username - from unique-username-generator package
 * @param {number} followersCount - Followers Count from Twitter api
 * @param {number} followingCount - Following Count from Twitter api
 * @param {number} statusCount - Status Count from Twitter api
 * @returns {Object}
 */
async function updateUserByTwitterId(twitterId, username, followersCount, followingCount, statusCount) {
  if (username !== null) {
    const params = [username, followersCount, followingCount, statusCount, twitterId];
    const sql = mysqlPool.format('UPDATE `users` SET `username` = ?, `followers_count` = ?, `following_count` = ?, `status_count` = ? WHERE `twitter_id` = ?;', params);
    return mysqlPool.query(sql);
  }
  const params = [followersCount, followingCount, statusCount, twitterId];
  const sql = mysqlPool.format('UPDATE `users` SET `followers_count` = ?, `following_count` = ?, `status_count` = ? WHERE `twitter_id` = ?;', params);
  return mysqlPool.query(sql);
}

/**
 * @param {number} userId - User ID
 * @param {number} isBlocked - from unique-username-generator package
 * @returns {Object}
 */
async function banUserByUserId(twitterId, isBlocked = 1) {
  const params = [isBlocked, twitterId];
  const sql = mysqlPool.format('UPDATE `users` SET `is_blocked` = ? WHERE `user_id` = ?;', params);
  return mysqlPool.query(sql);
}

/**
 * @param {string} twitteriD - Twitter ID from Twitter api
 * @param {number} followersCount - Followers Count from Twitter api
 * @param {number} followingCount - Following Count from Twitter api
 * @param {number} statusCount - Status Count from Twitter api
 * @param {Date} createdAt - Account Created Date from Twitter api
 * @returns {Object}
 */
async function insertUser(twitterId, followersCount, followingCount, statusCount, createdAt) {
  const checkUser = await getUserInfoByTwitterId(twitterId);
  const username = generateUsername('', 6, 20);
  if (checkUser[0].length >= 1) {
    if (checkUser[0][0]['username'] === null) {
      const response = updateUserByTwitterId(twitterId, username, followersCount, followingCount, statusCount);
      return response;
    }

    const response = updateUserByTwitterId(twitterId, null, followersCount, followingCount, statusCount);
    return response;
  }
  const params = [null, twitterId, username, followersCount, followingCount, statusCount,
    createdAt];
  const sql = mysqlPool.format('INSERT INTO `users` (`user_id`, `twitter_id`, `username`, `followers_count`, `following_count`, `status_count`, `is_blocked`, `is_admin`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, current_timestamp());', params);
  return mysqlPool.query(sql);
}

/**
 * @param {number} userId - User ID
 * @returns {Object}
 */
async function getUserInfoByUserId(userId) {
  const params = [userId];
  const sql = mysqlPool.format('SELECT *  FROM `users` WHERE `user_id` = ?;', params);
  return mysqlPool.query(sql);
}

module.exports = {
  insertUser,
  banUserByUserId,
  getUserInfoByTwitterId,
  getUserInfoByUserId,
  updateUserByTwitterId,
};
