const express = require('express');
const { User, Team, Offer, Match } = require('../models');
const Message = require('../schemas/message');
const Room = require('../schemas/room');
const bcrypt = require('bcrypt');
const Pager = require('../util/pager');
const { Op } = require('sequelize');

//팀 생성 양식 폼으로 이동
exports.move_create_form = (req, res) => {
    res.render('team/create_form', {});
};

//팀 생성
exports.create_team = async (req, res, next) => {
    const { team_name, leader_idx, keyword, region, state } = req.body;
    try {
        const team = await Team.create({
            team_name,
            leader_idx,
            keyword,
            region,
            state
        });
        const room = await Room.create({  //Insert
            title : `${team_name} 팀의 채팅방`,  
            max : 50,
            type : 'team',
            type_id : team.id,
        });
        await team.addUser(leader_idx);
        res.redirect('/team/list');
    } 
    catch (error) {
        console.error(error);
        res.redirect('/team/list');
    }
};

//팀 리스트로 이동
exports.move_team_list = (req, res) => {
    res.render('team/team_list', {});
};

//팀 리스트 목록 얻어오기
exports.get_team_list = async (req, res, next) => {
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
};

//팀 상세보기
exports.get_team_detail = async (req, res) => {
    try{
        const team = await Team.findOne({
            where : {id : req.params.id},
            include: [{
                model: User,
                as: 'Users'
            }]
        });
        const matches = await Match.findAll({
            include: [{
                model: Team,
                as: 'Rootteam',
            },{
                model: Team,
                as: 'Opteam',
            }],
            where: { [Op.or]: [{rootteam: team.id}, {opteam: team.id}] }
        });

        let isMember = false;
        if(req.user){
            const auth = await team.getUsers({where : {id : req.user.id} } );
            if(auth.length == 1){
                isMember = true;
            }
        }
        const room = await Room.findOne({  //Insert
            type : 'team',
            type_id : team.id,
        });

        res.render('team/team_profile', {team, isMember, matches, room_id : room._id});
    }
    catch(e){
        console.error(e);
        res.render('main');
    }
};

//팀 이미지 업로드
exports.upload_img = (req, res) => {
    console.log(req.file);
    res.json({ url: `/img/${req.file.filename}` });
};

//팀 이미지 수정
exports.update_img = async (req, res, next) => {
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
};

//팀 정보 수정 폼으로 이동
exports.move_team_update_form = async (req, res) => {
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
};

//팀 정보 수정
exports.update_team = async (req, res, next) => {
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
};

//팀 소개글 변경
exports.update_content = async (req, res, next) => {
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
};

//팀 탈퇴
exports.delete_member = async (req, res, next) => {
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
            await Room.destory({  
                where : {
                    type_id : teamID,
                    type : 'team',
                }
            });
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
}

//팀 가입
exports.join_member = async (req, res, next) => {
    //가입신청 수락
    if(req.query.type == 'join'){   
        try{
            const { teamID, senderID, messageID } = req.body;  //팀 아이디, 메시지 보낼 아이디(팀장), 메시지 아이디
            const targetID = parseInt(req.params.id);   //가입 대상
            const team = await Team.findOne({
                where : {id : teamID},
            });
            if(!team){
                return res.json({res: "expire"});
            }
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
            return res.json({res: "success"});
        }
        catch(e){
        console.error(e);
        return res.json({res: "error"});
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
            if(!team){
                return res.json({res: "expire"});
            }
            await team.addUser(targetID); 
            await Message.update({ _id : messageID}, { $set: { additional_info: 'invite success'} });
            //가입완료 메세지를 보냄
            const senderUser = await User.findOne({
                where : {id: targetID},
                attributes: ['nick'],
            });
            //팀장
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
            return res.json({res: "success"});
        }
        catch(e){
        console.error(e);
        return res.json({res: "error"});
        }
    }
};

//팀 구인 게시판 이동
exports.move_offer_list = (req, res) => {
    res.render('offer/offer_list', {});
};

//구인 게시글 작성 폼으로 이동
exports.move_write_offer_form = async (req, res) => {
    const myTeam = await Team.findAll({
        where: {
            leader_idx: req.user.id
        },
    })
    res.render('offer/create_form', {myTeam});
};

//구인 게시글 작성
exports.write_offer = async (req, res) => {
    const { title, type, position, content, offerteam } = req.body;
    try {
        const offer = await Offer.create({
            title,
            type,
            position,
            content,
            offerteam,
        });
        res.redirect('/team/offer/list');
    } 
    catch (error) {
        console.error(error);
        res.redirect('/team/offer/list');
    }
};

//구인 게시글 수정 폼으로 이동
exports.move_update_offer_form = async (req, res) => {
    const myTeam = await Team.findAll({
        where: {
            leader_idx: req.user.id
        },
    })
    const offer = await Offer.findOne({
        where: {
            id : parseInt(req.params.id),
        },
        include: {  
            model: Team,
        },
    })
    res.render('offer/update_form', {myTeam, offer});
};

//구인 게시글 수정
exports.update_offer = async (req, res, next) => {
    const { title, type, position, content, offerteam } = req.body;
    try {
        const offer = await Offer.update({
            title,
            type,
            position,
            content,
            offerteam,
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

//구인 게시글 삭제
exports.delete_offer = async (req, res, next) => {
    try {
        const offer = await Offer.destroy({where : {id : parseInt(req.params.id) }});
        res.json({res: "success"});
    } 
    catch (error) {
        console.error(error);
        res.json({res: "fail"});
    }
};

//구인 게시글 검색
exports.search_offer_list = async (req, res, next) => {
    try {
        //s_title, s_region, s_all s_type s_position
        let offers, rowTotal;
        const url = `/team/offer/list/${req.params.value}?type=${req.query.type}`; //요청 쿼리 url
        const curPage = Number(req.query.page) || 1; // 현재 페이지 번호 , 기본값은 1
        const contentSize = 10; // 페이지에서 보여줄 컨텐츠 수.
        const pageSize = 5; // 페이지네이션 개수 설정.
        const skipSize = (curPage - 1) * contentSize; //다음 페이지 갈 때 건너뛸 리스트 개수.
        console.log(curPage, contentSize, skipSize);
        let pager = "";
        //제목으로 검색
        if(req.query.type == 's_title'){
            rowTotal = await Offer.count({where: {title : {[Op.like]: "%" + req.params.value + "%"} } });
            offers = await Offer.findAll({
                where: {title : {[Op.like]: "%" + req.params.value + "%"} },
                include: {  
                    model: Team,
                },
                limit: contentSize,
                offset: skipSize,
                order: [['updatedAt', 'DESC']]
            });
        } 
        //지역으로 검색
        else if(req.query.type == 's_region'){
            rowTotal = await Offer.count({
                include: {  
                    model: Team,
                    where: { region: {[Op.like]: "%" + req.params.value + "%"} }
                }
            });
            offers = await Offer.findAll({
                include: {  
                    model: Team,
                    where: { region: {[Op.like]: "%" + req.params.value + "%"} }
                },
                limit: contentSize,
                offset: skipSize,
                order: [['updatedAt', 'DESC']]
            });
        } 
         //포지션으로 검색
        else if(req.query.type == 's_position'){
            rowTotal = await Offer.count({where: {position : {[Op.like]: "%" + req.params.value + "%"} }});
            offers = await Offer.findAll({
                where: {position : {[Op.like]: "%" + req.params.value + "%"} },
                include: {  
                    model: Team,
                },
                limit: contentSize,
                offset: skipSize,
                order: [['updatedAt', 'DESC']]
            });
        }       
        //유형으로 검색
        else if(req.query.type == 's_type'){
            rowTotal = await Offer.count({where: {type : {[Op.like]: "%" + req.params.value + "%"} }});
            offers = await Offer.findAll({
                where: {type : {[Op.like]: "%" + req.params.value + "%"} },
                include: {  
                    model: Team,
                },
                limit: contentSize,
                offset: skipSize,
                order: [['updatedAt', 'DESC']]
            });
        }      
        else{
            rowTotal = await Offer.count({});
            offers = await Offer.findAll({
                include: {  
                    model: Team,
                },
                limit: contentSize,
                offset: skipSize,
                order: [['updatedAt', 'DESC']]
            });
        }
        if(offers.length > 0){
          //url, 쿼리 유무, 현재 페이지, 페이지 컨텐츠 수, 한 화면 페이지네이션 개수, 생략 컨텐츠 수, 총 로우 개수, ajax여부, ajax함수
          pager = Pager.getPage(url, true, curPage, contentSize, pageSize, skipSize, rowTotal, true, 'search');
          console.log(offers);
          return res.json({ res: 'success', offers, pager});
        }
        else{
          return res.json({ res: 'no', offers, pager});
        }
      } 
      catch (error) {
        console.log(error);
        return res.json({ res: 'error'});
      }
};

//구인 게시글 하나 조회
exports.get_offer = async (req, res) => {
    const offer = await Offer.findOne({
        where: {id : parseInt(req.params.id)},
        include: {  
            model: Team,
        },
    });

    res.render('offer/offer_detail', {offer});
};

//나의 팀 목록
exports.get_my_team_list = async (req, res) => {
    try{
        const user = await User.findOne({
            where : {id : req.user.id},
        });
        const url = `/team/my/list`; //요청 쿼리 url
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
        return res.render('team/myteam_list', {teams : teams, pager : pager });    
    }
    catch(error){
        console.error('error', error);
        res.render('main');
    }
};
