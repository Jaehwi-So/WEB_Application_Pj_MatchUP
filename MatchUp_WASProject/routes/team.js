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
        res.redirect('/team/list/all');
    } 
    catch (error) {
        console.error(error);
        res.redirect('/team/list/all');
    }
});
//팀 리스트 폼으로 이동
router.get('/list', (req, res) => {
    res.render('team/team_list', {});
});
//팀 리스트
router.get('/list/:value', async (req, res, next) => {
    try {
        let teams, rowTotal;
        const url = `/team/list/${req.params.value}?type=${req.query.type}`; //요청 쿼리 url
        const curPage = Number(req.query.page) || 1; // 현재 페이지 번호 , 기본값은 1
        const contentSize = 10; // 페이지에서 보여줄 컨텐츠 수.
        const pageSize = 5; // 페이지네이션 개수 설정.
        const skipSize = (curPage - 1) * contentSize; //다음 페이지 갈 때 건너뛸 리스트 개수.
        console.log(curPage, contentSize, skipSize);
        let pager = "";
        //팀명으로 검색
        if(req.query.type == 's_name'){
            rowTotal = await Team.count({where: {team_name : req.params.value}});
            teams = await Team.findAll({
                where: {team_name : req.params.value},
                limit: contentSize,
                offset: skipSize,
                order: [['updatedAt', 'DESC']]
            });
        } 
        //지역으로 검색
        else if(req.query.type == 's_region'){
            rowTotal = await Team.count({                
                where: {                 
                    region: {[Op.like]: "%" + req.params.value + "%"} 
                },
            });
            teams = await Team.findAll({
                where: {                 
                    region: {[Op.like]: "%" + req.params.value + "%"} 
                },
                limit: contentSize,
                offset: skipSize,
                order: [['updatedAt', 'DESC']]
            });
        } 
        //키워드로 검색
        else if(req.query.type == 's_keyword'){
            rowTotal = await Team.count( {              
                where: {                 
                    keyword: {[Op.like]: "%" + req.params.value + "%"} 
                },
            });
            teams = await Team.findAll({
                where: {                 
                    keyword: {[Op.like]: "%" + req.params.value + "%"} 
                },
                limit: contentSize,
                offset: skipSize,
                order: [['updatedAt', 'DESC']]
            });
        } 
        else{
            rowTotal = await Team.count({});
            teams = await Team.findAll({
                limit: contentSize,
                offset: skipSize,
                order: [['updatedAt', 'DESC']]
            });
        }
        if(teams.length > 0){
          //url, 쿼리 유무, 현재 페이지, 페이지 컨텐츠 수, 한 화면 페이지네이션 개수, 생략 컨텐츠 수, 총 로우 개수, ajax여부, ajax함수
          pager = Pager.getPage(url, true, curPage, contentSize, pageSize, skipSize, rowTotal, true, 'search');
          return res.json({ res: 'success', teams, pager: pager });
        }
        else{
          return res.json({ res: 'no', teams, pager: pager});
        }
      } 
      catch (error) {
        console.log(error);
        return res.json({ res: 'error'});
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
    //가입신청 수락
    if(req.query.type == 'join'){   
        try{
            const { teamID, senderID, messageID } = req.body;  //팀 아이디, 메시지 보낼 아이디(팀장), 메시지 아이디
            const targetID = parseInt(req.params.id);   //가입 대상
            const team = await Team.findOne({
                where : {id : teamID},
            });
            console.log(teamID, targetID, req.user.id, senderID);
            await team.addUser(targetID);
            const joinMessage = await Message.update({ _id : messageID}, { $set: { additional_info: 'join success'} });
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
    }
    //팀 초대 수락
    else if(req.query.type == 'invite'){   
        try{
            const { teamID, receiverID, messageID } = req.body;  //팀 아이디, 메시지 받을 아이디(팀장), 메시지 아이디
            const targetID = parseInt(req.params.id);   //가입 대상
            const team = await Team.findOne({
                where : {id : teamID},
            });
            await team.addUser(targetID);
            const joinMessage = await Message.update({ _id : messageID}, { $set: { additional_info: 'invite success'} });
            //가입완료 메세지를 보냄
            const senderUser = await User.findOne({
                where : {id: targetID},
                attributes: ['nick'],
            });
            const targetUser = await User.findOne({
                where : {id: receiverID},
                attributes: ['nick'],
            });
            const message = await Message.create({  //Insert
                title : `팀 초대를 수락하였습니다.`,
                content : `${senderUser.nick}님이 ${team.team_name}에 가입되었습니다.`,
                type : 'invite_approve',
                sender_id : targetID,
                sender_nick : senderUser.nick,
                receiver_id : receiverID,
                receiver_nick : targetUser.nick,
                additional_info : 'no',
            });
            res.json({res: "success"});
        }
        catch(e){
        console.error(e);
        res.json({res: "error"});
        }
    }
  });

module.exports = router;

