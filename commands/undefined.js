const { DMGetSenderID, DMSend } = require('../utils/direct_messages');
const { getUserInfoByTwitterId } = require('../models/userModels');
const { getLastActionByUserId } = require('../models/actionModels');

async function undefinedCommand(event) {
  const twitterId = DMGetSenderID(event);

  const userInfo = await getUserInfoByTwitterId(twitterId);
  const userId = userInfo[0][0]['user_id'];
  const userBlocked = userInfo[0][0]['is_blocked'];

  if (userBlocked === 1) {
    return;
  }

  const response = await getLastActionByUserId(userId, 1, 1);
  if (response[0].length <= 0) {
    await DMSend({
      recipient_id: twitterId,
      text: 'gunakan kata yang mengandung "binus!" untuk ngirim menfess.',
    });
  }
}

module.exports = { undefinedCommand };
