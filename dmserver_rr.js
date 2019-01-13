var zmq = require('zmq');

var HOST = '127.0.0.1';
var PORT = 9001;
var PUBLISH_PORT = 9002;

var dm = require('./dm.js');

var MESSAGE_END = '#@FIN_MENSAJE@#';
var WEBSERVER_TOPIC = 'webserver';
var DATASERVER_TOPIC = 'checkpoint';

// Create the server socket, on client connections, bind event handlers
var responder = zmq.socket('rep');
var publisher = zmq.socket('pub');
var subscriber = zmq.socket('sub');

var serverList = [];

function retardo(n) {
	var time = new Date().getTime();
	var time2 = time + n;
	while (time < time2) {
		time = new Date().getTime();
	}
}

function sendToWebServers(command, content) {
	publisher.send([WEBSERVER_TOPIC, command, content]);
}

function sendToDataServers(command, content) {
	publisher.send([DATASERVER_TOPIC, command, content]);
}

function propagateChanges(command, content) {
	sendToWebServers(command, content);
	sendToDataServers(command, content);
}

responder.on('message', function (data) {

	console.log('request comes in...' + data);
	var str = data.toString();
	var invoArray = str.split(MESSAGE_END);

	invoArray.filter(el => { return el }).forEach(function (invoStr) {
		var invo = JSON.parse(invoStr);
		console.log('request is:' + invo.what + ':' + invoStr);

		var reply = { what: invo.what, invoId: invo.invoId };
		switch (invo.what) {
			case 'get subject list':
				reply.obj = dm.getSubjectList();
				break;
			case 'get public message list':
				reply.obj = dm.getPublicMessageList(invo.sbj);
				break;
			case 'get private message list':
				reply.obj = dm.getPrivateMessageList(invo.u1, invo.u2);
				break;
			case 'add subject':
				reply.obj = dm.addSubject(invo.sbj);
				propagateChanges('add subject', JSON.stringify([reply.obj, invo.sbj]));
				break;
			case 'add user':
				reply.obj = dm.addUser(invo.u, invo.p);
				break;
			case 'add public message':
				reply.obj = dm.addPublicMessage(invo.msg);
				propagateChanges('add public message', JSON.stringify(invo.msg));
				break;
			case 'add private message':
				reply.obj = dm.addPrivateMessage(invo.msg);
				break;
			case 'get user list':
				reply.obj = dm.getUserList();
				break;
			case 'login':
				reply.obj = dm.login(invo.u, invo.p);
				break;
		}
		console.log('reply: ', reply);
		responder.send(JSON.stringify(reply) + MESSAGE_END);
	})
});

var args = process.argv.slice(2);
if (args.length > 0) {
	HOST = args[0];
	PORT = args[1];
	PUBLISH_PORT = args[2];
	var serverUrls = args[3];
	if (serverUrls) {
		serverList = serverUrls.split(',');
	}
}

serverList.forEach(serverUrl => {
	subscriber.connect(serverUrl);
});

subscriber.subscribe(DATASERVER_TOPIC);
subscriber.on('message', (topicBuffer, commandBuffer, contentBuffer) => {
	var commandString = commandBuffer.toString();
	var contentString;
	if (contentBuffer) {
		contentString = contentBuffer.toString();
	}
	switch (commandString) {
		case 'add public message':
			dm.addPublicMessage(JSON.parse(contentString));
			sendToWebServers(commandString, contentString);
			break;
		case 'add subject':
			console.log('contentBuffer.toString(): ', contentString);
			var sbj = JSON.parse(contentString)[1];
			var newSubjectId = dm.addSubject(sbj);
			sendToWebServers(commandString, JSON.stringify([newSubjectId, sbj]));
			break;
		default:
			console.log('could not parse ', commandString, ' into a command');
			break;
	}
});

responder.bind(HOST + ':' + PORT, err => {
	if (err) console.log("responder bind err: " + err)
	else console.log("responder bind ok")
});
publisher.bind(HOST + ':' + PUBLISH_PORT, err => {
	if (err) console.log("publisher bind err: " + err)
	else console.log("publisher bind ok")
});


