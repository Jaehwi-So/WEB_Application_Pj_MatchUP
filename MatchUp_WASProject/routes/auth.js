const express = require('express');
const passport = require('passport');
const { isLogin, isNotLogin } = require('./middlewares');


const router = express.Router();

router.post('/login', isNotLogin, (req, res, next) => {
    //내부 미들웨어, 해당 로그인 strategy 후에 콜백함수 실행
    passport.authenticate('local', (authError, user, info) => {
        //authError값이 있으면 실패, user값이 있으면 성공
        if (authError) {    //에러 시
            console.error(authError);
            return res.json({ result: `error` });
        }
        if (!user) {    //에러 시
            return res.json({ result: `${info.message}` });
            //return res.redirect(`/?loginError=${info.message}`);
        }
        //strategy 성공 시 req.login()메서드 호출. passport는 req객체에 login과 logout 메서드를 추가함
        return req.login(user, (loginError) => {    //매개변수로 넘어가는 user객체가 serializeUser로 전달됨.
            if (loginError) {
                console.error(loginError);
                return res.json({ result: `error` });
            }
            return res.json({ result: `success` });
        });
    })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});

router.get('/logout', isLogin, (req, res) => {
  console.log('logout');
  req.logout();
  req.session.destroy();
  res.redirect('/');
});

module.exports = router; 