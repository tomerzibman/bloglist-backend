const bcrypt = require("bcrypt");
const userRouter = require("express").Router();
const User = require("../models/user");

userRouter.get("/", async (req, res) => {
  const users = await User.find({}).populate("blogs", {
    url: 1,
    title: 1,
    author: 1,
  });
  res.json(users);
});

userRouter.post("/", async (req, res) => {
  if (!req.body.password || typeof req.body.password !== "string") {
    return res.status(400).json({ error: "error with password" });
  } else if (req.body.password.length < 3) {
    return res.status(400).json({ error: "password too short" });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(req.body.password, saltRounds);

  const newUser = new User({
    username: req.body.username,
    name: req.body.name,
    passwordHash: passwordHash,
  });

  const savedUser = await newUser.save();
  res.status(201).json(savedUser);
});

module.exports = userRouter;
