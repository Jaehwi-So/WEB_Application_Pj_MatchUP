const express = require('express');
const passport = require('passport');
const { isLogin, isNotLogin } = require('./middlewares');
const { User } = require('../models');
const Message = require('../schemas/message');
const Pager = require('../util/pager');
const bcrypt = require('bcrypt');

const router = express.Router();

//메세지 작성 양식으로 이동
router.get('/form/:id', isLogin, async (req, res, next) => {
    try{
        const target = await User.findOne({
            where: {id: req.params.id},
            attributes: ['id', 'nick']
        })
        if(target){
            res.render('message/message_form', {target});
        }
        else{
            res.render('main');
        }
    }
    catch(e){
        console.error(e);
        res.render('main');
    }
});

//메시지 리스트
router.get('/list/:id', isLogin, async (req, res, next) => {
    try{
        const url = `/message/list/${req.params.id}`; //요청 쿼리 url
        const curPage = Number(req.query.page) || 1; // 현재 페이지 번호 , 기본값은 1
        const contentSize = 10; // 페이지에서 보여줄 컨텐츠 수.
        const pageSize = 5; // 페이지네이션 개수 설정.
        const skipSize = (curPage - 1) * contentSize; //다음 페이지 갈 때 건너뛸 리스트 개수.
        let pager = "";
        let messages, rowTotal;

        const id = parseInt(req.params.id);
        rowTotal = await Message.count( {$or: [ { receiver_id: id }, {sender_id: id} ]} );
        messages = await Message.find({$or: [ { receiver_id: id }, {sender_id: id} ]}).limit(contentSize).skip(skipSize).sort({createdAt : -1});
        pager = Pager.getPage(url, false, curPage, contentSize, pageSize, skipSize, rowTotal, false, 'no');
        res.render('message/message_list', {messages, pager, target: id});
        
    }
    catch(e){
        console.error(e);
        res.render('main');
    }
});

//메시지 상세보기
router.get('/receive/:id', isLogin, async (req, res, next) => {
    try{
        const result = await Message.update({ _id : req.params.id}, { $set: { isRead: true} });
        const message = await Message.findOne({_id : req.params.id})
        res.render('message/message_receive_form', {message});
        
    }
    catch(e){
        console.error(e);
        res.render('main');
    }
});

//메세지 발송(일반, 가입신청, 가입승인)
router.post('/:id', isLogin, async (req, res, next) => {
    const { title, content, targetNick, type } = req.body;
    const target = parseInt(req.params.id);
    let additional_info = 'no'; 
    //가입신청인 경우 부가정보
    if(type == 'join'){
        additional_info = req.body.teamID;
    }
    try {
        const message = await Message.create({  //Insert
            title,
            content,
            type : type,
            sender_id : req.user.id,
            sender_nick : req.user.nick,
            receiver_id : target,
            receiver_nick : targetNick,
            additional_info,
        });
        if(message){
            return res.json({ res: 'success' });
        }
        else{
            return res.json({ res: 'error' });
        }
    } 
    catch (err) {
        console.error(err);
        return res.json({ res: 'error' });
    }
});

//팀 가입 메시지 작성 양식으로 이동
router.get('/joinform/:id', isLogin, async (req, res, next) => {
    const teamID = req.query.team;
    try{
        const target = await User.findOne({
            where: {id: req.params.id},
            attributes: ['id', 'nick']
        })
        if(target){
            res.render('message/message_join_form', {target, teamID});
        }
        else{
            res.render('main');
        }
    }
    catch(e){
        console.error(e);
        res.render('main');
    }
});
module.exports = router; 