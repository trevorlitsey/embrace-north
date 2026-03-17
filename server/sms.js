const axios = require("axios");

const sendSms = async (phoneNumber, body) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  await axios.post(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    new URLSearchParams({
      To: `+1${phoneNumber}`,
      From: from,
      Body: body,
    }),
    {
      auth: { username: accountSid, password: authToken },
    }
  );

  console.log(`> SMS sent to ${phoneNumber}`);
};

module.exports = { sendSms };
