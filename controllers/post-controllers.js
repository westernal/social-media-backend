const HttpError = require("../models/http-error");
const Post = require("../models/posts");
const User = require("../models/user");
const Notification = require("../models/notification");
const fs = require("fs");

const getPosts = async (req, res, next) => {
  let posts;

  try {
    posts = await Post.find({}, "").sort({ date: -1 });
  } catch (error) {
    const err = new HttpError("Getting posts failed!", 500);
    return next(err);
  }

  res.json({ posts: posts });
};

const getPostById = async (req, res, next) => {
  const postId = req.params.pid;

  let post;

  try {
    post = await Post.findById(postId);
  } catch (error) {
    return next(error);
  }

  if (!post) {
    const err = new HttpError("Could not find the post!", 500);
    return next(err);
  }

  res.json({ post: post.toObject({ getters: true }) });
};

const getPostByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let posts;

  try {
    posts = await Post.find({ creator: userId }).sort({ date: -1 });
  } catch (error) {
    return next(error);
  }

  if (!posts) {
    const err = new HttpError("Could not find the post!", 500);
    return next(err);
  }

  res.json({ posts: posts });
};

const getTimelinePost = async (req, res, next) => {
  const userId = req.params.uid;

  let user;
  let posts = [];

  try {
    user = await User.findById(userId);
  } catch (error) {
    console.log(error);
    return next(error);
  }

  try {
    for (let i = 0; i < user.followings.length; i++) {
      posts[i] = await Post.findOne({ creator: user.followings[i] }).sort({
        date: -1,
      });
    }

    posts[user.followings.length] = await Post.findOne({
      creator: userId,
    }).sort({ date: -1 });

    posts.sort(function (a, b) {
      if (a !== null && b !== null) {
        var c = new Date(a.date);
        var d = new Date(b.date);
        return d - c;
      }
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }

  if (!user) {
    const err = new HttpError("Could not find the user!", 500);
    return next(err);
  }

  if (!posts) {
    const err = new HttpError("Could not find the post!", 500);
    return next(err);
  }

  res.json({ posts: posts });
};

const createPosts = async (req, res, next) => {
  const { title, description, creator, song } = req.body;

  const postDate = new Date();

  const createdPost = new Post({
    title: title,
    description: description,
    creator: creator,
    songUrl: song,
    date: postDate,
    likes: [],
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch (err) {
    return next(err);
  }

  if (!user) {
    const error = new HttpError("Could not find user", 422);
    return next(error);
  }

  try {
    await createdPost.save();
    user.posts.push(createdPost);
    await user.save();
  } catch (err) {
    return next(err);
  }

  res.status(201).json({ message: "post created!" });
};

const deletePost = async (req, res, next) => {
  const postId = req.params.pid;

  let post;

  try {
    post = await Post.findById(postId).populate("creator");
  } catch (error) {
    return next(error);
  }

  try {
    await post.remove();
    post.creator.posts.pull(post);
    await post.creator.save();
  } catch (error) {
    return next(error);
  }

  res.json({ message: "Post Deleted!" });
};

const likePost = async (req, res, next) => {
  const postId = req.params.pid;

  let post;

  const { userId } = req.body;

  let user;

  try {
    user = await User.findById(userId);
    post = await Post.findById(postId);
    post.likes.push(user);
    await post.save();
  } catch (error) {
    return next(error);
  }

  if (!post) {
    const err = new HttpError("Could not find the post!", 500);

    return next(err);
  }

  const notification = new Notification({
    owner: post.creator,
    message: "@" + user.username + " " + "liked" + " " + post.title + ".",
    date: new Date(),
  });

  try {
    await notification.save();
  } catch (error) {
    console.log(error);
  }

  res.json({ message: "Post Liked!" });
};

const unlikePost = async (req, res, next) => {
  const postId = req.params.pid;

  let post;

  const { userId } = req.body;

  let user;

  try {
    user = await User.findById(userId);
    post = await Post.findById(postId);
    post.likes.pop(user);
    await post.save();
  } catch (error) {
    return next(error);
  }

  if (!post) {
    const err = new HttpError("Could not find the post!", 500);
    return next(err);
  }

  res.json({ message: "Post Unliked!" });
};

const getPostLikes = async (req, res, next) => {
  const postId = req.params.pid;

  let post;
  let likes = [];

  try {
    post = await Post.findById(postId);
  } catch (error) {
    console.log(error);
    return next(error);
  }

  if (!post) {
    const err = new HttpError("post doesn't exists!", 401);
    return next(err);
  }

  for (let i = 0; i < post.likes.length; i++) {
    let user;

    user = await User.findById(post.likes[i]);

    likes.push(user);
  }

  res.status(200).json({ likes: likes });
};

exports.getPostById = getPostById;
exports.getPostByUserId = getPostByUserId;
exports.createPosts = createPosts;
exports.deletePost = deletePost;
exports.getPosts = getPosts;
exports.likePost = likePost;
exports.unlikePost = unlikePost;
exports.getTimelinePost = getTimelinePost;
exports.getPostLikes = getPostLikes;
