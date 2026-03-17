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
    body: `Your Embrace North class is booked for ${formattedTime} 🎉 See you there!`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `+1${phoneNumber}`,
  });

  console.log(`> SMS sent to ${phoneNumber}`);
};

const sendAvailabilityNotification = async (phoneNumber, appointment, availableSpots) => {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const formattedTime = DateTime.fromISO(appointment.availableTime)
    .setZone("America/Chicago")
    .toFormat("EEEE, MMMM d, yyyy 'at' h:mm a");

  await client.messages.create({
    body: `ENWT: A spot is available at ${formattedTime} (${availableSpots} spot${availableSpots !== 1 ? "s" : ""} open). Open the app to book it: https://embrace.trevorlitsey.com`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `+1${phoneNumber}`,
  });

  console.log(`> availability SMS sent to ${phoneNumber}`);
};

module.exports = { sendBookingNotification, sendAvailabilityNotification };
