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
  storage: multer.diskStorage({ //storage 속성에는 어디에 어떤 이름으로 저장할지를 설정한다.
    //req 객체에는 요청에 대한 정보, file 객체에는 업로드 파일에 대한 정보가 있음. done은 함수
    destination(req, file, done) {  
      //done의 첫번째 인수에는 에러가 있다면 에러를 넣고, 두번째 인수에는 실제 경로를 넣는다.
      done(null, 'uploads/'); //req와 file의 데이터를 가공하여 done으로 넘긴다.
    },
    filename(req, file, done) {
      const ext = path.extname(file.originalname);
      //done의 첫번째 인수에는 에러가 있다면 에러를 넣고, 두번째 인수에는 저장할 파일명을 넣는다.
      done(null, path.basename(file.originalname, ext) + Date.now() + ext); //파일명 + 현재시간 + 확장자로 중복 방지 이름 설정
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },  //limits 속성에는 파일 사이즈 등 업로드에 대한 제한 사항을 설정한다.
});

//팀 생성 폼 이동
router.get('/create', isLogin, (req, res) => {
    res.render('team/create_form', {});
});

//팀 생성
router.post('/', isLogin, async (req, res, next) => {
    const { team_name, leader_idx, keyword, region, state } = req.body;
    try {
        const team = await Team.create({
            team_name,
            leader_idx,
            keyword,
            region,
            state
        });
        console.log(team);
        await team.addUser(leader_idx);
        res.redirect('/team/list');
    } 
    catch (error) {
        console.error(error);
        res.redirect('/team/list');
    }
});

//팀 리스트
router.get('/list', async (req, res, next) => {
    const search = req.query.search ? req.query.search : 'all';
    const type = req.query.type ? req.query.type : 'all';
    try{
        const url = `/team/list?search=${search}&type=${type}`; //요청 쿼리 url
        const curPage = Number(req.query.page) || 1; // 현재 페이지 번호 , 기본값은 1
        const contentSize = 10; // 페이지에서 보여줄 컨텐츠 수.
        const pageSize = 5; // 페이지네이션 개수 설정.
        const skipSize = (curPage - 1) * contentSize; //다음 페이지 갈 때 건너뛸 리스트 개수.
        let pager = "";
        let teams, rowTotal;

        rowTotal = await Team.count({});
        teams = await Team.findAll({
            limit: contentSize,
            offset: skipSize,
            order: [['updatedAt', 'DESC']]
        });
        pager = Pager.getPage(url, false, curPage, contentSize, pageSize, skipSize, rowTotal, false, 'no');
        return res.render('team/team_list', {teams : teams, pager : pager });    
    }
    catch(error){
        console.error('error', error);
        res.render('main');
    }
});

//팀 상세보기
router.get('/:id', async (req, res) => {
    try{
        const team = await Team.findOne({
            where : {id : req.params.id},
            include: [{
                model: User,
                as: 'Users'
            }]
        });
        let isMember = false;
        if(req.user){
            const auth = await team.getUsers({where : {id : req.user.id} } );
            if(auth.length == 1){
                isMember = true;
            }
        }
        res.render('team/team_profile', {team, isMember});
    }
    catch(e){
        console.error(e);
        res.render('main');
    }
})

//팀 이미지 업로드
router.post('/upload', isLogin, upload.single('img'), (req, res) => {
    console.log(req.file);
    res.json({ url: `/img/${req.file.filename}` });
});

//프로필 이미지 변경
const upload_none = multer();
router.post('/photo', isLogin, upload_none.none(), async (req, res, next) => {
  try{
    const { id, photo } = req.body; 
    const result = await Team.update({
      photo
    },{
      where : {id : id},
    });
    if(result){
      res.json({res: "success"});
    }
    else{
      res.json({res: "fail"});
    }
  }
  catch(e){
    console.error(e);
    res.json({res: "error"});
  }
});

//팀 정보 수정 폼 이동
router.get('/update/:id', async (req, res) => {
    try{
        const team = await Team.findOne({
            where : {id : req.params.id},
        });
        if(team.leader_idx == req.user.id){
            return res.render('team/update_form', {team});
        }
        else{
            return res.render('main');
        }
    }
    catch(e){
        console.error(e);
        res.render('main');
    }
});

//팀 수정
router.put('/', isLogin, async (req, res, next) => {
    const { team_name, id, keyword, region, state } = req.body;
    try {
        const team = await Team.update({
            team_name,
            keyword,
            region,
            state
        },{
            where : {id},
        });
        res.json({res: "success"});
    } 
    catch (error) {
        console.error(error);
        res.json({res: "fail"});
    }
});

//팀 소개글 변경
router.put('/content/:id', isLogin, async (req, res, next) => {
    const { content } = req.body;
    try {
      await Team.update({
        content
      },{
        where : {id : req.params.id},
      });
      return res.json({ res: 'success' });
    } catch (error) {
      return res.json({ res: 'error' });
    }
});

//팀 탈퇴
router.delete('/user/:id', isLogin, async (req, res, next) => {
    const teamID  = req.params.id;
    try {
        const team = await Team.findOne({
            where : {id : teamID},
            include: [{
                model: User,
                as: 'Users'
            }]
        });
        await team.removeUser(req.user.id);
        const members = await team.getUsers({});
        console.log(members);
        //팀 멤버가 남아있지 않은 경우
        if(!members || members.length == 0){
            await Team.destroy({
                where : {id : teamID},
            });
            return res.json({res : 'destroy'});
        }
        //팀 멤버가 남아있으나 탈퇴자가 리더인경우 리더 위임
        else if(req.user.id == team.leader_idx){
            const nextLeaderId = members[0].id;
            await Team.update({
                leader_idx : nextLeaderId
            },{
                where : {id : teamID},
            })
            return res.json({res : 'authorize'});
        }   
        else{
            return res.json({res : 'success'});
        }
    } 
    catch (error) {
        console.error(error);
        return res.json({res : 'fail'});
    }
});

//팀 가입
router.post('/user/:id', isLogin, upload_none.none(), async (req, res, next) => {
    try{
        const { teamID, senderID } = req.body;  //팀 아이디, 팀장 아이디
        const targetID = parseInt(req.params.id);   //가입 대상
        const team = await Team.findOne({
            where : {id : teamID},
        });
        console.log(teamID, targetID, req.user.id, senderID);
        await team.addUser(targetID);

        //가입완료 메세지를 보냄
        const senderUser = await User.findOne({
            where : {id: senderID},
            attributes: ['nick'],
        });
        const targetUser = await User.findOne({
            where : {id: targetID},
            attributes: ['nick'],
        });
        const message = await Message.create({  //Insert
            title : `팀 가입이 승인되었습니다.`,
            content : `${team.team_name}에 가입이 완료되었습니다.`,
            type : 'join_approve',
            sender_id : senderID,
            sender_nick : senderUser.nick,
            receiver_id : targetID,
            receiver_nick : targetUser.nick,
            additional_info : 'no',
        });
        res.json({res: "success"});
    }
    catch(e){
      console.error(e);
      res.json({res: "error"});
    }
  });

module.exports = router;

