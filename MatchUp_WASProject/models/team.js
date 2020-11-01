const Sequelize = require('sequelize');
//npx sequelize db:create
module.exports = class Team extends Sequelize.Model {
  static init(sequelize) {
    return super.init({     
      //id INT NOT NULL AUTO_INCREMENT,
      //name VARCHAR(30) NOT NULL,
      team_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      //leader_idx INT NOT NULL
      leader_idx: {
        type: Sequelize.INTEGER,
        allowNull: false, 
      },
      //keyword VARCHAR(1000) NOT NULL,
      keyword: {
        type: Sequelize.STRING(1000),
        allowNull: false,
      },
      //region VARCHAR(300) NOT NULL,
      region: {
        type: Sequelize.STRING(300),
        allowNull: true,
      },
      //team_level INT NOT NULL DEFAULT 0,
      team_level: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      //content BLOB DEFAULT '아직 소개글이 없습니다.'
      content: {
        type: Sequelize.BLOB,
        allowNull: true,
        defaultValue: '아직 소개글이 없습니다',
      },
      //photo VARCHAR(300),
      photo: {
        type: Sequelize.STRING(300),
        allowNull: true,
      },
      state: {
        type:Sequelize.STRING(300),
        allowNull: true,
        defaultValue: '없음'
      }
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Team',
      tableName: 'teams',
      paranoid: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    //팀에 가입된 사람들 목록
    db.Team.belongsToMany(db.User, { through: 'Belong' });
    
    //동료 찾기 게시글
    db.Team.hasMany(db.Offer, { foreignKey: 'offerteam', sourceKey: 'id' });
  }
};

//npx sequelize db:create로 mysql에 자동생성