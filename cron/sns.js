const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { DateTime } = require("luxon");

const snsClient = new SNSClient({});

const sendBookingNotification = async (phoneNumber, appointment) => {
  try {
    const formattedTime = DateTime.fromISO(appointment.timeFulfilled)
      .setZone("America/Chicago")
      .toFormat("EEEE, MMMM d, yyyy 'at' h:mm a");

    await snsClient.send(
      new PublishCommand({
        PhoneNumber: `+1${phoneNumber}`,
        Message: `ENWT: Your appointment has been successfully booked for ${formattedTime}. Use the Embrace North app to manage your booked appointments.`,
      })
    );

    console.log(`> SMS sent to ${phoneNumber}`);
  } catch (error) {
    console.error("Error sending SNS message:", error);
    throw error;
  }
};

module.exports = {
  sendBookingNotification,
};
