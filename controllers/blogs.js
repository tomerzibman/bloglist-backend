const express = require("express");
const blogRouter = express.Router();
const Blog = require("../models/blog");
const jwt = require("jsonwebtoken");
const middlewear = require("../utils/middlewear");

blogRouter.get("/", async (req, res) => {
  const blogs = await Blog.find({}).populate("user", { username: 1, name: 1 });
  res.json(blogs);
});

blogRouter.post("/", middlewear.userExtractor, async (req, res) => {
  if (!req.body.likes) {
    req.body.likes = 0;
  }

  req.body.user = req.user._id;
  const blog = new Blog(req.body);

  const savedBlog = await blog.save();
  req.user.blogs = req.user.blogs.concat(savedBlog._id);
  await req.user.save();
  res.status(201).json(savedBlog);
});

blogRouter.put("/:id", middlewear.userExtractor, async (req, res) => {
  const blogToUpdate = await Blog.findById(req.params.id);
  if (!blogToUpdate) {
    return res.status(404).json({ error: "Blog not found" });
  }
  if (!req.body.likes) {
    return res.status(400).json({ error: "Likes must be provided" });
  }

  if (req.user._id.toString() != blogToUpdate.user.toString()) {
    return res
      .status(401)
      .json({ error: "only the creator of the blog can update it" });
  }

  blogToUpdate.title = req.body.title || blogToUpdate.title;
  blogToUpdate.author = req.body.author || blogToUpdate.author;
  blogToUpdate.url = req.body.url || blogToUpdate.url;
  blogToUpdate.likes = req.body.likes;
  const updatedBlog = await blogToUpdate.save();

  res.json(updatedBlog);
});

blogRouter.delete("/:id", middlewear.userExtractor, async (req, res) => {
  const decodedToken = jwt.verify(req.token, process.env.SECRET);
  if (!decodedToken.id) {
    return res.status(401).json({ error: "invalid token" });
  }

  const blogToDelete = await Blog.findById(req.params.id);
  if (!blogToDelete) {
    return res
      .status(404)
      .json({ error: "blog does not exist, cannot delete" });
  }

  if (req.user._id.toString() !== blogToDelete.user.toString()) {
    return res
      .status(401)
      .json({ error: "only creator of blog can delete it" });
  }

  req.user.blogs = req.user.blogs.filter(
    (blog) => blog._id.toString() != blogToDelete._id.toString()
  );
  await req.user.save();
  await Blog.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

module.exports = blogRouter;
