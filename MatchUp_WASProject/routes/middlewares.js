//isAuthenticated() : 로그인 중이면 true, 아니면 false이다.
//로그인 체크
exports.isLogin = (req, res, next) => {
    if(req.isAuthenticated()){
        next();
    }
    else{
        res.redirect(`/`);
    }
};

//로그인이 아님을 체크
exports.isNotLogin = (req, res, next) => {
    if(!req.isAuthenticated()){
        next();
    }
    else{
        res.redirect(`/`);
    }
};
