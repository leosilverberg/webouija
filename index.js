const express = require('express');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);



app.get('/', function(req, res){
    res.sendFile(__dirname+'/index.html');
  });

app.get('/ghost', function(req, res){
  res.sendFile(__dirname+'/ghost.html');
});
app.get('/notghost', function(req, res){
    res.sendFile(__dirname+'/notghost.html');
  });

app.use(express.static('public'))



var ghosts = {}

var notghosts = {}

io.on('connection', function(socket){
    console.log('a user connected');

    io.emit('ghostlist', Object.keys(ghosts))
    io.emit('notghostlist', Object.keys(notghosts))

    socket.on('ghostconnect', function(){
        console.log('a ghost connected')
        ghosts[socket.id] = socket;
        ghosts[socket.id].hasboard = false;
        ghosts[socket.id].notghost = null;
        console.log("ghosts: "+Object.keys(ghosts));
        io.emit('ghostlist', Object.keys(ghosts));
        findNotGhostToConnectWith();

    })

    socket.on('notghostconnect', function(){
        console.log('a not ghost connected')
        notghosts[socket.id] = socket;
        notghosts[socket.id].hasghost = false;
        notghosts[socket.id].ghost = null;
        console.log("not ghosts: "+Object.keys(notghosts));
        io.emit('notghostlist', Object.keys(notghosts));
        findGhostToConnectWith()
    });

    socket.on('move', function(id, msg){
      socket.broadcast.to(id).emit('move', msg);
    });


    //looking for ghosts
    function findGhostToConnectWith(){
      console.log("finding a free ghost!");
      var found = false;
      Object.keys(ghosts).forEach(function(key) {
        
        if(found == false){
          if(ghosts[key].hasboard == false){
            console.log("found one!");
            notghosts[socket.id].ghost = key;
            ghosts[key].notghost = socket.id;
            ghosts[key].hasboard = true;
            found = true;
            connectAsNotGhost()
          }
        }
        
      });
    };

  
    //looking for ghosts
    function findNotGhostToConnectWith(){
      console.log("finding a free none ghost!");
      var found = false;

      Object.keys(notghosts).forEach(function(key) {
        // console.log(ghosts[key].hasboard);
        if(found == false){
          if(notghosts[key].hasghost == false){
            console.log("found one!");
            ghosts[socket.id].notghost = key;
            notghosts[key].ghost = socket.id;
            notghosts[key].hasghost = true;
            found = true;
            connectAsGhost()
          }
        }
        
      });
    };

    function establishSeance(){
      io.to(socket.id).emit('startseance', 'hey you are connected');
    }

    function connectAsNotGhost(){
      io.to(socket.id).emit('startseance', notghosts[socket.id].ghost);
      io.to(notghosts[socket.id].ghost).emit('startseance', socket.id);
    }

    function connectAsGhost(){
      io.to(socket.id).emit('startseance', ghosts[socket.id].notghost);
      io.to(ghosts[socket.id].notghost).emit('startseance', socket.id);
    }

    socket.on('disconnect', function(){
      console.log('user disconnected');
      delete ghosts[socket.id];
      delete notghosts[socket.id];
      console.log("ghosts: "+Object.keys(ghosts));
      console.log("not ghosts: "+Object.keys(notghosts));
      io.emit('ghostlist', Object.keys(ghosts))
      io.emit('notghostlist', Object.keys(notghosts));
    });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});