const { mysqlPool } = require('../config');

/**
 * @param {number} userId - User ID
 * @param {number} postId - Post ID
 * @param {number} type - 1 = create post 2 = delete post
 * @param {string} type - format YYYY-MM-DD HH:mm:ss (dayjs)
 * @returns {Object}
 */
async function insertAction(
  userId,
  postId,
  type,
  scheduledAt,
) {
  const params = [null, userId, postId, type, 0, scheduledAt, null];
  const sql = mysqlPool.format('INSERT INTO `actions` (`action_id`, `user_id`, `target_id`, `type`, `status`, `created_at`, `scheduled_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, current_timestamp(), ?, ?);', params);
  return mysqlPool.query(sql);
}

/**
 * @param {number} targetId - Target ID
 * @param {number} type - 1 = create post 2 = delete post
 * @returns {Object}
 */
async function getActionByTargetId(targetId, type) {
  const params = [targetId, type];
  const sql = mysqlPool.format('SELECT * FROM `actions` WHERE `target_id` = ? AND `type` = ?;', params);
  return mysqlPool.query(sql);
}

/**
 * @param {number} type - 1 = create post 2 = delete post
 * @returns {Object}
 */
async function getLastAction(type) {
  const params = [type];
  const sql = mysqlPool.format('SELECT * FROM `actions` WHERE `status` = 0 AND `type` = ? AND `scheduled_at` > NOW() ORDER BY `scheduled_at` DESC LIMIT 1;', params);
  return mysqlPool.query(sql);
}

/**
 * @param {number} userId - User ID
 * @param {number} type - 1 = create post 2 = delete post
 * @param {number} status - status action 0 = pending 1 = success 2 = canceled
 * @returns {Object}
 */
async function getLastActionByUserId(userId, type, status = null) {
  if (status !== null) {
    const params = [userId, type, status];
    const sql = mysqlPool.format('SELECT * FROM `actions` WHERE `user_id` = ? AND `type` = ? AND `status` = ? ORDER BY `action_id` DESC LIMIT 1;', params);
    return mysqlPool.query(sql);
  }

  const params = [userId, type];
  const sql = mysqlPool.format('SELECT * FROM `actions` WHERE `user_id` = ? AND `type` = ? ORDER BY `action_id` DESC LIMIT 1;', params);
  return mysqlPool.query(sql);
}

/**
 * @param {string} time - format YYYY-MM-DD HH:mm:ss (dayjs)
 * @param {number} type - 1 = create post 2 = delete post
 * @param {number} status - status action 0 = pending 1 = success 2 = canceled
 * @returns {Object}
 */
async function getActionByTime(time, type, status) {
  const params = [time, type, status];
  const sql = mysqlPool.format('SELECT * FROM `actions` WHERE `scheduled_at` <= ? AND `type` = ? AND `status` = ? ORDER BY `target_id` ASC LIMIT 1;', params);
  return mysqlPool.query(sql);
}

/**
 * @param {number} actionId - Action ID
 * @param {number} status - status action 0 = pending 1 = success 2 = canceled
 * @returns {Object}
 */
async function updateActionById(actionId, status) {
  const params = [status, actionId];
  const sql = mysqlPool.format('UPDATE `actions` SET `status` = ? WHERE `action_id` = ?;', params);
  return mysqlPool.query(sql);
}

module.exports = {
  insertAction,
  getActionByTargetId,
  getLastAction,
  getLastActionByUserId,
  getActionByTime,
  updateActionById,
};
