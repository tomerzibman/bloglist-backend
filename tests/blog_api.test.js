const mongoose = require("mongoose");
const app = require("../app");
const supertest = require("supertest");
const Blog = require("../models/blog");
const User = require("../models/user");
const helper = require("./test_helper");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const api = supertest(app);

let token;
let user;
beforeEach(async () => {
  // Delete the users in the DB
  await User.deleteMany({});

  // Create a new root user
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash("test", saltRounds);
  const newUser = new User({
    username: "root",
    name: "root",
    passwordHash: passwordHash,
  });
  const savedUser = await newUser.save();

  // Create a token for the root user
  const userForToken = {
    username: savedUser.username,
    id: savedUser._id,
  };
  token = jwt.sign(userForToken, process.env.SECRET, {
    expiresIn: 60 * 60,
  });
  token = `Bearer ${token}`;

  // Delete the blogs in the DB
  await Blog.deleteMany({});

  // Create new blogs for the DB and attach them to the user and vice versa
  const blogObjects = helper.initialBlogs.map((blog) => {
    blog.user = savedUser._id;
    return new Blog(blog);
  });
  const promiseArray = blogObjects.map((blog) => blog.save());
  const savedBlogs = await Promise.all(promiseArray);
  const blogIds = savedBlogs.map((savedBlog) => savedBlog._id);
  savedUser.blogs = savedUser.blogs.concat(blogIds);
  user = await savedUser.save();
});

test("blogs returned as JSON", async () => {
  await api
    .get("/api/blogs")
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

test("all blogs are returned", async () => {
  const response = await api.get("/api/blogs");

  expect(response.body).toHaveLength(helper.initialBlogs.length);
});

test("blogs are the right content", async () => {
  const blogs = await api
    .get("/api/blogs")
    .expect(200)
    .expect("Content-Type", /application\/json/);
  const titles = blogs.body.map((blog) => blog.title);
  helper.initialBlogs.forEach((blog) => {
    expect(titles).toContain(blog.title);
  });
});

test("a valid blog can be added", async () => {
  const newBlog = {
    title: "fukumean",
    author: "gunna",
    url: "www.youngGunnaWunnaDripSplash.com",
    likes: 100,
  };
  const blogsAtStart = await helper.blogsInDb();

  await api
    .post("/api/blogs")
    .send(newBlog)
    .set({ Authorization: token })
    .expect(201);

  const blogsAtEnd = await helper.blogsInDb();
  expect(blogsAtEnd.length).toBe(blogsAtStart.length + 1);

  const titles = blogsAtEnd.map((blog) => blog.title);
  expect(titles).toContain(newBlog.title);
});

test("unique identifier property of blog is named id", async () => {
  const response = await api.get("/api/blogs");
  const blogToVerify = response.body[0];
  expect(blogToVerify.id).toBeDefined();
});

test("blog with missing likes defaults to 0 likes", async () => {
  const blogToAdd = {
    title: "Missing likes",
    author: "Tomer",
    url: "www.noLikes.com",
  };

  const response = await api
    .post("/api/blogs")
    .send(blogToAdd)
    .set({ Authorization: token });
  const addedBlog = response.body;
  expect(addedBlog.likes).toBeDefined();
  expect(addedBlog.likes).toBe(0);
});

test("blog with missing title responds with error 400", async () => {
  const blogMissingTitle = {
    author: "Tomer",
    url: "www.misssingTitle.com",
    likes: 5,
  };

  await api
    .post("/api/blogs")
    .send(blogMissingTitle)
    .set({ Authorization: token })
    .expect(400);
});

test("blog with missing url responds with error 400", async () => {
  const blogMissingURL = {
    title: "missing url",
    author: "Tomer",
    likes: 5,
  };

  await api
    .post("/api/blogs")
    .send(blogMissingURL)
    .set({ Authorization: token })
    .expect(400);
});

test("blog will successfully delete with statuscode 204 if id is valid and blog belongs to the authenticated user", async () => {
  const blogsAtStart = await helper.blogsInDb();
  const blogToDelete = blogsAtStart[0];
  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .set({ Authorization: token })
    .expect(204);

  const blogsAtEnd = await helper.blogsInDb();
  expect(blogsAtEnd.length).toBe(blogsAtStart.length - 1);
});

test("blog will unsuccessfully delete with statuscode 401 if the user is not authenticated", async () => {
  const otherToken = await helper.createOtherUserAndToken();

  // Get blogs at the start and choose the first one to delete
  const blogsAtStart = await helper.blogsInDb();
  const blogToDelete = blogsAtStart[0];

  // Make the call to delete the blog, giving the token of the user who didn't write the blog
  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .set({ Authorization: `Bearer ${otherToken}` })
    .expect(401);

  // Expect no change in the DB
  const blogsAtEnd = await helper.blogsInDb();
  expect(blogsAtEnd.length).toBe(blogsAtStart.length);
}, 10000);

test("blog's likes will update successfully when given valid id and likes", async () => {
  const blogsAtStart = await helper.blogsInDb();
  const blogToUpdate = blogsAtStart[0];
  const bodyToSend = {
    likes: 6969,
  };
  const result = await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(bodyToSend)
    .expect(200);

  const updatedBlog = result.body;
  expect(updatedBlog.likes).toBe(bodyToSend.likes);
}, 10000);

test("blog's likes will not update when given valid id and no likes", async () => {
  const blogsAtStart = await helper.blogsInDb();
  const blogToUpdate = blogsAtStart[0];
  const bodyToSend = {};
  await api.put(`/api/blogs/${blogToUpdate.id}`).send(bodyToSend).expect(400);
}, 10000);

test("blog's likes will not update when given a non existing id with 404 status", async () => {
  const bodyToSend = {
    likes: 20,
  };
  const invalidId = await helper.nonExistingBlogId();
  await api.put(`/api/blogs/${invalidId}`).send(bodyToSend).expect(404);
}, 30000);

afterAll(async () => {
  await mongoose.connection.close();
});
