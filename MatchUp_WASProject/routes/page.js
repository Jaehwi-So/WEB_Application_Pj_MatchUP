const express = require('express');
const router = express.Router();
const { isLogin, isNotLogin } = require('./middlewares');
const controller = require('../controller/page')

//모든 페이지에서 항상 보여줄 데이터 바인딩
router.use(controller.all_route_bind);

//메인화면
router.get('/', controller.main_page);

//가입 페이지
router.get('/join', controller.join_page);

//정보 수정 페이지
router.get('/update', isLogin, controller.update_page);

//사람 검색 페이지
router.get('/search', controller.user_search_page);


module.exports = router;
