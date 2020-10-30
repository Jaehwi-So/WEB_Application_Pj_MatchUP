const express = require('express');
const passport = require('passport');
const { isLogin, isNotLogin } = require('./middlewares');
const { User } = require('../models');
const bcrypt = require('bcrypt');
const controller = require('../controller/auth')
const router = express.Router();

//로그인 처리
router.post('/login', isNotLogin, controller.login);

//로그아웃 처리
router.get('/logout', isLogin, controller.logout);

//비밀번호 확인
router.post('/update', isLogin, controller.check_pwd);

module.exports = router; 