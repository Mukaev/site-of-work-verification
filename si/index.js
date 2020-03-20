const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sequelize = require('./utils/database');
const studentRoutes = require('./routes/student');
const professorRoutes = require('./routes/professor');
const isAuth=require('./middleware/is-Auth');

const authRoutes = require('./routes/auth');
const Document = require('./models/document');
const Student = require('./models/student');
const Professor = require('./models/professor');
const Task = require('./models/task');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
//const fs = require('fs');
//определение хранилища для сессии
const store = new MySQLStore({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'mukaevilia44',
    database: 'studiu'
});

const app = express();
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(bodyParser.urlencoded({ extended: false }));

//определение где будут храниться статические/ общедоступные документы - таблицы стилей, изображения
app.use(express.static(__dirname));

app.use(express.static(path.join(__dirname, 'public')));
app.use(
    session({secret:'my secret',resave:false,saveUninitialized:false,store:store})
);
app.use(studentRoutes);
app.use(professorRoutes);
app.use(authRoutes);

// определение рутинга для главной, доиашней страницы
app.get('/',isAuth, (req, res, next) => {
    res.render('main',{isAutenticated:req.session.isLoggedIn,role:req.session.role});
})
Document.belongsTo(Student,{constraints:true,onDelete:'CASCADE'});
Student.hasMany(Document);

Student.belongsTo(Professor,{constraints:true,onDelete:'CASCADE'});
Professor.hasMany(Student);
Document.belongsTo(Professor,{constraints:true,onDelete:'CASCADE'});
Professor.hasOne(Document);
Professor.hasMany(Task);
Task.belongsTo(Professor,{constraints:true,onDelete:'CASCADE'});
Task.hasMany(Document);
Document.belongsTo(Task,{constraints:true,onDelete:'CASCADE'});
// синхронизация sequelize
sequelize
// асинхронная функция синхронизации sequelize  с базой mysql
.sync()
// здесь и далее  - промис, выполняется в случае удачного выполнения асинхронного запроса
.then((res)=>{
    console.log(res);
    app.listen(3030);
})
// здесь и далее  - промис, выполняется в случае ошибок при выполнении асинхронного запроса
.catch(err=>console.log(err));
