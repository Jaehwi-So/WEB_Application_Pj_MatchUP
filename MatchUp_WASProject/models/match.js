const Sequelize = require('sequelize');
//npx sequelize db:create
module.exports = class Match extends Sequelize.Model {
  static init(sequelize) {
    return super.init({     
      //id INT NOT NULL AUTO_INCREMENT,
      //name VARCHAR(30) NOT NULL,
      title: {
        type: Sequelize.STRING(400),
        allowNull: false,
      },
      region: {
        type: Sequelize.STRING(400),
        allowNull: false, 
      },
      time: {
        type: Sequelize.STRING(400),
        allowNull: false, 
      },
      content: {
        type: Sequelize.BLOB,
        allowNull: false, 
      },
      type: {
        type: Sequelize.STRING(400),
        allowNull: false, 
      },
      state: {
        type: Sequelize.STRING(400),
        allowNull: false, 
        defaultValue: '대전 찾는 중',
      },
     
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Match',
      tableName: 'matches',
      paranoid: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    //매칭 글을 올린 팀
    db.Match.belongsTo(db.Team, {foreignKey : 'rootteam' , as: 'Rootteam'});
    db.Match.belongsTo(db.Team, {foreignKey : 'opteam', as: 'Opteam'});
  }
};

//npx sequelize db:create로 mysql에 자동생성