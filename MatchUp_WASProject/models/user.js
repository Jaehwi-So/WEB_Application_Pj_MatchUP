const Sequelize = require('sequelize');
//npx sequelize db:create
module.exports = class User extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      //id INT NOT NULL AUTO_INCREMENT,
      //user_name VARCHAR(20) NOT NULL,
      user_name: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      //user_id VARCHAR(30) NOT NULL UNIQUE,
      user_id: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
      },
      //user_pwd VARCHAR(30) NOT NULL,
      user_pwd: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      //nick VARCHAR(30) NOT NULL UNIQUE,
      nick: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
      },
      //email VARCHAR(50) NOT NULL UNIQUE,
      email: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      //birth DATETIME NOT NULL,
      birth: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      //user_level INT DEFAULT 0,
      user_level: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      //main_position VARCHAR(20) DEFAULT '없음',
      main_position: {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: '없음',
      },
      //sub_position VARCHAR(20) DEFAULT '없음',
      sub_position: {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: '없음',
      },
      //content BLOB,
      content: {
        type: Sequelize.BLOB,
        allowNull: true,
      },
      //photo VARCHAR(300),
      photo: {
        type: Sequelize.STRING(300),
        allowNull: true,
      },
      //region VARCHAR(300),
      region: {
        type: Sequelize.STRING(300),
        allowNull: true,
      },
      gender:{
        type: Sequelize.STRING(10),
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'User',
      tableName: 'users',
      paranoid: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    //db.User.hasMany(db.Post);

    //N:M 관계 설정
    //회원을 팔로우하는 사람들 컬럼
    db.User.belongsToMany(db.User, {
      foreignKey: 'followingId',  //팔로잉하는 사람의 ID
      as: 'Followers',  //팔로워 목록
      through: 'Follow',  //생성할 모델 이름 Follow
    });
    //회원이 팔로잉하는 사람들 컬럼
    db.User.belongsToMany(db.User, {
      foreignKey: 'followerId', //팔로우하는 사람의 ID
      as: 'Followings', //팔로잉 목록
      through: 'Follow',  //생성할 모델 이름 Follow
    });
  }
};

//npx sequelize db:create로 mysql에 자동생성