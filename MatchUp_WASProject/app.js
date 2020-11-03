const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const passport = require('passport');

dotenv.config();
const pageRouter = require('./routes/page');
const userRouter = require('./routes/user');
const authRouter = require('./routes/auth');
const teamRouter = require('./routes/team');
const messageRouter = require('./routes/message');
const matchRouter = require('./routes/match');
const roomRouter = require('./routes/room');
const { sequelize } = require('./models');
const webSocket = require('./socket');

const mongo_connect = require('./schemas');   
mongo_connect();    //몽고디비 연결

const fs = require('fs'); //파일스트림
const passportConfig = require('./passport');   

const app = express();
passportConfig(); // 패스포트 설정
app.set('port', process.env.PORT || 8001);
app.set('view engine', 'html');
nunjucks.configure('views', {
  express: app,
  watch: true,
});
sequelize.sync({ force: false })
  .then(() => {
    console.log('MySQL 연결 성공');
  })
  .catch((err) => {
    console.error(err);
  });

app.use(morgan('dev'));
try {
    fs.readdirSync('uploads');
} 
catch (error) {
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads');
}
app.use(express.static(path.join(__dirname, 'public')));
//업로드
app.use('/img', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
const sessionMiddleware = session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
  },
});
app.use(sessionMiddleware);


//passport 미들웨어는 express-session 미들웨어 뒤에 연결한다.
app.use(passport.initialize());//passport.initialize 미들웨어는 req객체에 passport 설정을 심는다.
app.use(passport.session());//passport.session 미드웨어는 req.session 객체에 passport 정보를 저장한다.

app.use('/', pageRouter);
app.use('/user', userRouter);
app.use('/auth', authRouter);
app.use('/team', teamRouter);
app.use('/message', messageRouter);
app.use('/match', matchRouter);
app.use('/room', roomRouter);

app.use((req, res, next) => {
  const error =  new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

const server = app.listen(app.get('port'), () => {
  console.log(app.get('port'), '번 포트에서 대기중');
});
webSocket(server, app, sessionMiddleware, passport);