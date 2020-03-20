const plagiarism = require('plagiarism');
const MossClient = require('moss-node-client')

const Student = require('../models/student');
const Document = require('../models/document');
const Task = require('../models/task');

const Professor = require('../models/professor');
const fs = require('fs');

exports.getProfessor = (req, res, next) => {
        const taskId = req.params.taskId;
        const user = req.session.user;
        const where = taskId ? {
                where: {
                        taskId: taskId,
                        studentId: null
                }
        } : {
                        where: {
                                studentId: null
                        }
                };
        
        Professor.findAll().then((professors) => {
               
                if (professors.length > 0) {
                        professors[0].getDocument(where).then((document) => {
                                getProfessorView(user, res, taskId, req.session.isLoggedIn, req.session.role, false, document ? document.name : null);

                        }).catch();
                } else res.redirect('/');
        }).catch(err => console.log(err));

}
getProfessorView = (user, res, taskId, isLoggedIn, role, checked, professorFile) => {
        const checkedOpt = checked ? "checked" : "";

        return fetchAllStudents(user.id, (students) => {
                if (taskId === null || taskId === undefined) taskId = 1;

                const stArr = [];
                let currTask = [];

                Promise.all(students.map(student => {
                        return student.getDocuments({
                                where: {
                                        taskId: taskId
                                }
                        })
                                .then(documents => {
                                        console.log('+++++++++++++++++++++++docs' + JSON.stringify(documents) + '++++++++++++++++++++++++++++++++++++++++++++')
                                        stArr.push({ student: student, documents: documents });

                                }).catch(err => console.log(err));
                }))
                        .then(() => {
                                Task.findAll({
                                        where: {
                                                professorId: user.id
                                        }
                                }).then(tasks => {
                                        Task.findAll({
                                                where: {
                                                        id: taskId
                                                }
                                        }).then(task => {
                                                return res.render('professor', {
                                                        message: '',
                                                        isAutenticated: isLoggedIn,
                                                        role: role,
                                                        students: stArr,
                                                        checkedOP: checkedOpt,
                                                        professorFile: professorFile,
                                                        tasks: tasks,
                                                        currentTask: task
                                                });
                                        }).catch(err => console.log(err));

                                }).catch(err => console.log(err));

                        }).catch(err => console.log(err));

        });

}

exports.uploadBaseDoc = (req, res, next) => {
        const taskId = req.params.taskId
        let filedata = req.file;
        console.log(filedata);
        // если файл не был загружен
        if (!filedata)
                res.render('professor', { message: 'файл не был загружен' });
        else {
                // иначе, берем юзера из сессии(залогиненый пользователь)
                const user = req.session.user;
                //Ищем его в базе
                Professor.findAll({
                        where: {
                                id: user.id
                        }
                }).then((professors) => {
                        // как находим, создаем у него документ, который он подгрузил
                        if (professors.length > 0) {
                                professors[0].getDocument({
                                        where: {
                                                taskId: taskId
                                        }
                                }).then((document) => {

                                        if (document) {

                                                fs.unlink(document.path, (err) => { console.log(err) });

                                        }
                                        document.name = filedata.originalname;
                                        document.path = filedata.path;
                                        document.taskId = taskId;
                                        return document.save();


                                }).catch((err) => {
                                        console.log(err);
                                }
                                );

                        }

                })
                        .then((r) => {
                                return getProfessorView(user, res, taskId, req.session.isLoggedIn, req.session.role, true, filedata.originalname);

                        })
                        .then((r) => console.log(r))
                        .catch((err) => {
                                console.log(err);
                                return res.redirect('/');
                        }
                        );
        }
};
// загрузка файла студента для профессора
exports.downloadFile = (req, res, next) => {
        console.log('file!!!!!!!!!!!!!!!!!!!!!');

        const file = __dirname + '/../uploads/' + req.params.name;
        console.log('file!!!!!!!!!!!!!!!!!!!!!' + file);
        res.download(file);
};
// изменение деталей документа : оценка + антиплагиат
exports.updateDocumentDetails = (req, res, next) => {

        let Item;
        let Items = [];
        let mossCheck = false;
        let lang;
        // преобразование массива параметров из формы для документов в массив объектов,
        // с которыми будет удобнее работать, изначально они выглядят так:
        // [id_1,mark_1, и т.д]
        console.log('----------------------------------------------------' + JSON.stringify(req.body))
        for (item in req.body) {
                let arr = item.split('_');
                if (arr.length != 2) return res.redirect('/professor');
                switch (arr[0]) {
                        case "id":
                                Item = {};
                                Item["id"] = req.body[item];
                                break;
                        case "check":
                                Item["check"] = req.body[item];
                                Items.push(Item);
                                break;
                        case "moss-check":
                                if (req.body[item] === 'on') {
                                        mossCheck = true;
                                }

                                break;
                        case "select-lang":
                                lang = req.body[item];
                        default:
                                if (arr[0] == 'mark' && req.body[item] == 0) continue;
                                Item[arr[0]] = req.body[item];
                                if (!Item["check"]) Items.push(Item);
                }
        }

        // проходим по массиву полученных объектов
        Items.forEach((el) => {
                // ищем документ по id

                Document.findAll({
                        where: {
                                id: Number.parseInt(el.id)
                        }
                }).then(documents => {
                        // если док найден
                        if (documents.length > 0) {

                                //сразу добываем оценку и присваиваем модели
                                documents[0].mark = el.mark;
                                // теперь проверка если нужно делать антиплагиат
                                if (el.check != undefined && el.check === "on") {
                                        let score;
                                        if (!mossCheck) {
                                                plagiarismCheck(documents[0].path, (r) => {
                                                        // через какое то время получаем ответ с сервера
                                                        // и присваиваем его в случае удачи объекту
                                                        score = r;
                                                        saveScore(documents[0], score).then(r => {
                                                                console.log(r);

                                                        }).catch(err => {
                                                                console.log(err);

                                                        });
                                                });
                                        } else {
                                                let professorId = req.session.user ? req.session.user.id : null;

                                                fetchProfessorDocs(professorId, (err, doc) => {
                                                        if (!err) {
                                                                if (doc) {
                                                                        const pathBase = doc.path;
                                                                        const path = documents[0].path;
                                                                        plagiarismCheckMoss(pathBase, path, lang, (r) => {
                                                                                score = r;
                                                                                saveScore(documents[0], score).then(r => {
                                                                                        console.log(r);


                                                                                }).catch(err => {
                                                                                        console.log(err);

                                                                                });
                                                                        });
                                                                }
                                                        } else {
                                                                console.log(err);
                                                        }

                                                }).catch(err => console.log(err));
                                        }

                                }


                                //асинхронная проверка в антиплагиате

                        } else {
                                // sequelize сохраняет изменения
                                documents[0].save().then(r => {
                                        console.log(r);

                                }).catch(err => {
                                        console.log(err);

                                });
                        }

                }).catch(err => {
                        console.log(err);
                        return res.redirect('/professor');
                });
        });
        // возвращаемся на страницу профессора со списком студентов
        res.redirect('/professor');
};
exports.addTask = (req, res, next) => {
        let filedata = req.file;
        const desc = req.body.description;

        console.log('????????????????' + filedata);
        // если файл не был загружен
        if (!filedata)
                res.render('professor', { message: 'файл не был загружен' });
        else {
                // иначе, берем юзера из сессии(залогиненый пользователь)
                const user = req.session.user;

                //Ищем его в базе
                Professor.findAll({
                        where: {
                                id: user.id
                        }
                }).then((professors) => {
                        // как находим, создаем у него документ, который он подгрузил
                        if (professors.length > 0) {
                                return professors[0].createTask({
                                        description: desc,
                                        path: filedata.path
                                });

                        }

                })
                        .then((r) => {

                                //Ищем его в базе
                                Professor.findAll({
                                        where: {
                                                id: user.id
                                        }
                                }).then((professors) => {
                                        console.log('hhhhhhhhhhhhh---------------------------' + JSON.stringify(professors));

                                        if (professors && professors.length > 0) {
                                                professors[0].getDocument({
                                                        where: {
                                                                studentId: null
                                                        }
                                                }).then(document => {
                                                        console.log('hhhhhhhhhhhhh---------------------------' + JSON.stringify(document));
                                                        return getProfessorView(user, res, r.id, req.session.isLoggedIn, req.session.role, true, document ? document.dataValues : null);



                                                }).catch();
                                        }
                                }).catch(err => console.log(err));

                        })
                        .then((r) => console.log(r))
                        .catch((err) => {
                                console.log(err);
                                return res.redirect('/');
                        }
                        );
        }

}
saveScore = (document, score) => {

        document.plagiate_score = score;
        // sequelize сохраняет изменения
        return document.save();
}
plagiarismCheck = (path, cb) => {
        fs.readFile(__dirname + '/../' + path, 'utf8', (err, contents) => {
                //вызов API антиплагиата text.ru через модуль plagiarism
                plagiarism(contents, {
                        "text.ru": {
                                "userkey": "44e601afdf34f71a8d2b9740cf614767"
                        }
                }).then(res => {
                        // в случае удачи, возвращаем значение в колбэк
                        cb(Number.parseFloat(res.main.percent) / 100);
                }).catch(err => {
                        // в случае какой то ошибки возвращается 0
                        cb(0.00);
                });
        });
}
plagiarismCheckMoss = (pathBase, path, language, cb) => {
        let client = new MossClient(language, '622907353');
        client.addBaseFile('./' + pathBase, 'base');
        client.addFile('./' + path, 'sub');
        let url = client.process().then((r) => console.log(r)).catch((err) => console.log(err));
        console.log('url ================================================================' + url);
        cb(100);

}

//внутренняя функция поиска студентов для профессора, идентифицированного по professorId
fetchAllStudents = (professorId, cb) => {
        Professor.findAll({
                where: {
                        id: professorId
                }
        })
                .then(professor => {
                        if (professor.length > 0) {
                                // если у профессора есть студенты, возврашаем их
                                professor[0].getStudents()
                                        .then((students) => {
                                                return cb(students);
                                        })
                                        .catch(err => {
                                                console.log(err);
                                                return cb(err);
                                        });
                        } else { }
                })
}
fetchProfessorDocs = (professorId, cb) => {
        if (professorId) {
                Document.findAll({
                        where: {
                                professorId: professorId
                        }
                }).then((documents) => {
                        return cb(null, documents[0]);

                }).catch((err) => {
                        return cb(err, null);
                });
        }
}
getProfessorById = (id, cb) => {
        Professor.findAll({
                where: {
                        id: id
                }
        }).then(professor => cb(professor)).catch(err => cb(err));
}