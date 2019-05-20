var express = require("express");
var osc = require('node-osc');

var bodyParser = require("body-parser");
var app = express();
var hbs = require("express-handlebars");
var path = require("path");
var PORT = process.env.PORT || 4040;
var io = require('socket.io')(8081);

app.engine("handlebars",hbs({extname: "handlebars", defaultLayout: "main", layoutsDir:__dirname + "/views/layouts/"}));
app.set("views", path.join(__dirname,"views"));
app.set("view engine", "handlebars");

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", function (req,res) {
    res.render('index', {title:"JD OSC app"});
})

app.listen(PORT,listening);

function listening() {
    console.log("listening on:", PORT);
}

var oscServer, oscClient;

var isConnected = false;

io.sockets.on('connection', function (socket) {
	console.log('connection');
	socket.on("config", function (obj) {
		isConnected = true;
    	oscServer = new osc.Server(obj.server.port, obj.server.host);
	    oscClient = new osc.Client(obj.client.host, obj.client.port);
	    oscClient.send('/status', socket.sessionId + ' connected');
		oscServer.on('message', function(msg, rinfo) {
			socket.emit("message", msg);
		});
		socket.emit("connected", 1);
	});
 	socket.on("message", function (obj) {
		oscClient.send.apply(oscClient, obj);
  	});
	socket.on('disconnect', function(){
		if (isConnected) {
			oscServer.kill();
			oscClient.kill();
		}
  	});
});