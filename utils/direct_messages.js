const { client } = require('../config');
const { getUniqueSlug } = require('./file');

function DMGetSenderID(event) {
  const senderID = event['direct_message_events']['0']['message_create']['sender_id'];
  return senderID;
}

function DMGetSenderUsername(event) {
  const senderID = DMGetSenderID(event);
  const username = event['users'][senderID]['screen_name'];
  return username;
}

function DMGetMessageData(event) {
  const { text } = event['direct_message_events']['0']['message_create']['message_data'];
  return text;
}

async function DMSend(data) {
  return new Promise((resolve, reject) => {
    try {
      const newData = {
        recipient_id: data.recipient_id,
        text: `[${getUniqueSlug()}] ${data.text}`,
      };
      const response = client.v1.sendDm(newData);
      resolve(response);
    } catch (error) {
      reject(error);
    }
  });
}

function DMGetEntities(event) {
  return event['direct_message_events']['0']['message_create']['message_data']['entities'];
}

async function DMSavePhoto(urlDownload) {
  return new Promise((resolve, reject) => {
    try {
      const response = client.v1.downloadDmImage(urlDownload);
      resolve(response);
    } catch (error) {
      reject(error);
    }
  });
}

function isQuickReplyResponse(event) {
  return !!event.direct_message_events[0].message_create.message_data.quick_reply_response;
}

function getMetadata(event) {
  const metaData = event['direct_message_events']['0']['message_create']['message_data']['quick_reply_response']['metadata'];
  return metaData;
}

function sendQuickReply(senderID) {
  const data = {
    // Mandatory
    recipient_id: senderID,
    // Other parameters are collapsed into {message_data} of payload
    text: '[BOT] pastikan sudah membaca rules, yakin mau ngirim?',
    quick_reply: {
      type: 'options',
      options: [
        {
          label: '✅ Yakin',
          description: 'Iya, sudah dibaca.',
          metadata: 'yes',
        },
        {
          label: '❌ Tidak',
          description: 'Belum dibaca.',
          metadata: 'no',
        },
      ],
    },
  };
  return DMSend(data);
}

module.exports = {
  DMGetSenderID,
  DMGetSenderUsername,
  DMGetMessageData,
  DMSend,
  DMGetEntities,
  DMSavePhoto,
  isQuickReplyResponse,
  getMetadata,
  sendQuickReply,
};
