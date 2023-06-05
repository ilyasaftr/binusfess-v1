require('dotenv').config();
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const mysql = require('mysql2');
const twitterText = require('twitter-text');
const { Activity, isExpectEventType } = require('twict');
const { TwitterApi, ApiResponseError } = require('twitter-api-v2');
const { TwitterApiRateLimitPlugin } = require('@twitter-api-v2/plugin-rate-limit');

const rateLimitPlugin = new TwitterApiRateLimitPlugin();

const activity = new Activity(process.env.TWITTER_ENVIRONMENT_NAME, {
  consumerKey: process.env.CONSUMER_KEY,
  consumerSecret: process.env.CONSUMER_SECRET_KEY,
  token: process.env.OAUTH_TOKEN_KEY,
  tokenSecret: process.env.OAUTH_TOKEN_SECRET_KEY,
});

const client = new TwitterApi({
  appKey: process.env.CONSUMER_KEY,
  appSecret: process.env.CONSUMER_SECRET_KEY,
  accessToken: process.env.OAUTH_TOKEN_KEY,
  accessSecret: process.env.OAUTH_TOKEN_SECRET_KEY,
}, { plugins: [rateLimitPlugin] });

const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0,
}).promise();

module.exports = {
  activity,
  client,
  isExpectEventType,
  mysqlPool,
  ApiResponseError,
  rateLimitPlugin,
  Sentry,
  Tracing,
  twitterText,
};
