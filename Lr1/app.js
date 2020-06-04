const express = require('express');
const app = express();
const fs = require('fs');
app.use(express.json());

app.use('/', express.static(__dirname + '/public'));
app.post('/favorites', (req, res, next) => {
    console.log(req.body.favorites);
    let data = JSON.stringify(req.body.favorites);
    fs.writeFileSync('myjsonfile.json', data);
    res.send(JSON.stringify({ favorites: 'ok' }));
})
app.get('/favorites', (req, res, next) => {
    let rawdata = fs.readFileSync('myjsonfile.json');
    let favorites = JSON.parse(rawdata);
    console.log(favorites);
    res.setHeader('Content-Type', 'application/json');
    res.send({ favorites: favorites });
})
app.listen(3000);