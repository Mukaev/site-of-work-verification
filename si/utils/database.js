const Sequelize=require('sequelize');
const sequelize=new Sequelize('studiu','root','mukaevilia44',{
    dialect:'mysql',
    host:'mysql'
})
module.exports = sequelize;
