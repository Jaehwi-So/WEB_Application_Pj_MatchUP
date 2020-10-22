const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const User = require('./user');

const db = {};
const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);

db.sequelize = sequelize;
//모델 설정
db.User = User;

//모델 초기화
User.init(sequelize);

//모델 관계설정
User.associate(db);

module.exports = db;
