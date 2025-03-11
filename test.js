const { getUserAccessToken } = require("./index");

const go = async () => {
  console.log(
    await getUserAccessToken(process.env.EMAIL, process.env.PASSWORD)
  );
};

go();
