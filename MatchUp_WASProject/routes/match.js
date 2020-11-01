const express = require('express');
const { isLogin, isNotLogin } = require('./middlewares');
const router = express.Router();
const path = require('path');
const controller = require('../controller/match')
const upload = require('../util/upload')

//매칭 리스트로 이동
router.get('/list', controller.move_match_list);

//검색 매칭 리스트 데이터 얻어오기
router.get('/list/:value', controller.search_match_list);

//매칭 게시글 작성 폼으로 이동
router.get('/insertform', isLogin, controller.move_write_match_form);

//매칭 게시글 작성
router.post('/', isLogin, controller.write_match);

//매칭 게시글 수정 폼으로 이동
router.get('/updateform/:id', isLogin, controller.move_update_match_form);

//매칭 게시글 수정
router.put('/:id', isLogin, controller.update_match);

//매칭 게시글 하나 조회
router.get('/:id', controller.get_match);

//매칭 수락
router.post('/connect/:id', controller.match_connect);

//매칭 삭제(종료)
router.delete('/:id', isLogin, controller.delete_match);

module.exports = router; 