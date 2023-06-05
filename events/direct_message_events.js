const { DMGetSenderID, DMGetMessageData } = require('../utils/direct_messages');
const { binusCommand } = require('../commands/binus');
const { unsendCommand } = require('../commands/unsend');
const { undefinedCommand } = require('../commands/undefined');
const { banCommand, unbanCommand } = require('../commands/ban');
const { insertUser, getUserInfoByTwitterId } = require('../models/userModels');
const { getTimeFromUnixTime } = require('../utils/dayjs');
const { SaveFile } = require('../utils/file');

async function DirectMessageEvents(event) {
  const senderId = DMGetSenderID(event);

  if (senderId === process.env.TWITTER_BOT_ID) {
    return;
  }

  const env = process.env.NODE_ENV || 'development';
  if (env === 'development') {
    const fullPath = `${process.cwd()}/${process.env.FILE_PATH}`;
    await SaveFile(fullPath, 'temp.json', event, true);
  }

  let count = false;
  // eslint-disable-next-line no-restricted-syntax, no-unused-vars
  for (const [key, value] of Object.entries(event['users'])) {
    if (count === false) {
      const twitterId = value['id'];
      const followersCount = value['followers_count'];
      const friendsCount = value['friends_count'];
      const statusesCount = value['statuses_count'];
      const createdTimestamp = getTimeFromUnixTime(value['created_timestamp']);
      // eslint-disable-next-line no-await-in-loop
      await insertUser(twitterId, followersCount, friendsCount, statusesCount, createdTimestamp);
    }
    count = true;
  }

  const userInfo = await getUserInfoByTwitterId(senderId);
  const userBlocked = userInfo[0][0]['is_blocked'];

  if (userBlocked === 1) {
    return;
  }

  const message = DMGetMessageData(event).toLowerCase();

  if (message.includes('binus!') === true || message.includes('struggle!') === true) {
    binusCommand(event);
  } else if (message.includes('/unsend') === true) {
    unsendCommand(event);
  } else if (message.includes('/ban') === true) {
    banCommand(event);
  } else if (message.includes('/unban') === true) {
    unbanCommand(event);
  } else {
    undefinedCommand(event);
  }

  console.log('[INFO] Received New Message');
}

module.exports = { DirectMessageEvents };
