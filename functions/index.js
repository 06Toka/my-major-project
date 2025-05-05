const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendReplyNotification = functions.firestore
  .document("topics/{topicId}/replies/{replyId}")
  .onCreate(async (snapshot, context) => {
    const replyData = snapshot.data();
    const topicId = context.params.topicId;

    // Get the topic details
    const topicSnapshot = await admin.firestore().collection("topics").doc(topicId).get();
    const topicData = topicSnapshot.data();

    // Get the FCM token of the topic creator
    const fcmToken = topicData.fcmToken;

    // Send the notification
    const message = {
      token: fcmToken,
      notification: {
        title: "New Reply",
        body: `Someone replied to your topic: ${topicData.title}`,
      },
    };

    await admin.messaging().send(message);
    console.log("Notification sent successfully.");
  });