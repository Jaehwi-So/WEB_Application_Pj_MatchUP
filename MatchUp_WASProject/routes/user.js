const express = require('express');
const { User } = require('../models');
const bcrypt = require('bcrypt');
const { isLogin, isNotLogin } = require('./middlewares');
const { PrecompiledLoader } = require('nunjucks');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const Pager = require('../util/pager');

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

//회원 가입
router.post('/join', async (req, res, next) => {
  const { user_id, user_pwd, user_name, nick, email, birth, gender } = req.body;
  console.log(req.body.user_id);
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
});

//프로필 조회
router.get('/profile/:id', async (req, res, next) => {
  try {
    const profile = await User.findOne({ where: {id : req.params.id} });
    if(profile){
      res.render('profile/profile', {profile});
    }
    else{
      res.render('/', {});
    }
  } 
  catch (error) {
    console.log(error);
    res.render('/', {});
  }
});

//회원 검색
router.get('/:value', async (req, res, next) => {
  try {
    let member, rowTotal;
    const url = `/user/${req.params.value}?type=${req.query.type}`; //요청 쿼리 url
    const curPage = Number(req.query.page) || 1; // 현재 페이지 번호 , 기본값은 1
    const contentSize = 10; // 페이지에서 보여줄 컨텐츠 수.
    const pageSize = 5; // 페이지네이션 개수 설정.
    const skipSize = (curPage - 1) * contentSize; //다음 페이지 갈 때 건너뛸 리스트 개수.
    console.log(curPage, contentSize, skipSize);
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
    else{
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
    console.log(error);
    return res.json({ res: 'error'});
  }
});

//프로필 이미지 업로드
router.post('/upload', isLogin, upload.single('img'), (req, res) => {
  console.log(req.file);
  res.json({ url: `/img/${req.file.filename}` });
});

//프로필 이미지 변경
const upload_none = multer();
router.post('/photo', isLogin, upload_none.none(), async (req, res, next) => {
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
});

//팔로우 요청
router.post('/follow/:id', isLogin, async (req, res, next) => {
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
});

//언팔로우 요청
router.post('/unfollow/:id', isLogin, async (req, res, next) => {
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
});

//해당 멤버의 팔로워, 팔로잉 수 조회
router.get('/follow/info/:id', async (req, res, next) => {
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
});

//해당 멤버의 팔로워 목록 조회
router.get('/follower/:id', async (req, res, next) => {
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
    console.log('ok');
  }
  catch(error){
    console.error('error:', error);
    res.render('/');
  }
});


//해당 멤버의 팔로워 목록 조회
router.get('/following/:id', async (req, res, next) => {
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
    console.log('ok');
  }
  catch(error){
    console.error('error:', error);
    res.render('/');
  }
});



module.exports = router;
