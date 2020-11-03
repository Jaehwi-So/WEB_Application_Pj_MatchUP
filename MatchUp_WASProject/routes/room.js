const express = require('express');
const router = express.Router();

const Room = require('../schemas/room');
const Chat = require('../schemas/chat');
const { isLogin, isNotLogin } = require('./middlewares');
const controller = require('../controller/room')

router.get('/:id', isLogin, controller.auth_check, controller.join_room);

router.post('/:id/chat', isLogin, controller.insert_chat);

module.exports = router;
