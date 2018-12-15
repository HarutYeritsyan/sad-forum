var dm = require('./dm_remote_rr.js');

var HOST = '127.0.0.1';
var PORT = 9001;
var CMD = '';
var CMD_ARG_1 = '';
var CMD_ARG_2 = '';
var CMD_ARG_3 = '';
var CMD_ARG_4 = '';


var args = process.argv.slice(2);
if (args.length > 2) {
	HOST = args[0];
	PORT = args[1];

	var commandParts = args.slice(2);
	if (commandParts.length >= 1) {
		CMD = commandParts[0];
	}

	if (commandParts.length > 1) {
		CMD_ARG_1 = commandParts[1];
	}
	if (commandParts.length > 2) {
		CMD_ARG_2 = commandParts[2];
	}
	if (commandParts.length > 2) {
		CMD_ARG_3 = commandParts[3];
	}
	if (commandParts.length > 2) {
		CMD_ARG_4 = commandParts[4];
	}

} else {
	console.log('Usage: node dmclient.js HOST PORT CMD [...CMD ARGS]');
	return;
}

// Messages are objects with some specific fields
// the message itself, who sends, destination, whether is private message, timestamp 
function Message(msg, from, to, isPrivate, ts) {
	this.msg = msg; this.from = from; this.isPrivate = isPrivate; this.to = to; this.ts = ts;
}

function parseCommand(cmd, cb) {
	switch (cmd) {
		case 'get subject list':
			dm.getSubjectList(function (ml) {
				console.log("here it is:")
				console.log(JSON.stringify(ml));
				cb();
			});
			break;
		case 'get public message list':
			dm.getPublicMessageList(CMD_ARG_1, function (ml) {
				console.log("here it is:")
				console.log(JSON.stringify(ml));
				cb();
			});
			break;
		case 'get private message list':
			dm.getPrivateMessageList(CMD_ARG_1, CMD_ARG_2, function (ml) {
				console.log("here it is:")
				console.log(JSON.stringify(ml));
				cb();
			});
		case 'add subject':
			dm.addSubject(CMD_ARG_1, function () {
				console.log('subject ' + CMD_ARG_1 + ' added');
				cb();
			});
			break;
		case 'add user':
			dm.addUser(CMD_ARG_1, CMD_ARG_2, function () {
				console.log('user ' + CMD_ARG_1 + ' added');
				cb();
			});
			break;
		case 'add public message':
			var msg = new Message(CMD_ARG_1, CMD_ARG_2, CMD_ARG_3, CMD_ARG_4 ? true : false, '');
			msg.ts = new Date();
			dm.addPublicMessage(msg, function () {
				console.log('public message ' + msg.msg + ' added');
				cb();
			});
			break;
		case 'add private message':
			dm.addPrivateMessage(CMD_ARG_1, function () {
				console.log('public message ' + CMD_ARG_1 + ' added');
				cb();
			});
			break;
		case 'get user list':
			dm.getUserList(function (ml) {
				console.log("here it is:")
				console.log(JSON.stringify(ml));
				cb();
			});
			break;
		case 'login':
			dm.login(CMD_ARG_1, CMD_ARG_2, function (ml) {
				console.log('user login: ' + JSON.stringify(ml))
				cb();
			});
			break;
		default:
			dm.getSubjectList(function (ml) {
				console.log("here it is:")
				console.log(JSON.stringify(ml));
				cb();
			});
			break;
		// DONE: complete all forum functions
	}
}

dm.Start(HOST, PORT, function () {
	// Write the command to the server
	parseCommand(CMD, function () {
		console.log('command executed');
	});
});
