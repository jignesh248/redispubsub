var SCWorker = require('socketcluster/scworker');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var morgan = require('morgan');
var healthChecker = require('sc-framework-health-check');
const url = require('url');
const Redis = require('ioredis');
const redis = new Redis();
const connections = process.env.connections || 1000

redis.subscribe('match1', 'match2', 'match3', 'match4', 'match5', function (err, count) {
  if(err){
    console.log(err)
  }   
});

class Worker extends SCWorker {
  run() {
    console.log('   >> Worker PID:', process.pid);
    var environment = this.options.environment;

    var app = express();

    var httpServer = this.httpServer;
    var scServer = this.scServer;

    if (environment === 'dev') {
      // Log every HTTP request. See https://github.com/expressjs/morgan for other
      // available formats.
      app.use(morgan('dev'));
    }
    app.use(serveStatic(path.resolve(__dirname, 'public')));

    // Add GET /health-check express route
    healthChecker.attach(this, app);

    httpServer.on('request', app);

    var count = 0;

    /*
      In here we handle our incoming realtime connections and listen for events.
    */
    scServer.on('connection', function (socket) {

      //console.log('new socket #' + socket.id + ' connected in (' + process.pid + ')');
      count += 1
      
      if(count == connections){
        console.log("all connected")
      }

      socket.on('disconnect', function (data) {
        console.log("one client disconnected")
      });

			socket.on('message', function (event) {
        //if(event && event["data"] && event["data"]["channel"] && event["data"]["channel"] == "ping"){
        //  console.log('message (' + process.pid + "): "+event.data.data);
        //}
			});

			socket.on('close', function (data) {
				console.log('socket #' + socket.id + ' closed in (' + process.pid + "): ");
			});

			socket.on('error', function (data) {
				console.log('error in (' + process.pid + "): ");
      });
      
    });

    scServer.on('connect', function(socket){
      console.log("scServer connect event")
    })

    scServer.on('error', function(socket){
      console.log("scServer error event")
    })

    scServer.on('disconnect', function(socket){
      console.log("scServer disconnect event")
    })

    scServer.on('connectAbort', function(socket){
      console.log("scServer connect event")
    })

    scServer.on('close', function(socket){
      console.log("scServer connect event")
    })

    redis.on('message', function (channel, message) {
      console.log('Received message %s from channel %s on server', message, channel);
      scServer.exchange.publish(channel, message);
    });
    
  }
}

new Worker();
