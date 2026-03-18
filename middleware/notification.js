// Import necessary modules
const axios = require('axios');
const Lsdc = require('../models/lsdc');
// Function to send batch notifications
async function sendBatchNotification(notificationData) {
  try {
    // Fetch all users with a push token
    const users = await Lsdc.find({ pushToken: { $exists: true, $ne: null } });
    const pushTokens = users.map(user => user.pushToken);

    // Send notifications in batches
    await sendNotifications(pushTokens, notificationData);
  } catch (error) {
    console.error('Error fetching users or sending notifications:', error);
  }
}

// Helper function to send notifications in batches of 100
async function sendNotifications(pushTokens, notificationData) {
  const expoPushEndpoint = 'https://exp.host/--/api/v2/push/send';

  // Split tokens into batches of 100
  const tokenBatches = [];
  while (pushTokens.length) {
    tokenBatches.push(pushTokens.splice(0, 100));
  }

  for (const batch of tokenBatches) {
    const messages = batch.map(token => ({
      to: token,
      sound: 'default',
      title: notificationData.title,
      body: notificationData.body,
      data: notificationData.data,
    }));

    try {
      await axios.post(expoPushEndpoint, messages, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      console.log('Batch sent successfully');
    } catch (error) {
      console.error('Error sending batch notifications:', error);
    }
  }
}

// Export the function to use it in other files
module.exports = sendBatchNotification;
