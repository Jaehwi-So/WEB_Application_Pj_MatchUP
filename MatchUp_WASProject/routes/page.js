const express = require('express');
const { User } = require('../models');
const Message = require('../schemas/message');
const router = express.Router();
const { isLogin, isNotLogin } = require('./middlewares');

router.use(async (req, res, next) => {
  res.locals.user = req.user;
  res.locals.user_followerNum = req.user ? req.user.Followers.length : 0;
  res.locals.user_followingNum = req.user ? req.user.Followings.length : 0;
  if(req.user){
    try{
      const issue_num = await Message.count({ receiver_id : req.user.id, isRead : false });
      res.locals.issue_num = issue_num || 0;
    }
    catch(e){
      console.error(e);
      next();
    }
  }
  next();
});

router.get('/', (req, res) => {
  res.render('main', {});
});

router.get('/join', (req, res) => {
  res.render('user/join_form', {});
});

router.get('/update', isLogin, (req, res) => {
  res.render('user/update_form', {});
});

router.get('/search', (req, res) => {
  res.render('user/search', {});
});


module.exports = router;
