const {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { docClient } = require("./dynamodb");

const APPOINTMENTS_TABLE =
  process.env.APPOINTMENTS_TABLE || "EmbraceNorth-Appointments";

const createAppointment = async ({ userId, appointmentId, times, autoBook = true, minSpots = 1 }) => {
  const now = new Date().toISOString();
  const item = {
    userId,
    appointmentId,
    times,
    autoBook,
    minSpots,
    timeFulfilled: null,
    fulfilledAt: null,
    classIdFulfilled: null,
    pollingErrors: [],
    lastChecked: null,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: APPOINTMENTS_TABLE,
      Item: item,
    })
  );

  return item;
};

const getAppointmentById = async (userId, appointmentId) => {
  const result = await docClient.send(
    new GetCommand({
      TableName: APPOINTMENTS_TABLE,
      Key: { userId, appointmentId },
    })
  );
  return result.Item || null;
};

const getAppointmentsByUserId = async (userId) => {
  const result = await docClient.send(
    new QueryCommand({
      TableName: APPOINTMENTS_TABLE,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    })
  );
  return result.Items || [];
};

const updateAppointment = async (userId, appointmentId, updates) => {
  const expressions = [];
  const names = {};
  const values = {};

  Object.entries(updates).forEach(([key, value]) => {
    expressions.push(`#${key} = :${key}`);
    names[`#${key}`] = key;
    values[`:${key}`] = value;
  });

  expressions.push("#updatedAt = :updatedAt");
  names["#updatedAt"] = "updatedAt";
  values[":updatedAt"] = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: APPOINTMENTS_TABLE,
      Key: { userId, appointmentId },
      UpdateExpression: `SET ${expressions.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes;
};

const deleteAppointment = async (userId, appointmentId) => {
  await docClient.send(
    new DeleteCommand({
      TableName: APPOINTMENTS_TABLE,
      Key: { userId, appointmentId },
    })
  );
};

module.exports = {
  createAppointment,
  getAppointmentById,
  getAppointmentsByUserId,
  updateAppointment,
  deleteAppointment,
};
