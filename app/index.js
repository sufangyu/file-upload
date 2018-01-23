const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const art = require('express-art-template');
const logger = require('morgan');
const opn = require('opn');

const app = express();
const PORT = 8080;



/**------------------------
 * Config
 --------------------------*/
// static dir
app.use('/static', express.static(__dirname + '/static'));

// use cookie
app.use(cookieParser());

// get post body params
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit:'50mb', extended:true }));



// engine
art.template.defaults.extname = '.html';
art.template.defaults.minimize  = true;

app.engine('html', art);
app.set('views', __dirname + '/views');
app.set('view options', {
  debug: process.env.NODE_ENV !== 'production'
});


if (!module.parent) {
    app.use(logger('dev'));
}



/**------------------------
 * Route listings
 --------------------------*/
const site = require('./router/site');
const upload = require('./router/upload');

app.get('/', site.index);


// 文件上传
app.get('/upload', upload.upload);
app.post('/upload', upload.postUpload);



// 404
app.use(function(req, res, next) {
  res.status(404).send('Sorry cant find that!');
});

// 500
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

 

/**------------------------
 * Listener and start App
 --------------------------*/
if (!module.parent) {
  const server = app.listen(PORT);
  console.log('Uplaod started up on port ' + PORT);
  opn('http://localhost:' + PORT, {app: ['chrome']});
  
}

module.exports = app;
