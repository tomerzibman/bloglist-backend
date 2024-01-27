const Blog = require("../models/blog");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const initialBlogs = [
  {
    title: "Blog swag 1",
    author: "Mr.Glock",
    url: "www.itsTheRealMrGlock.com",
    likes: 5000,
  },
  {
    title: "BigShaq skiiiiya",
    author: "NO KETCHUP",
    url: "www.JustSauceRawSauce.com",
    likes: 2 + 2 - 1,
  },
];

const blogsInDb = async () => {
  const blogs = await Blog.find({});
  return blogs.map((blog) => blog.toJSON());
};

const createOtherUserAndToken = async () => {
  // Create new other user in DB
  const passwordHash = await bcrypt.hash("test", 10);
  const otherUser = new User({
    username: "notAuthenticated",
    name: "notAuthenticated",
    passwordHash: passwordHash,
  });
  const savedOtherUser = await otherUser.save();

  // Create a token for a random user (not linked to blog we will delete)
  const otherUserForToken = {
    username: savedOtherUser.username,
    id: savedOtherUser._id,
  };
  let otherToken = jwt.sign(otherUserForToken, process.env.SECRET, {
    expiresIn: 60 * 60,
  });
  return `Bearer ${otherToken}`;
};

const usersInDb = async () => {
  const users = await User.find({});
  return users.map((user) => user.toJSON());
};

module.exports = {
  initialBlogs,
  blogsInDb,
  createOtherUserAndToken,
  usersInDb,
};
