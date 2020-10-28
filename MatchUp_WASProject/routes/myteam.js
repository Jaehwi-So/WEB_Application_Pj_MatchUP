const express = require('express');
const { User, Team } = require('../models');
const bcrypt = require('bcrypt');
const { isLogin, isNotLogin } = require('./middlewares');
const { PrecompiledLoader } = require('nunjucks');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const Pager = require('../util/pager');
const Message = require('../schemas/message');
const { Op } = require('sequelize');

//파일업로드 multer 설정
const upload = multer({
  storage: multer.diskStorage({ 
    destination(req, file, done) {  
      done(null, 'uploads/'); 
    },
    filename(req, file, done) {
      const ext = path.extname(file.originalname);
      done(null, path.basename(file.originalname, ext) + Date.now() + ext); 
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

//나의 팀 목록 이동
router.get('/list', isLogin, async (req, res) => {
    try{
        const user = await User.findOne({
            where : {id : req.user.id},
        });
        const url = `/myteam/list`; //요청 쿼리 url
        const curPage = Number(req.query.page) || 1; // 현재 페이지 번호 , 기본값은 1
        const contentSize = 10; // 페이지에서 보여줄 컨텐츠 수.
        const pageSize = 5; // 페이지네이션 개수 설정.
        const skipSize = (curPage - 1) * contentSize; //다음 페이지 갈 때 건너뛸 리스트 개수.
        let pager = "";
        let teams, rowTotal;
        const total = await user.getTeams({});
        rowTotal = total.length;
        teams = await user.getTeams({
            limit: contentSize,
            offset: skipSize,
            order: [['updatedAt', 'DESC']]
        });
        pager = Pager.getPage(url, false, curPage, contentSize, pageSize, skipSize, rowTotal, false, 'no');
        return res.render('myteam/list', {teams : teams, pager : pager });    
    }
    catch(error){
        console.error('error', error);
        res.render('main');
    }
});


module.exports = router;

