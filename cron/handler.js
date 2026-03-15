const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { decrypt } = require("./encryption");
const { makeReservation, findOpenTime } = require("./embrace");
const { sendBookingNotification, sendAvailabilityNotification } = require("./twilio");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const USERS_TABLE = process.env.USERS_TABLE;
const APPOINTMENTS_TABLE = process.env.APPOINTMENTS_TABLE;

exports.handler = async () => {
  try {
    const now = new Date().toISOString();

    // Scan for unfulfilled appointments
    const result = await docClient.send(
      new ScanCommand({
        TableName: APPOINTMENTS_TABLE,
        FilterExpression:
          "attribute_not_exists(timeFulfilled) OR timeFulfilled = :null",
        ExpressionAttributeValues: {
          ":null": null,
        },
      })
    );

    // Filter for appointments with at least one future time
    const appointments = (result.Items || []).filter((item) =>
      item.times.some((t) => t >= now)
    );

    console.log(
      `> ${appointments.length} pending appointment request(s) found`
    );

    for (const appointment of appointments) {
      try {
        const minSpots = appointment.minSpots || 1;
        const autoBook = appointment.autoBook !== false; // default true
        const result = await findOpenTime(appointment.times, minSpots);
        const [classId, timeToBook, availableSpots] = result;

        if (classId) {
          // Get user credentials
          const userResult = await docClient.send(
            new GetCommand({
              TableName: USERS_TABLE,
              Key: { userId: appointment.userId },
            })
          );
          const user = userResult.Item;

          if (!user) {
            console.error(
              `> User not found for appointment ${appointment.appointmentId}`
            );
            continue;
          }

          if (autoBook) {
            // Auto-book mode: make reservation and mark fulfilled
            await makeReservation(
              classId,
              user.username,
              decrypt(user.password)
            );

            // Update appointment as fulfilled
            await docClient.send(
              new UpdateCommand({
                TableName: APPOINTMENTS_TABLE,
                Key: {
                  userId: appointment.userId,
                  appointmentId: appointment.appointmentId,
                },
                UpdateExpression:
                  "SET timeFulfilled = :time, fulfilledAt = :now, classIdFulfilled = :classId, lastChecked = :now, updatedAt = :now",
                ExpressionAttributeValues: {
                  ":time": timeToBook,
                  ":now": new Date().toISOString(),
                  ":classId": String(classId),
                },
              })
            );

            // Send SMS confirmation
            if (user.enableTextNotifications && user.phoneNumber) {
              await sendBookingNotification(user.phoneNumber, {
                timeFulfilled: timeToBook,
              });
            }
          } else {
            // Notify-only mode: just send an SMS alert, don't book
            // Throttle: don't re-notify if we already sent one in the last 60 minutes
            const lastNotified = appointment.lastNotifiedAt
              ? new Date(appointment.lastNotifiedAt).getTime()
              : 0;
            const minutesSinceNotify = (Date.now() - lastNotified) / 1000 / 60;

            if (minutesSinceNotify < 60) {
              console.log(`> notify-only: spot found but already notified ${Math.round(minutesSinceNotify)}m ago, skipping SMS`);
              continue;
            }

            console.log(`> notify-only mode: spot found at ${timeToBook}, sending SMS`);

            if (user.enableTextNotifications && user.phoneNumber) {
              await sendAvailabilityNotification(
                user.phoneNumber,
                { availableTime: timeToBook },
                availableSpots
              );
            }

            // Update lastChecked so we don't spam every 5 minutes
            await docClient.send(
              new UpdateCommand({
                TableName: APPOINTMENTS_TABLE,
                Key: {
                  userId: appointment.userId,
                  appointmentId: appointment.appointmentId,
                },
                UpdateExpression: "SET lastChecked = :now, updatedAt = :now, lastNotifiedAt = :now",
                ExpressionAttributeValues: {
                  ":now": new Date().toISOString(),
                },
              })
            );
          }
        }
      } catch (e) {
        console.error(e);
        console.error(
          `> Error attempting to book appointment ${appointment.appointmentId}`
        );

        // Record polling error
        const errors = appointment.pollingErrors || [];
        errors.push(e.message || String(e));

        await docClient.send(
          new UpdateCommand({
            TableName: APPOINTMENTS_TABLE,
            Key: {
              userId: appointment.userId,
              appointmentId: appointment.appointmentId,
            },
            UpdateExpression:
              "SET pollingErrors = :errors, lastChecked = :now, updatedAt = :now",
            ExpressionAttributeValues: {
              ":errors": errors,
              ":now": new Date().toISOString(),
            },
          })
        );
      }
    }

    return { statusCode: 200, body: "OK" };
  } catch (e) {
    console.error("The whole thing failed :(");
    console.error(e);
    throw e;
  }
};
