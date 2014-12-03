// socket io
var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    url = require('url');

app.listen(3000, function() {
  console.log('Socket IO Server is listening on port 3000');
});

function handler(req, res) {
  var url_parts = url.parse(req.url, true);
  //console.log(url_parts);
  if(url_parts.path == '/status' || url_parts.path == '/state' || url_parts.path == '/oyu') {
    sendCurrentState(res);
  } else {
    fs.readFile(__dirname + '/index.html', function(err, data) {
      if(err) {
        res.writeHead(500);
        return res.end('Error');
      }
      res.writeHead(200);
      res.write(data);
      res.end();
    });
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