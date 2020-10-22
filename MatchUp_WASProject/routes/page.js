const express = require('express');
//const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User } = require('../models');
const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.user_followerNum = req.user ? req.user.Followers.length : 0;
  res.locals.user_followingNum = req.user ? req.user.Followings.length : 0;
  next();
});

router.get('/', (req, res) => {
  res.render('main', {});
});

router.get('/join', (req, res) => {
  res.render('user_join', {});
});

router.get('/search', (req, res) => {
  res.render('user/search', {});
});
module.exports = router;
