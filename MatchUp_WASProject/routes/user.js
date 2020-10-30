const express = require('express');
const { isLogin, isNotLogin } = require('./middlewares');
const { PrecompiledLoader } = require('nunjucks');
const router = express.Router();
const controller = require('../controller/user')
const upload = require('../util/upload')

//회원 가입
router.post('/', controller.user_join);

//회원정보 수정
router.put('/', isLogin, controller.user_update);

//회원 탈퇴
router.delete('/', isLogin, controller.user_delete);

//프로필 조회
router.get('/profile/:id', controller.read_profile);

//회원 검색
router.get('/:value', controller.search_user);

//프로필 이미지 업로드
router.post('/upload', isLogin, upload.single_upload.single('img'), controller.upload_profile_img);

//프로필 이미지 변경
router.post('/photo', isLogin, upload.none_upload.none(), controller.update_profile_img);

//팔로우 요청
router.post('/follow/:id', isLogin, controller.request_follow);

//언팔로우 요청
router.post('/unfollow/:id', isLogin, controller.undo_follow);

//해당 멤버의 팔로워, 팔로잉 수 조회
router.get('/follow/info/:id', controller.get_follow_info);

//해당 멤버의 팔로워 목록 조회
router.get('/follower/:id', controller.get_follower_list);

//해당 멤버의 팔로잉 목록 조회
router.get('/following/:id', controller.get_following_list);

//프로필 활동지역 변경
router.put('/region/:id', isLogin, controller.update_region);

//프로필 주포지션 변경
router.put('/mainposition/:id', isLogin, controller.update_main_position);

//프로필 부포지션 변경
router.put('/subposition/:id', isLogin, controller.update_sub_position);

//프로필 소개글 변경
router.put('/content/:id', isLogin, controller.update_content);


module.exports = router;
