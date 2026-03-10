const twilio = require("twilio");
const { DateTime } = require("luxon");

const sendBookingNotification = async (phoneNumber, appointment) => {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const formattedTime = DateTime.fromISO(appointment.timeFulfilled)
    .setZone("America/Chicago")
    .toFormat("EEEE, MMMM d, yyyy 'at' h:mm a");

  await client.messages.create({
    body: `ENWT: Your appointment has been successfully booked for ${formattedTime}. Use the Embrace North app to manage your booked appointments.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `+1${phoneNumber}`,
  });

  console.log(`> SMS sent to ${phoneNumber}`);
};

module.exports = { sendBookingNotification };
