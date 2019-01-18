var zmq = require('zmq');

var requester = zmq.socket('req');

exports.Start = function (host, port, cb) {
	console.log('Connecting to: ' + host + ':' + port);
	requester.connect(host + ':' + port);
	cb();
}


var callbacks = {} // hash of callbacks. Key is invoId
var invoCounter = 0; // current invocation number is key to access "callbacks".

var MESSAGE_END = '#@FIN_MENSAJE@#';

//
// When data comes from server. It is a reply from our previous request
// extract the reply, find the callback, and call it.
// Its useful to study "exports" functions before studying this one.
//
requester.on('message', function (data) {
	console.log('data comes in: ' + data);
	var dataString = data.toString();
	var dataArray = dataString.split(MESSAGE_END);
	dataArray.filter(el => el).forEach(dataElement => {
		var reply = JSON.parse(dataElement);
		switch (reply.what) {
			case 'get private message list':
			case 'get public message list':
			case 'get subject list':
			case 'get user list':
			case 'login':
				console.log('We received a reply for: ' + reply.what + ':' + reply.invoId);
				callbacks[reply.invoId](reply.obj); // call the stored callback, one argument
				delete callbacks[reply.invoId]; // remove from hash
				break;
			case 'add private message':
			case 'add public message':
			case 'add subject':
			case 'add user':
				console.log('We received a reply for add command');
				callbacks[reply.invoId](); // call the stored callback, no arguments
				delete callbacks[reply.invoId]; // remove from hash
				break;
			default:
				console.log("Panic: we got this: " + reply.what);
		}
	});
});

// Add a 'close' event handler for the requester socket
requester.on('close', function () {
	console.log('Connection closed');
});


//
// on each invocation we store the command to execute (what) and the invocation Id (invoId)
// InvoId is used to execute the proper callback when reply comes back.
//
function Invo(str, cb) {
	this.what = str;
	this.invoId = ++invoCounter;
	callbacks[invoCounter] = cb;
}

exports.getPublicMessageList = function (sbj, cb) {
	var invo = new Invo('get public message list', cb);
	invo.sbj = sbj;
	requester.send(JSON.stringify(invo) + MESSAGE_END);
}

exports.getPrivateMessageList = function (u1, u2, cb) {
	invo = new Invo('get private message list', cb);
	invo.u1 = u1;
	invo.u2 = u2;
	requester.send(JSON.stringify(invo) + MESSAGE_END);
}

exports.addPrivateMessage = function (msg, cb) {

	invo = new Invo('add private message', cb);
	invo.msg = msg;
	requester.send(JSON.stringify(invo) + MESSAGE_END);
}
exports.addPublicMessage = function (msg, cb) {
	invo = new Invo('add public message', cb);
	invo.msg = msg;
	requester.send(JSON.stringify(invo) + MESSAGE_END);
}

exports.getSubjectList = function (cb) {
	requester.send(JSON.stringify(new Invo('get subject list', cb)) + MESSAGE_END);
}

exports.addSubject = function (sbj, cb) {
	invo = new Invo('add subject', cb);
	invo.sbj = sbj;
	requester.send(JSON.stringify(invo) + MESSAGE_END);
}
exports.addUser = function (u, p, cb) {
	invo = new Invo('add user', cb);
	invo.u = u;
	invo.p = p;
	requester.send(JSON.stringify(invo) + MESSAGE_END);
}

exports.getUserList = function (cb) {
	requester.send(JSON.stringify(new Invo('get user list', cb)) + MESSAGE_END);
}

exports.login = function (u, p, cb) {
	invo = new Invo('login', cb);
	invo.u = u;
	invo.p = p;
	requester.send(JSON.stringify(invo) + MESSAGE_END);
}