const Sequelize = require('sequelize');
//npx sequelize db:create
module.exports = class Offer extends Sequelize.Model {
  static init(sequelize) {
    /*
    _id,
    title : 제목
    content : 내용
    type : 구인 유형(용병, 팀원..)
    position : 구인 포지션 : 전체, 수비수, 공격수..
    team_idx : 팀 id
    */
    return super.init({     
      //id INT NOT NULL AUTO_INCREMENT,
      title: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      content: {
        type: Sequelize.BLOB,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      position: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Offer',
      tableName: 'offers',
      paranoid: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    //구인 게시글을 올린 팀
    db.Offer.belongsTo(db.Team, { foreignKey: 'offerteam', targetKey: 'id' });

  }
};

//npx sequelize db:create로 mysql에 자동생성