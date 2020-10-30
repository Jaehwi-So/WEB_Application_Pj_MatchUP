const express = require('express');
const { isLogin, isNotLogin } = require('./middlewares');
const router = express.Router();
const path = require('path');
const controller = require('../controller/team')
const upload = require('../util/upload')

//팀 생성 폼 이동
router.get('/create', isLogin, controller.move_create_form);

//팀 생성
router.post('/', isLogin, controller.create_team);

//팀 리스트 폼으로 이동
router.get('/list', controller.move_team_list);

//팀 리스트
router.get('/list/:value', controller.get_team_list);

//팀 상세보기
router.get('/:id', controller.get_team_detail)

//팀 이미지 업로드
router.post('/upload', isLogin, upload.single_upload.single('img'), controller.upload_img);

//프로필 이미지 변경
router.post('/photo', isLogin, upload.none_upload.none(), controller.update_img);

//팀 정보 수정 폼 이동
router.get('/update/:id', isLogin, controller.move_team_update_form);

//팀 수정
router.put('/', isLogin, controller.update_team);

//팀 소개글 변경
router.put('/content/:id', isLogin, controller.update_content);

//팀 탈퇴
router.delete('/user/:id', isLogin, controller.delete_member);

//팀 가입
router.post('/user/:id', isLogin, upload.none_upload.none(), controller.join_member);

//팀 구인 리스트로 이동
router.get('/offer/list', controller.move_offer_list);

//팀 구인 게시글 작성 폼으로 이동
router.get('/offer/insertform', isLogin, controller.move_write_offer_form);

//팀 구인 게시글 작성
router.post('/offer', isLogin, controller.write_offer);

//팀 구인 게시글 수정 폼으로 이동
router.get('/offer/updateform/:id', isLogin, controller.move_update_offer_form);

//구인게시글 수정
router.put('/offer/:id', isLogin, controller.update_offer);

//구인게시글 삭제
router.delete('/offer/:id', isLogin, controller.delete_offer);

//팀 구인 게시글 리스트
router.get('/offer/list/:value', controller.search_offer_list);

//팀 구인 게시글 하나 조회
router.get('/offer/:id', controller.get_offer);

//나의 팀 목록 이동
router.get('/my/list', isLogin, controller.get_my_team_list);
module.exports = router;

