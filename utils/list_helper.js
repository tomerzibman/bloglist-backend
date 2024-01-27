const dummy = (blogs) => {
  return 1;
};

const totalLikes = (blogs) => {
  total = blogs.reduce((acc, blog) => acc + blog.likes, 0);
  return total;
};

const favouriteBlog = (blogs) => {
  let favBlog = null;
  let maxLikes = -1;
  blogs.forEach((blog) => {
    if (blog.likes > maxLikes) {
      maxLikes = blog.likes;
      favBlog = blog;
    }
  });
  return favBlog;
};

const mostBlogs = (blogs) => {
  const blogsPerAuthor = {};
  const bestAuthor = "";
  const numberOfWrites = 0;

  blogs.forEach((blog) => {
    const data = {
      author: "",
      blogs: 0,
    };

    if (blog.author in blogsPerAuthor) {
      blogsPerAuthor[blog.author] += 1;
    } else {
      blogsPerAuthor[blog.author] = 1;
    }

    let mostWrites = -1;
    for (const author in blogsPerAuthor) {
      if (blogsPerAuthor[author] > mostWrites) {
        mostWrites = blogsPerAuthor[author];
        data.author = author;
        data.blogs = mostWrites;
      }
    }

    return data;
  });
};

module.exports = {
  dummy,
  totalLikes,
  favouriteBlog,
};
