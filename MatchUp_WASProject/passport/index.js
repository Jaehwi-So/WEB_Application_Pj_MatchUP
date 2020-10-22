//npm i passport passport-local bcrypt
const passport = require('passport');
const local = require('./localStrategy');
const User = require('../models/user');


module.exports = () => {
    //req.login()(로그인) 시 실행. 세션에 어떤 데이터를 저장할지를 지정하는 메서드
    passport.serializeUser((user, done) => {
        done(null, user.id);    //done(에러 발생 시 사용, 저장하고 싶은 데이터)
    });

    //세션에 저장한 아이디를 통해 사용자 정보 객체를 불러옴
    //로그인 이후 매 요청 이전에 passport.session 미들웨어가 메서드를 호출
    //serializeUser의 done에서 저장한 데이터가 매개변수가 됨
    passport.deserializeUser((id, done) => {
        User.findOne({
            where : {id},
            include: [{
                model: User,
                attributes: ['id'],
                as: 'Followers',
            },{
                model: User,
                attributes: ['id'],
                as: 'Followings',
            }], 
        })   //세션에 저장했던 id를 받아 데이터베이스에서 사용자 정보를 조회함.
        .then(user => done(null, user)) //done(null, user) : 조회한 정보는 req.user에 저장된다.
        .catch(err => done(err));
        //라우터에서 req.user 객체 사용이 가능하다.
    });

    local();
}
