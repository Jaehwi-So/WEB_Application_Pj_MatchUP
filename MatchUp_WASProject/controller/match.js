const express = require('express');
const { User, Team, Match } = require('../models');
const Message = require('../schemas/message');
const Pager = require('../util/pager');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

//매칭 리스트로 이동
exports.move_match_list = (req, res) => {
    res.render('match/match_list', {});
};

//매칭 리스트 검색
exports.search_match_list = async (req, res, next) => {
    try {
        let matches, rowTotal;
        const url = `/match/list/${req.params.value}?type=${req.query.type}`; //요청 쿼리 url
        const curPage = Number(req.query.page) || 1; // 현재 페이지 번호 , 기본값은 1
        const contentSize = 10; // 페이지에서 보여줄 컨텐츠 수.
        const pageSize = 5; // 페이지네이션 개수 설정.
        const skipSize = (curPage - 1) * contentSize; //다음 페이지 갈 때 건너뛸 리스트 개수.
        console.log(curPage, contentSize, skipSize);
        let pager = "";

        //제목으로 검색
        if(req.query.type == 's_title'){
            rowTotal = await Match.count({where: {title : {[Op.like]: "%" + req.params.value + "%"} } });
            matches = await Match.findAll({
                where: {title : {[Op.like]: "%" + req.params.value + "%"} },
                limit: contentSize,
                offset: skipSize,
                order: [['updatedAt', 'DESC']]
            });
        } 
        //지역으로 검색
        else if(req.query.type == 's_region'){
            rowTotal = await Match.count({where: {region : {[Op.like]: "%" + req.params.value + "%"} } });
            matches = await Match.findAll({
                where : {region : {[Op.like]: "%" + req.params.value + "%"} },
                limit: contentSize,
                offset: skipSize,
                order: [['updatedAt', 'DESC']]
            });
        }
        //시간으로 검색
        else if(req.query.type == 's_time'){
            rowTotal = await Match.count({where: {time : {[Op.like]: "%" + req.params.value + "%"} } });
            matches = await Match.findAll({
                where : {time : {[Op.like]: "%" + req.params.value + "%"} },
                limit: contentSize,
                offset: skipSize,
                order: [['updatedAt', 'DESC']]
            });
        }  
        else{
            rowTotal = await Match.count({});
            matches = await Match.findAll({
                limit: contentSize,
                offset: skipSize,
                order: [['updatedAt', 'DESC']]
            });
        }
        if(matches.length > 0){
          //url, 쿼리 유무, 현재 페이지, 페이지 컨텐츠 수, 한 화면 페이지네이션 개수, 생략 컨텐츠 수, 총 로우 개수, ajax여부, ajax함수
          pager = Pager.getPage(url, true, curPage, contentSize, pageSize, skipSize, rowTotal, true, 'search');
          return res.json({ res: 'success', matches, pager});
        }
        else{
          return res.json({ res: 'no', matches, pager});
        }
      } 
      catch (error) {
        console.log(error);
        return res.json({ res: 'error'});
      }
};

//매칭 게시글 작성 폼으로 이동
exports.move_write_match_form = async (req, res) => {
    const myTeam = await Team.findAll({
        where: {
            leader_idx: req.user.id
        },
    })
    res.render('match/create_form', {myTeam});
};

//매칭 게시글 작성
exports.write_match = async (req, res) => {
    const { title, type, time, region, content, rootteam } = req.body;
    try {
        const match = await Match.create({
            title,
            region,
            time,
            content,
            type,
            rootteam
        });
        res.redirect('/match/list');
    } 
    catch (error) {
        console.error(error);
        res.redirect('/match/list');
    }
};


//매칭 게시글 수정 폼으로 이동
exports.move_update_match_form = async (req, res) => {
    const myTeam = await Team.findAll({
        where: {
            leader_idx: req.user.id
        },
    })
    const match = await Match.findOne({
        where: {
            id : parseInt(req.params.id),
        },
        include: [{  
            model: Team,
            as: 'Rootteam',
        }, {  
            model: Team,
            as: 'Opteam',
        }],   
    })
    res.render('match/update_form', {myTeam, match});
};

//매칭 게시글 수정
exports.update_match = async (req, res, next) => {
    const { title, type, time, region, content, rootteam } = req.body;
    try {
        const match = await Match.update({
            title,
            region,
            time,
            content,
            type,
            rootteam
        },{
            where : {id : parseInt(req.params.id) }
        });
        res.json({res: "success"});
    } 
    catch (error) {
        console.error(error);
        res.json({res: "fail"});
    }
};

//매칭 게시글 하나 조회
exports.get_match = async (req, res) => {
    const match = await Match.findOne({
        where: {id : parseInt(req.params.id)},
        include: [{  
            model: Team,
            as: 'Rootteam',
            include: [{
                model: User,
                as: 'Users'
            }],
        }, {  
            model: Team,
            as: 'Opteam',
            include: [{
                model: User,
                as: 'Users'
            }],
        }]   
    });
    res.render('match/match_detail', {match});
};

//매칭 수락
exports.match_connect = async (req, res, next) => {
    //매칭신청 수락
    if(req.query.type == 'apply'){   
        try{
            const { teamID, matchID, receiverID, messageID } = req.body;  //팀 아이디, 매칭 아이디, 메시지 보낼 아이디, 메시지 아이디
            const senderID = parseInt(req.params.id);   //메시지를 보낼 대상
            const targetID = receiverID;
            console.log(req.body, targetID);
            let match = await Match.findOne({
                where : {id : matchID},
            })
            if(!match){
                return res.json({res: "expire"});
            }
            if(match.state == '매칭 완료'){
                return res.json({res: "alldone"});
            }
            await Match.update({
                state : '매칭 완료',
                opteam : teamID,
            },{
                where : {id : matchID}
            })
            

            match = await Match.findOne({
                where : {id : matchID},
                include: [{  
                    model: Team,
                    as: 'Rootteam',
                    include: [{
                        model: User,
                        as: 'Users'
                    }],
                }, {  
                    model: Team,
                    as: 'Opteam',
                    include: [{
                        model: User,
                        as: 'Users'
                    }],
                }],
            });
            const applyMessage = await Message.update({ _id : messageID}, { $set: { additional_info: 'apply success'} });
            //매칭성사 메세지를 보냄
            const senderUser = await User.findOne({
                where : {id: senderID},
                attributes: ['nick'],
            });
            const targetUser = await User.findOne({
                where : {id: targetID},
                attributes: ['nick'],
            });
            const message = await Message.create({  //Insert
                title : `대전이 매칭되었습니다.`,
                content : `${match.Opteam.team_name}팀이 ${match.title} 경기에 참여합니다.`,
                type : 'apply_approve',
                sender_id : senderID,
                sender_nick : senderUser.nick,
                receiver_id : targetID,
                receiver_nick : targetUser.nick,
                additional_info : 'success',
            });

            //모든 멤버들에게 매치 문자를 보냄
            match.Rootteam.Users.map(async (x) => {
                await Message.create({  //Insert
                    title : `새로운 대전이 성사되었습니다.`,
                    content : `당신의 팀 ${match.Rootteam.team_name}과 ${match.Opteam.team_name}팀과의 ${match.title} 경기가 성사되었습니다.`,
                    type : 'match_success',
                    sender_id : 0,
                    sender_nick : 'SYSTEM',
                    receiver_id : x.id,
                    receiver_nick : x.nick,
                    additional_info : match.id,
                });
            })
            match.Opteam.Users.map(async (x) => {
                await Message.create({  //Insert
                    title : `새로운 대전이 성사되었습니다.`,
                    content : `당신의 팀 ${match.Opteam.team_name}과 ${match.Rootteam.team_name}팀과의 ${match.title} 경기가 성사되었습니다.`,
                    type : 'match_success',
                    sender_id : 0,
                    sender_nick : 'SYSTEM',
                    receiver_id : x.id,
                    receiver_nick : x.nick,
                    additional_info : match.id,
                });
            })
            return res.json({res: "success"});
        }
        catch(e){
        console.error(e);
        return res.json({res: "error"});
        }
    }
};

//매칭 종료(삭제)
exports.delete_match = async (req, res, next) => {
    try {
        const match = await Match.destroy({where : {id : parseInt(req.params.id) }});
        res.json({res: "success"});
    } 
    catch (error) {
        console.error(error);
        res.json({res: "fail"});
    }
};
