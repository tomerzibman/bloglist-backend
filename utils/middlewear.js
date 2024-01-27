const User = require("../models/user");
const jwt = require("jsonwebtoken");
const logger = require("./logger");

const errorHandler = (error, req, res, next) => {
  logger.error(error);
  if (error.name === "ValidationError") {
    res.status(400).json({ error: error.message });
  } else if (error.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "invalid token" });
  } else if (error.name === "TokenExpiredError") {
    return res.status(401).json({ error: "token expired" });
  }
};

const tokenExtractor = (req, res, next) => {
  const authorization = req.get("authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    req.token = authorization.replace("Bearer ", "");
  }
  next();
};

const userExtractor = async (req, res, next) => {
  const decodedToken = jwt.verify(req.token, process.env.SECRET);
  if (!decodedToken.id) {
    return res.status(401).json({ error: "invalid token" });
  }

  const user = await User.findById(decodedToken.id);
  req.user = user;
  next();
};

module.exports = {
  errorHandler,
  tokenExtractor,
  userExtractor,
};
