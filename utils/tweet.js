const htmlEntities = require('he');
const { client, Sentry, twitterText } = require('../config');
const { DeleteFile } = require('./file');

function getTweetSenderID(event) {
  const senderID = event['tweet_create_events']['0']['user']['id_str'];
  return senderID;
}

function getTweetText(event) {
  const senderID = event['tweet_create_events']['0']['text'];
  return senderID;
}

function getTweetReplyToStatusID(event) {
  const senderID = event['tweet_create_events']['0']['in_reply_to_status_id_str'];
  return senderID;
}

function getTweetReplyToSenderID(event) {
  const senderID = event['tweet_create_events']['0']['in_reply_to_user_id_str'];
  return senderID;
}

async function postTweetThread(tweetText, tweetMediaPhoto = null, tweetQuoteId = null) {
  const dataRequest = [];
  let mediaId = null;
  let addPhoto = false;
  let addQuote = false;

  if (tweetMediaPhoto !== null) {
    try {
      const fullPath = `${process.cwd()}/${process.env.FILE_PATH}/${tweetMediaPhoto}`;
      mediaId = await client.v1.uploadMedia(fullPath);
      await DeleteFile(fullPath);
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  const textLength = twitterText.parseTweet(tweetText).weightedLength;
  const thread = Math.ceil(Number(textLength) / 274);

  let start = 0;
  let next = 274;

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < thread; i++) {
    const tempDataRequest = [];
    const dataTweet = tweetText.substring(start, next);

    if (thread > 1) {
      const last = `(${i + 1}/${thread})`;
      const final = dataTweet.concat(' ', last);
      tempDataRequest['text'] = htmlEntities.decode(final);
    } else {
      tempDataRequest['text'] = htmlEntities.decode(dataTweet);
    }

    if (tweetMediaPhoto !== null && addPhoto === false) {
      addPhoto = true;
      tempDataRequest['media'] = {
        media_ids: [
          mediaId,
        ],
      };
    }

    if (tweetQuoteId !== null && addQuote === false) {
      addQuote = true;
      tempDataRequest['quote_tweet_id'] = tweetQuoteId;
    }

    dataRequest.push(tempDataRequest);

    start = next;
    next += 274;
  }

  return new Promise((resolve, reject) => {
    try {
      const response = client.v1.tweetThread(dataRequest);
      resolve(response);
    } catch (error) {
      Sentry.captureException(error);
      reject(error);
    }
  });
}

async function deleteTweet(tweetId) {
  return new Promise((resolve, reject) => {
    try {
      const response = client.v1.deleteTweet(tweetId);
      resolve(response);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  getTweetSenderID,
  getTweetText,
  getTweetReplyToStatusID,
  getTweetReplyToSenderID,
  postTweetThread,
  deleteTweet,
};
