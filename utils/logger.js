const info = (message) => {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  console.log(message);
};

const error = (message) => {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  console.error(message);
};

const test = (message) => {
  if (process.env.NODE_ENV === "test") {
    console.log(message);
  }
};

module.exports = {
  info,
  error,
  test,
};
