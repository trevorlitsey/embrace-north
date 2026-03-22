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

const sendAvailabilityNotification = async (phoneNumber, appointment, availableSpots, groupedTimes = null) => {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  let body;

  if (groupedTimes && groupedTimes.length > 1) {
    // Multiple nearby classes collectively have enough spots
    const formattedTimes = groupedTimes
      .map((t) => DateTime.fromISO(t).setZone("America/Chicago").toFormat("h:mm a"))
      .join(" and ");
    const formattedDate = DateTime.fromISO(groupedTimes[0])
      .setZone("America/Chicago")
      .toFormat("EEEE, MMMM d, yyyy");
    body = `ENWT: Spots are available on ${formattedDate} at ${formattedTimes} (${availableSpots} total spot${availableSpots !== 1 ? "s" : ""} across those classes). Open the app to book: https://embrace.trevor.fail`;
  } else {
    const formattedTime = DateTime.fromISO(appointment.availableTime)
      .setZone("America/Chicago")
      .toFormat("EEEE, MMMM d, yyyy 'at' h:mm a");
    body = `ENWT: A spot is available at ${formattedTime} (${availableSpots} spot${availableSpots !== 1 ? "s" : ""} open). Open the app to book it: https://embrace.trevor.fail`;
  }

  await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `+1${phoneNumber}`,
  });

  console.log(`> availability SMS sent to ${phoneNumber}`);
};

module.exports = { sendBookingNotification, sendAvailabilityNotification };
