const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy; //해당 모듈에서 Strategy 생성자를 불러와 전략을 구현한다.
const bcrypt = require('bcrypt');

const User = require('../models/user');


//로컬 로그인 시의 동작 전략(strategy) 처리
module.exports = () => {
  passport.use(new LocalStrategy(
  //첫번째 인수 : 객체 전략 설정, 로그인 라우터의 req.body의 속성명
  {   
    usernameField: 'user_id',
    passwordField: 'user_pwd',
  }, 
  //두번째 인수 : 실제 전략을 수행하는 async메서드. 첫번째 인수에서 설정해둔 속성이 메서드 인수로 들어간다.
  async (user_id, user_pwd, done) => { 
    try {
      const foundedUser = await User.findOne({ where: { user_id } });
      if (foundedUser) {
        //비밀번호와 암호화된 비밀번호 비교
        const result = await bcrypt.compare(user_pwd, foundedUser.user_pwd);
        //done은 passport.authenticate(authError, user, info)의 콜백함수
        if (result) {
          done(null, foundedUser);
        } 
        //아이디와 비밀번호가 불일치할 경우
        else {
          done(null, false, { message: 'notMatchPwd' });
        }
      } 
      //아이디가 존재하지 않을 경우
      else {
        done(null, false, { message: 'cannotFoundId' });
      }
    } catch (error) {
      console.error(error);
      done(error);
    }
  }));
};
