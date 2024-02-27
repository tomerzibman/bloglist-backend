const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("express-async-errors");
const blogRouter = require("./controllers/blogs");
const userRouter = require("./controllers/users");
const loginRouter = require("./controllers/login");
const config = require("./utils/config");
const middlewear = require("./utils/middlewear");
const logger = require("./utils/logger");

const mongoUrl = config.MONGODB_URI;
mongoose.connect(mongoUrl).then(() => {
  logger.info("connected to mongoDB");
});

app.use(cors());
app.use(express.json());
app.use(middlewear.tokenExtractor);
app.use("/api/blogs", blogRouter);
app.use("/api/users", userRouter);
app.use("/api/login", loginRouter);

if (process.env.NODE_ENV === "test") {
  const testingRouter = require("./controllers/testing");
  app.use("/api/testing", testingRouter);
}

app.use(middlewear.errorHandler);

module.exports = app;
