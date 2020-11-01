const express = require('express');
const { User, Team, Match } = require('../models');
const Message = require('../schemas/message');
const Pager = require('../util/pager');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

//메세지 작성 폼 이동
exports.message_form = async (req, res, next) => {
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
};

//메시지 목록
exports.get_message_list = async (req, res, next) => {
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
};

//메시지 상세보기
exports.get_message_detail = async (req, res, next) => {
    try{
        const result = await Message.update({ _id : req.params.id}, { $set: { isRead: true} });
        const message = await Message.findOne({_id : req.params.id})
        res.render('message/message_receive_form', {message});
    }
    catch(e){
        console.error(e);
        res.render('main');
    }
};

//메시지 발송
exports.send_message = async (req, res, next) => {
    const { title, content, targetNick, type } = req.body;
    const target = parseInt(req.params.id);
    let additional_info = 'no'; 

    //가입신청인 경우 부가정보
    if(type == 'join'){
        additional_info = req.body.teamID;
        const curTeam = await Team.findOne({where : {id : req.body.teamID} });
        const isTeam = await curTeam.getUsers({where : {id : req.user.id} } );
        //이미 팀에 존재하는 경우
        if(isTeam.length > 0){
            return res.json({ res: 'exist' });
        }
    }
    //팀 초대인 경우 부가정보
    if(type == 'invite'){
        additional_info = req.body.teamID;
        const curTeam = await Team.findOne({where : {id : req.body.teamID} });
        const isTeam = await curTeam.getUsers({where : {id : target} } );
        //이미 팀에 존재하는 경우
        if(isTeam.length > 0){
            return res.json({ res: 'exist' });
        }
    }
    //대전 신청인 경우 부가정보
    if(type == 'apply'){
        additional_info = "" + req.body.match_id + ',' + req.body.opteamID
        const match = await Match.findOne({where : {id : req.body.match_id} });
        //매치가 존재하지 않는 경우
        if(!match){
            return res.json({ res: 'exist' });
        }
        //매치가 이미 성사된 경우
        if(match.state == '매칭 완료'){
            return res.json({ res: 'alldone' });
        }
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
};

//팀 가입신청 폼 이동
exports.team_join_form = async (req, res, next) => {
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
};


//팀 초대 폼 이동
exports.team_invite_form = async (req, res, next) => {
    try{
        const target = await User.findOne({
            where: {id: req.params.id},
            attributes: ['id', 'nick']
        });
        const myTeam = await Team.findAll({
            where: {
                leader_idx: req.user.id
            },
        })
        if(target){
            res.render('message/message_invite_form', {target, myTeam});
        }
        else{
            res.render('main');
        }
    }
    catch(e){
        console.error(e);
        res.render('main');
    }
};

//대전 신청 폼 이동
exports.match_apply_form = async (req, res, next) => {
    try{
        const matchID = req.params.id;  //매치 게시글의 id
        const match = await Match.findOne({   //매치와 개설 팀
            where : {id : matchID},
            include: [{  
                model: Team,
                as: 'Rootteam',
            }]
        })
        const leader_idx = match.Rootteam.leader_idx;
        const target = await User.findOne({ //상대 팀장
            where: {id: leader_idx},
            attributes: ['id', 'nick']
        });
        const myTeam = await Team.findAll({ //나의 팀 목록
            where: {
                leader_idx: req.user.id
            },
        })
        if(target){
            res.render('message/message_apply_form', {match, target, myTeam});
        }
        else{
            res.render('main');
        }
    }
    catch(e){
        console.error(e);
        res.render('main');
    }
};