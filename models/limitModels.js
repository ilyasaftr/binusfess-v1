const { mysqlPool } = require('../config');
const { convertUnixTime } = require('../utils/dayjs');

/**
 * @param {string} limitName - Limit Endpoint
 * @param {number} limitQuote - API Rate Limit Maximum
 * @param {number} limitRemaining - API Rate Limit Remaining
 * @param {Date} limitResetAt - API Rate Limit Reset Time
 * @returns {Object}
 */
async function insertLimit(limitName, limitQuote, limitRemaining, limitResetAt) {
  const limitResetAtFormat = convertUnixTime(limitResetAt);
  const params = [limitName, limitQuote, limitRemaining, limitResetAtFormat, null, limitQuote,
    limitRemaining, limitResetAtFormat];
  const sql = mysqlPool.format('INSERT INTO `ratelimit` (`endpoint`, `api_limit`, `api_remaining`, `reseted_at`, `updated_at`) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `api_limit` = ?, `api_remaining` = ?, `reseted_at` = ?;', params);
  return mysqlPool.query(sql);
}

/**
 * @param {string} limitName - Limit Endpoint
 * @returns {Object}
 */
async function getLimitByName(limitName) {
  const params = [limitName];
  const sql = mysqlPool.format('SELECT * FROM `ratelimit` WHERE `endpoint` = ?', params);
  return mysqlPool.query(sql);
}

module.exports = {
  insertLimit,
  getLimitByName,
};
