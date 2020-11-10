const express = require('express');
const { User } = require('../models');
const bcrypt = require('bcrypt');
const Pager = require('../util/pager');
const { Op } = require('sequelize');

//회원 가입
exports.user_join = async (req, res, next) => {
    const { user_id, user_pwd, user_name, nick, email, birth, gender } = req.body;
    try {
      let exUser;
      exUser = await User.findOne({ where: { user_id } });
      if (exUser) {
        return res.json({ res: 'existID' });
      }
      exUser = await User.findOne({ where: { nick } });
      if (exUser) {
        return res.json({ res: 'existNick' });
      }
      exUser = await User.findOne({ where: { email } });
      if (exUser) {
        return res.json({ res: 'existEmail' });
      }
      const hash = await bcrypt.hash(user_pwd, 12); //비밀번호 암호화
      await User.create({
        user_name,
        user_id,
        user_pwd : hash,
        nick,
        email,
        birth,
        gender
      });
      return res.json({ res: 'success' });
    } catch (error) {
      return res.json({ res: 'error' });
    }
};

//회원정보 수정
exports.user_update = async (req, res, next) => {
    const { user_id, user_pwd, user_name, nick, email, birth, gender } = req.body;
    try {
      let exUser;
      exUser = await User.findOne({ 
        where: {
          id: {[Op.ne] : req.user.id},
          nick: req.user.nick
        }
      });
      if (exUser) {
        return res.json({ res: 'existNick' });
      }
      exUser = await User.findOne({ 
        where: {
          id: {[Op.ne] : req.user.id},
          email: req.user.email
        }
      });
      if (exUser) {
        return res.json({ res: 'existEmail' });
      }
      const hash = await bcrypt.hash(user_pwd, 12); //비밀번호 암호화
      await User.update({
        user_name,
        user_id,
        user_pwd : hash,
        nick,
        email,
        birth,
        gender
      },{
        where : {id : req.user.id},
      });
      return res.json({ res: 'success' });
    } catch (error) {
      return res.json({ res: 'error' });
    }
};

//회원 삭제
exports.user_delete = async (req, res, next) => {
    try {
      const {user_pwd} = req.body; 
      let exUser;
      exUser = await User.findOne({ 
        where: {
          id:  req.user.id,
        }
      });
      const result = await bcrypt.compare(user_pwd, exUser.user_pwd);
      if (result) {
        await User.destroy({ 
          where: {
            id:  req.user.id,
          }
        });
        req.logout();
        req.session.destroy();
        return res.json({ res: 'success' });
      }
      else{
        return res.json({ res: 'fail' });
      }
    } catch (error) {
      console.error(error);
      return res.json({ res: 'error' });
    }
}

//프로필 조회
exports.read_profile = async (req, res, next) => {
    try {
      const profile = await User.findOne({ where: {id : req.params.id} });
      if(profile){
        res.render('profile/profile', {profile});
      }
      else{
        res.render('main', {});
      }
    } 
    catch (error) {
      console.error(error);
      res.render('main', {});
    }
};

//유저 검색
exports.search_user = async (req, res, next) => {
    try {
      let member, rowTotal;
      const url = `/user/${req.params.value}?type=${req.query.type}`; //요청 쿼리 url
      const curPage = Number(req.query.page) || 1; // 현재 페이지 번호 , 기본값은 1
      const contentSize = 10; // 페이지에서 보여줄 컨텐츠 수.
      const pageSize = 5; // 페이지네이션 개수 설정.
      const skipSize = (curPage - 1) * contentSize; //다음 페이지 갈 때 건너뛸 리스트 개수.
      let pager = "";
      //닉네임으로 검색
      if(req.query.type == 's_nick'){
        //개수 조회
        member = await User.findAndCountAll({
          where: {nick : req.params.value}, 
        });
        rowTotal = member.count;
        //데이터 조회
        member = await User.findAll({ 
          where: {nick : req.params.value},         
          limit: contentSize,
          offset: skipSize, 
        });
      } 
      //아이디로 검색
      else if(req.query.type == 's_id'){
        member = await User.findAndCountAll({
          where: {user_id : req.params.value}, 
        });
        rowTotal = member.count;
        member = await User.findAll({ 
          where: {user_id : req.params.value},         
          limit: contentSize,
          offset: skipSize, 
        });
      }
      //이름으로 검색
      else if(req.query.type == 's_name'){
        member = await User.findAndCountAll({
          where: {user_name : req.params.value}, 
        });
        rowTotal = member.count;
        member = await User.findAll({ 
          where: {user_name : req.params.value},         
          limit: contentSize,
          offset: skipSize, 
        });
      }
      else{
        member = await User.findAndCountAll({
        });
        rowTotal = member.count;
        member = await User.findAll({     
          limit: contentSize,
          offset: skipSize, 
        });
      }
      if(member.length > 0){
        //url, 쿼리 유무, 현재 페이지, 페이지 컨텐츠 수, 한 화면 페이지네이션 개수, 생략 컨텐츠 수, 총 로우 개수, ajax여부, ajax함수
        pager = Pager.getPage(url, true, curPage, contentSize, pageSize, skipSize, rowTotal, true, 'search');
        return res.json({ res: 'success', member: member, pager: pager });
      }
      else{
        return res.json({ res: 'no', member: member, pager: pager});
      }
    } 
    catch (error) {
      console.error(error);
      return res.json({ res: 'error'});
    }
}

//프로필 사진 미리보기 업로드
exports.upload_profile_img = (req, res) => {
    res.json({ url: `/img/${req.file.filename}` });
}

//프로필 사진 변경
exports.update_profile_img = async (req, res, next) => {
    try{
      const { id, photo } = req.body; 
      const result = await User.update({
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

//팔로우 요청
exports.request_follow = async (req, res, next) => {
    try{
      const user = await User.findOne({where : {id: req.user.id} });
      if(user){
        await user.addFollowing(parseInt(req.params.id)); 
        res.json({res: "success"});
      }
      res.json({res: "no"});
    }
    catch(error){
      res.json({res: "error"});
      console.error(error);
    }
};

//팔로우 취소
exports.undo_follow = async (req, res, next) => {
    try{
      const user = await User.findOne({where : {id: req.user.id} });
      if(user){
        await user.removeFollowing(parseInt(req.params.id)); 
        res.json({res: "success"});
      }
      res.json({res: "no"});
    }
    catch(error){
      res.json({res: "error"});
      console.error(error);
    }
};

exports.get_follow_info = async (req, res, next) => {
    try{  
      const follow = await User.findOne({
        where : {id : parseInt(req.params.id)},
        attributes: ['id'],
        include: [{
          model: User,
          attributes: ['id'],
          as: 'Followers'
        }, {
          model: User,
          attributes: ['id'],
          as: 'Followings'
        }]
      });
      let isFollowing;
      if(req.user){
        isFollowing = await User.findOne({
          where : {id : parseInt(req.params.id)},
          attributes: ['id'],
          include: [{
            model: User,
            attributes: ['id'],
            as: 'Followers',
            where: {id : parseInt(req.user.id)},
          }]
        });
        if(!isFollowing || isFollowing.Followers.length == 0 ){
          isFollowing = false;
        }else{
          isFollowing = true;
        }
      }
      else isFollowing = false;
      res.json({res: "success", follower: follow.Followers.length || 0, 
      following: follow.Followings.length || 0, isFollowing });
    }
    catch(error){
      res.json({res: "error"});
      console.error(error);
    }
}

//팔로워 리스트 조회
exports.get_follower_list = async (req, res, next) => {
    try{
      let member, rowTotal;
      const url = `/user/follower/${req.params.id}`; //요청 쿼리 url
      const curPage = Number(req.query.page) || 1; // 현재 페이지 번호 , 기본값은 1
      const contentSize = 10; // 페이지에서 보여줄 컨텐츠 수.
      const pageSize = 5; // 페이지네이션 개수 설정.
      const skipSize = (curPage - 1) * contentSize; //다음 페이지 갈 때 건너뛸 리스트 개수.
      let pager = "";    
      //개수 조회
      member = await User.findOne({
        where : {id : parseInt(req.params.id)},
        include: [{
          model: User,
          attributes: ['id'],
          as: 'Followers',
        }],
      });
      const user_name = member.user_name;
      rowTotal = member.Followers ? member.Followers.length : 0;
      //데이터 조회
      const target = await User.findOne({ where: { id: parseInt(req.params.id) } });
      member = await target.getFollowers({ limit: contentSize, offset: skipSize});
  
      pager = Pager.getPage(url, false, curPage, contentSize, pageSize, skipSize, rowTotal, false, 'no');
      res.render('user/follow', {member: member, list_type: 'follower', pager: pager, target_name: user_name});
    }
    catch(error){
      console.error('error:', error);
      res.render('main');
    }
};

//팔로잉 리스트 조회
exports.get_following_list = async (req, res, next) => {
    try{
      let member, rowTotal;
      const url = `/user/following/${req.params.id}`; //요청 쿼리 url
      const curPage = Number(req.query.page) || 1; // 현재 페이지 번호 , 기본값은 1
      const contentSize = 10; // 페이지에서 보여줄 컨텐츠 수.
      const pageSize = 5; // 페이지네이션 개수 설정.
      const skipSize = (curPage - 1) * contentSize; //다음 페이지 갈 때 건너뛸 리스트 개수.
      let pager = "";    
      //개수 조회
      member = await User.findOne({
        where : {id : parseInt(req.params.id)},
        include: [{
          model: User,
          attributes: ['id'],
          as: 'Followings',
        }],
      });
      const user_name = member.user_name;
      rowTotal = member.Followings ? member.Followings.length : 0;
      //데이터 조회
      const target = await User.findOne({ where: { id: parseInt(req.params.id) } });
      member = await target.getFollowings({ limit: contentSize, offset: skipSize});
  
      pager = Pager.getPage(url, false, curPage, contentSize, pageSize, skipSize, rowTotal, false, 'no');
      res.render('user/follow', {member: member, list_type: 'following', pager: pager, target_name: user_name});
    }
    catch(error){
      console.error('error:', error);
      res.render('main');
    }
};

//활동지역 변경
exports.update_region = async (req, res, next) => {
    const { region } = req.body;
    try {
      await User.update({
        region
      },{
        where : {id : req.params.id},
      });
      return res.json({ res: 'success' });
    } catch (error) {
      return res.json({ res: 'error' });
    }
};

//메인 포지션 변경
exports.update_main_position = async (req, res, next) => {
    const { main_position } = req.body;
    try {
      await User.update({
        main_position
      },{
        where : {id : req.params.id},
      });
      return res.json({ res: 'success' });
    } catch (error) {
      return res.json({ res: 'error' });
    }
};

//부 포지션 변경
exports.update_sub_position = async (req, res, next) => {
    const { sub_position } = req.body;
    try {
      await User.update({
        sub_position
      },{
        where : {id : req.params.id},
      });
      return res.json({ res: 'success' });
    } catch (error) {
      return res.json({ res: 'error' });
    }
};

exports.update_content = async (req, res, next) => {
    const { content } = req.body;
    try {
      await User.update({
        content
      },{
        where : {id : req.params.id},
      });
      return res.json({ res: 'success' });
    } catch (error) {
      return res.json({ res: 'error' });
    }
};