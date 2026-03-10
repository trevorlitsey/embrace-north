const {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { docClient } = require("./dynamodb");

const USERS_TABLE = process.env.USERS_TABLE || "EmbraceNorth-Users";

const createUser = async ({ userId, username, password, phoneNumber, enableTextNotifications }) => {
  const now = new Date().toISOString();
  const item = {
    userId,
    username,
    password,
    phoneNumber: phoneNumber || "",
    enableTextNotifications: enableTextNotifications || false,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: USERS_TABLE,
      Item: item,
      ConditionExpression: "attribute_not_exists(userId)",
    })
  );

  return item;
};

const getUserById = async (userId) => {
  const result = await docClient.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
    })
  );
  return result.Item || null;
};

const getUserByUsername = async (username) => {
  const result = await docClient.send(
    new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: "username-index",
      KeyConditionExpression: "username = :username",
      ExpressionAttributeValues: {
        ":username": username,
      },
    })
  );
  return result.Items?.[0] || null;
};

const updateUser = async (userId, updates) => {
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
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: `SET ${expressions.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes;
};

module.exports = {
  createUser,
  getUserById,
  getUserByUsername,
  updateUser,
};
