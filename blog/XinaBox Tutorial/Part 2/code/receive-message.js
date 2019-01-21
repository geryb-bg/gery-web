const PubSub = require('@google-cloud/pubsub');

const pubsub = new PubSub({
    projectId: 'my-project',
    keyFilename: 'path-to-my-service-account.json'
});
const subscriptionName = 'my-subscription';
const subscription = pubsub.subscription(subscriptionName);

const messageHandler = (message) => {
    console.log(`message received ${message.data}`);
    message.ack();
};

subscription.on(`message`, messageHandler);

process.on('SIGINT', function() {
    console.log('Closing connection. Goodbye!');
    subscription.removeListener('message', messageHandler);
    process.exit();
});