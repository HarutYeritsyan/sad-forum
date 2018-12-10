var zmq = require('zmq');

var HOST = '127.0.0.1';
var PORT = 9001;

var dm = require('./dm.js');

var MESSAGE_END = '#@FIN_MENSAJE@#';

// Create the server socket, on client connections, bind event handlers
var responder = zmq.socket('rep');
var publisher = zmq.socket('pub');
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
				break;
			case 'add user':
				reply.obj = dm.addUser(invo.u, invo.p);
				break;
			case 'add public message':
				reply.obj = dm.addPublicMessage(invo.msg);
				publisher.send(reply);
				console.log('published msg from server: ', JSON.stringify(reply));
				break;
			case 'add private message':
				reply.obj = dm.addPrivateMessage(invo.msg);
				publisher.send(invo.msg);
				break;
			case 'get user list':
				reply.obj = dm.getUserList();
				break;
			case 'login':
				reply.obj = dm.login(invo.u, invo.p);
				break;
			// DONE: complete all forum functions
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
}

responder.bind('tcp://127.0.0.1' + ':' + '9001', err =>{
	if (err) console.log ("responder bind err: " + err)
	else console.log ("responder bind ok")
});
publisher.bind('tcp://127.0.0.1' + ':' + '9002', err =>{
	if (err) console.log ("publisher bind err: " + err)
	else console.log ("publisher bind ok")
});


