const twilio = require("twilio");
const { DateTime } = require("luxon");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendBookingNotification = async (phoneNumber, appointment) => {
  try {
    const formattedTime = DateTime.fromJSDate(appointment.timeFulfilled)
      .setZone("America/Chicago")
      .toFormat("EEEE, MMMM d, yyyy 'at' h:mm a");

    const message = await client.messages.create({
      body: `ENWT: Your appointment has been successfully booked for ${formattedTime}. Use the Embrace North app to manage your booked appointments.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+1${phoneNumber}`,
    });

    return message;
  } catch (error) {
    console.error("Error sending Twilio message:", error);
    throw error;
  }
};

module.exports = {
  sendBookingNotification,
};
