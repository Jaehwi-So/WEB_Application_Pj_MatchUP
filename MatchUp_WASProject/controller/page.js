const express = require('express');
const { User } = require('../models');
const Message = require('../schemas/message');

exports.all_route_bind = async (req, res, next) => {
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
};

//메인 페이지
exports.main_page = (req, res) => {
    res.render('main', {});
};

//가입 페이지
exports.join_page = (req, res) => {
    res.render('user/join_form', {});
};

//정보수정 페이지
exports.update_page = (req, res) => {
    res.render('user/update_form', {});
};

//유저 검색 페이지
exports.user_search_page = (req, res) => {
    res.render('user/search', {});
  }