const {
  activity,
  isExpectEventType,
  Sentry,
  Tracing,
} = require('./config');
const { TweetCreateEvents } = require('./events/tweet_create_events');
const { DirectMessageEvents } = require('./events/direct_message_events');
const { taskPostTweet } = require('./tasks/postTweet');
const { taskDeleteTweet } = require('./tasks/deleteTweet');
const { taskDelvoteTweet } = require('./tasks/delvoteTweet');

async function main() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Integrations.Mysql(),
    ],
    tracesSampleRate: 1.0,
  });

  // Auto Tweet every X seconds
  taskPostTweet();
  taskDeleteTweet();
  taskDelvoteTweet();

  activity.onEvent((event) => {
    if (isExpectEventType(event, 'tweet_create_events')) {
      TweetCreateEvents(event);
    }

    if (isExpectEventType(event, 'direct_message_events')) {
      DirectMessageEvents(event);
    }
  });
  await activity.listen(process.env.PORT || 3000);

  // await activity.deleteAllWebhooks();
  // await activity.registerWebhook(process.env.WEBHOOK_URL);
  // await activity.subscribe();

  // const listWebhook = await activity.listWebhooks();
  // console.log(listWebhook['environments'][0]['webhooks']);
}

main();
