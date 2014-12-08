// socket io
var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    url = require('url');

// Slack url
var msg_post_url = process.env.NODE_POT_BOT_MSG_URL || '';
console.log('msg_post_url='+msg_post_url);

app.listen(3000, function() {
  console.log('Socket IO Server is listening on port 3000');
});

function handler(req, res) {
  switch (req.method) {
    case 'GET':
      fs.readFile(__dirname + '/index.html', function(err, data) {
        if(err) {
          res.writeHead(500);
          return res.end('Error');
        }
        res.writeHead(200);
        res.write(data);
        res.end();
      });
      break;
    case 'POST':
      req.setEncoding('utf8');
      req.on('data', function(chunk) {
        console.log(chunk);
        var data = currentStateSlackMessage();
        res.writeHead(200);
        res.write(data);
        res.end();
      });
      break;
  }
};

//
function sendCurrentState(res) {
  res.writeHead(200);
  res.write(current_state);
  res.end();
};

// 待ち受け
io.sockets.on('connection', function(socket) {
  console.log('connection...');
  socket.on('emit_from_client', function(data) {
    console.log('socket.io server received : '+data);
    var response = createResponse(data);
    if(response) {
      // 接続しているソケット全部
      io.sockets.emit('emit_from_server', response);
    }
  });
});

// TCP server
var net = require('net');

net.createServer(function (socket) {
  console.log('socket connected');
  socket.on('data', function(data) {
    var data = data.toString();
    console.log('got "data"', data);
    var response = createResponse(data);
    if(response) {
      io.sockets.emit('emit_from_server', response);
    }
  });
  socket.on('end', function() {
    console.log('end');
  });
  socket.on('close', function() {
    console.log('close');
  });
  socket.on('error', function(e) {
    console.log('error ', e);
  });
  socket.write('hello from tcp server');
}).listen(3080, function() {
  console.log('TCP Server is listening on port 3080');
});


var current_state = 'unknown',
    border = 400,
    latest_value = 0;

var createResponse = function(data) {
  latest_value = parseInt(data);
  if(isNaN(latest_value) || isNaN(border)) {
    current_state = 'unknown';
  }
  if(latest_value > border) {
    sendIfStateChange();
    current_state = 'oyu';
  } else {
    current_state = 'mizu';
  }
  return {
    latest_value: latest_value,
    current_state: current_state,
    border: border
  };
};

var sendIfStateChange = function() {
  if(current_state != 'oyu') {
    // state change to oyu
    if(msg_post_url) {
      console.log('TODO send message to ' + msg_post_url);
    }
  }
};

var currentStateSlackMessage = function() {
  var msg = '';
  if(current_state == 'oyu') {
    msg = 'お湯わいてるよ〜♪';
  } else if(current_state == 'mizu') {
    msg = 'まだ水・・';
  } else {
    msg = '・・よくわかんない';
  }
  return '{"text": "'+ msg +'"}';
};
