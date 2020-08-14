var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
const cv = require('opencv4nodejs');
const WebSocket = require('ws');

console.log("starting init")

const FPS = 30;
const wCap = new cv.VideoCapture(3);
//wCap.set(3, 640)
//wCap.set(4, 480)
//wCap.set(5, 30)

console.log("cap sized")

// var connection = mysql.createConnection({
// 	host     : 'localhost',
// 	user     : 'root',
// 	password : 'Sq423454-',
// 	database : 'vrcade'
// });

var app = express();
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(express.static("public"));
app.engine('html', require('ejs').renderFile);
app.set("view engine", "html");

const server = require('http').Server(app);
	const io = require('socket.io')(server);

console.log("resizing")
console.log("resized")
app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname + '/index.html'));
});

app.post('/auth', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
		// connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (username=="demo" && password=="demo") {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/home');
			} else {
				response.send('Incorrect Username and/or Password!');
			}
			response.end();
		}
	 else {

		response.send('Please enter Username and Password!');
		response.end();
	}
});

app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		response.render('game.html');
	} else {
		response.send('Please login to view this page!');
	}
	response.end();
});

 setInterval(() => {
   var frame = wCap.read();
 	frame = frame.resize(480, 640)
   const image = cv.imencode('.jpg', frame).toString('base64');
   io.emit('image', image)
 }, 1000/FPS)

 io.on('connection', function (socket) {
	 socket.on('move', (msg) => {
		 console.log("msg received: " + msg)
		 send_command(msg)
	})
 });


;
server.listen(3000, function(){
    console.log("VRcade app server started...");
});

var send_command = function(msg) {
	const ws = new WebSocket('ws://72.76.33.46:50505');
	ws.on('open', function open() {
	  ws.send(msg);
	});
	ws.on('close', function () {
		console.log("close")
	});
}
