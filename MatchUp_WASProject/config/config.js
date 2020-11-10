require('dotenv').config();

module.exports = {
  development: {
    username: 'root',
    password: process.env.SEQUELIZE_PASSWORD,
    database: 'matchup',
    host: '127.0.0.1',
    dialect: 'mysql',
    dialectOptions: {
        charset: "utf8mb4", 
        dateStrings : true, 
        typeCast : true 
      },
    timezone: "+09:00"
  },
  test: {
    username: "root",
    password: process.env.SEQUELIZE_PASSWORD,
    database: "matchup_test",
    host: "127.0.0.1",
    dialect: "mysql",
    dialectOptions: {
        charset: "utf8mb4", 
        dateStrings : true, 
        typeCast : true 
      },
    timezone: "+09:00"
  },
  production: {
    username: 'root',
    password: process.env.SEQUELIZE_PASSWORD,
    database: 'matchup',
    host: '127.0.0.1',
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
        charset: "utf8mb4", 
        dateStrings : true, 
        typeCast : true 
      },
    timezone: "+09:00"
  },
};
