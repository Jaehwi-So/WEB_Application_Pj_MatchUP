const express = require('express');
const passport = require('passport');
const { isLogin, isNotLogin } = require('./middlewares');
const { User, Team } = require('../models');
const Message = require('../schemas/message');
const Pager = require('../util/pager');
const bcrypt = require('bcrypt');
const controller = require('../controller/message')
const router = express.Router();

//메세지 작성 양식으로 이동
router.get('/form/:id', isLogin, controller.message_form);

//메시지 리스트
router.get('/list/:id', isLogin, controller.get_message_list);

//메시지 상세보기
router.get('/receive/:id', isLogin, controller.get_message_detail);

//메세지 발송(일반, 가입신청, 가입승인, 팀 초대)
router.post('/:id', isLogin, controller.send_message);

//팀 가입 메시지 작성 양식으로 이동
router.get('/joinform/:id', isLogin, controller.team_join_form);

//팀 초대 메시지 작성 양식으로 이동
router.get('/inviteform/:id', isLogin, controller.team_invite_form);

module.exports = router; 