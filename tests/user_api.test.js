const mongoose = require("mongoose");
const User = require("../models/user");
const app = require("../app");
const supertest = require("supertest");
const helper = require("./test_helper");
const bcrypt = require("bcrypt");

const api = supertest(app);

beforeEach(async () => {
  await User.deleteMany({});
});

test("when given valid data a user is created", async () => {
  const userData = {
    username: "drankMyMilk",
    name: "Tomer Zibman",
    password: "testing",
  };

  const usersAtStart = await helper.usersInDb();
  const result = await api.post("/api/users").send(userData).expect(201);
  const usersAtEnd = await helper.usersInDb();

  expect(usersAtEnd.length).toBe(usersAtStart.length + 1);
  expect(result.body.username).toBe(userData.username);
  expect(result.body.name).toBe(userData.name);
});

test("when given invalid username creation will fail with 400", async () => {
  const userData = {
    username: "dr",
    name: "Tomer Zibman",
    password: "testing",
  };

  const usersAtStart = await helper.usersInDb();
  await api.post("/api/users").send(userData).expect(400);
  const usersAtEnd = await helper.usersInDb();

  expect(usersAtEnd.length).toBe(usersAtStart.length);
});

test("when given invalid password creation will fail with 400", async () => {
  const userData = {
    username: "drankMyMilk",
    name: "Tomer Zibman",
    password: "te",
  };

  const usersAtStart = await helper.usersInDb();
  await api.post("/api/users").send(userData).expect(400);
  const usersAtEnd = await helper.usersInDb();

  expect(usersAtEnd.length).toBe(usersAtStart.length);
});

test("when not given username creation will fail with 400", async () => {
  const userData = {
    name: "Tomer Zibman",
    password: "testing",
  };

  const usersAtStart = await helper.usersInDb();
  await api.post("/api/users").send(userData).expect(400);
  const usersAtEnd = await helper.usersInDb();

  expect(usersAtEnd.length).toBe(usersAtStart.length);
});

test("when not given password creation will fail with 400", async () => {
  const userData = {
    username: "dr",
    name: "Tomer Zibman",
  };

  const usersAtStart = await helper.usersInDb();
  await api.post("/api/users").send(userData).expect(400);
  const usersAtEnd = await helper.usersInDb();

  expect(usersAtEnd.length).toBe(usersAtStart.length);
});

afterAll(async () => {
  await mongoose.connection.close();
});

test("get all users returns all users in db", async () => {
  const hashed = await bcrypt.hash("testing", 10);
  const user1 = new User({
    username: "tomer1",
    name: "tomer1",
    passwordHashed: hashed,
  });
  await user1.save();
  const user2 = new User({
    username: "tomer2",
    name: "tomer2",
    passwordHashed: hashed,
  });
  await user2.save();

  const result = await api.get("/api/users").expect(200);
  expect(result.body.length).toBe(2);
  const usernames = result.body.map((user) => user.username);
  expect(usernames).toContain("tomer1");
  expect(usernames).toContain("tomer2");
});
