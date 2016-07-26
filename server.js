"use strict";

/*
** With promises and closure
 */

/*
** S+ plz Projected created by Driss and François for the Riot API Challenge 2016.
** This is the server. For it to work, follow these instructions:
** See the example.json file in the project folder? Inside of it are instructions on how to make our program work.
** Those are needed because you need an API-Key to use the program. We can't let you see our API-Keys so we need you to use your own.
** Just put it in th example.json file following the instructions, and then make sure you reference the path to this file in the "ApiKey" variable lower in the file.
*/

var port = 8083;
var express = require('express');
var app = express();
var serv = require('http').Server(app);
var io = require('socket.io')(serv);

var PObj = require('./proc_obj.js');

app.use(express.static('public'));

serv.listen(port);

//This is the variable you might have to change to have the project working.
//Make sure your file has the .json extension to it. Also don't forget the quotes around your API-key! Have fun!
//let pathToYourApiKey = "./config.json";
let ApiKey = require("./config.json");

function main () {
    console.log("Server started listening on port: " + port);
    io.on('connection', function (socket) {
        let called = false; //this prevents users from spamming the "submit" button on the client and have us execute the same request too many times
        socket.on("client info", function (tmp) {
            if (called == false){
              called = true;
              var proc = new PObj(ApiKey, tmp, socket);
              let changeCalled = proc.sendInfo();
              changeCalled.then(function(data) {
                called = data;
              });
            }
        });
    });
}

main();
