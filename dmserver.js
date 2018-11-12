var net = require('net');
var HOST = '127.0.0.1';
var PORT = 9001;

var dm = require('./dm.js');

var MESSAGE_END = '#@FIN_MENSAJE@#';

// Create the server socket, on client connections, bind event handlers
server = net.createServer(function (sock) {

	// We have a connection - a socket object is assigned to the connection automatically
	console.log('Conected: ' + sock.remoteAddress + ':' + sock.remotePort);

	// Add a 'data' event handler to this instance of socket
	sock.on('data', function (data) {

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
					break;
				case 'add user':
					reply.obj = dm.addUser(invo.u, invo.p);
					break;
				case 'add public message':
					reply.obj = dm.addPublicMessage(invo.msg);
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
				// DONE: complete all forum functions
			}
			sock.write(JSON.stringify(reply) + MESSAGE_END);
		})
	});


	// Add a 'close' event handler to this instance of socket
	sock.on('close', function (data) {
		console.log('Connection closed');
	});

});

var args = process.argv.slice(2);
if (args.length > 0) {
	PORT = args[0];
}

server.listen(PORT, HOST, function () {
	console.log('Server listening on ' + HOST + ':' + PORT);
});


