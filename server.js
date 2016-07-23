"use strict";

/*
** With promises and closure
 */

/*
** S+ plz Projected created by Driss and François for the Riot API Challenge 2016.
** This is the server. For it to work, follow these instructions:
** See the example.json file in the project folder? Inside of it are instructions on how to make our program work.
** Those are needed because you need an API-Key to use the program. We can't let you see our API-Keys so we need you to use your own.
** Just put it in th example.json file following the instructions, and then make sure you reference the path to this file in the "pathToYourApiKey" variable lower in the file.
*/

var port = 8083;
var express = require('express');
var app = express();
var serv = require('http').Server(app);

var request = require('request');
var async = require('async');
var rp = require('request-promise');
//var promise = require('promise');
//var Q = require('q');

var io = require('socket.io')(serv);

app.use(express.static('public'));

serv.listen(port);

//This is the variable you might have to change to have the project working.
//Make sure your file has the .json extension to it. Also don't forget the quotes around your API-key! Have fun!
//let pathToYourApiKey = "./config.json";
let ApiKey = require("./config.json");

// this map is here to convert the region to actual regions to use with the riot api
var PLATFORMS = {
    'br': 'BR1',
    'eune': 'EUN1',
    'euw': 'EUW1',
    'kr': 'KR',
    'lan': 'LA1',
    'las': 'LA2',
    'na': 'NA1',
    'oce': 'OC1',
    'tr': 'TR1',
    'ru': 'RU',
    'pbe': 'PBE'
};

function main () {
    console.log("Server started listening on port: " + port);
    io.on('connection', function (socket) {
        let called = false; //this prevents users from spamming the "submit" button on the client and have us execute the same request too many times
        let region = ""; //the summoner's region
        let summonerName = ""; //the summoner's name
        let version = ""; //the current version of the game, for the square pictures we decided to always use the latest ones
        let championsMap = {}; //a custom object containing info we need about the summoner's champions
        let toSend = {}; //the final thing to send to the client for it to print the info

        socket.on("client info", function (data) {
            if (called == false){
                called = true;
                let tmp = data.split(",");
                summonerName = tmp[0];
                region = tmp[1].toLowerCase();
                var a = sendInfo(region, summonerName, socket);

            }
        });
    });
}

function getGameInfo(region) {
  function logError(e) {
    console.error("error is:" + e);
    throw (e);
  }
  var a = getVersion(region);
  var b = a.then(function (version) {
    let req = "http://ddragon.leagueoflegends.com/cdn/" + version + "/data/en_US/champion.json " ;

    return new Promise(function(resolve, reject) {
      request(req, function (error, response, body) {
        let championsMap = {};

        if (!error && response.statusCode == 200) {
          let str = JSON.parse(body);
          delete str.type;
          delete str.format;
          delete str.version;
          str = str.data;
          for (let champ in str) {
            let champTmp = [];
            champTmp.push(str[champ].id);
            champTmp.push(str[champ].name);
            championsMap[str[champ].key] = champTmp;
          }
          resolve(championsMap);
        }
        else {
          console.log("ERROR");
          if (error && response) {
            console.log("Problem with the request, error is: " + error + " with status code " + response.statusCode);
          }
          return Promise.resolve("Fail");
        }
      });
    });
  });

  var all = b.then(function(val) {
    //console.log(val);
  });
  return Promise.all([a, b]);

}

function getVersion (region) {
    let req = "https://global.api.pvp.net/api/lol/static-data/" + region + "/v1.2/versions?api_key=" + ApiKey;
    return rp({uri: req, json: true})
      .then(function (data) {
        let version = "";
        version = data[0];
        return Promise.resolve(version);
      })
      .catch(function(e) {
        console.log("get version request failed");
        return Promise.resolve("Request Fail");
      })
    ;
}

function getPlayerInfo(region, summonerName) {
  let a = getSummonerId(region, summonerName);
  let b = a.then(function(infos) {
    let req = "https://" + region + ".api.pvp.net/championmastery/location/" + PLATFORMS[region] + "/player/" + infos.id + "/champions?api_key=" + ApiKey;
    return new Promise (function(resolve, reject) {
        request(req, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            let str = JSON.parse(body);
            for (let i = 0; i < str.length; ++i) {
              delete str[i].playerId;
              delete str[i].lastPlayTime;
              delete str[i].championPointsSinceLastLevel;
            }
            resolve(str);
          }
          else {
            if (error && response){
              console.log("Problem with the request, error is: " + error + " with status code " + response.statusCode);
            }
          }
        });
      });
    });
  let all = b.then(function (value) {
  });
return Promise.all([a, b]);
}

function getSummonerId(region, summonerName) {
    let req = "https://" + region + ".api.pvp.net/api/lol/" + region + "/v1.4/summoner/by-name/" + summonerName + "?api_key=" + ApiKey;
    let sN = summonerName.replace(/\s+/g, '');
    sN = sN.toLowerCase();
    return new Promise (function(resolve, reject) {
      request(req, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          let str = JSON.parse(body);
          let id = {};
          id.id = str[sN].id;
          id.name = str[sN].name;
          id.region = region;
          id.icon = "http://ddragon.leagueoflegends.com/cdn/6.9.1/img/profileicon/" + str[sN].profileIconId + ".png";
          id.level = str[sN].summonerLevel;
          resolve(id);
        }
        else {
          if (error && response) {
            console.log("Problem with the request, error is: " + error + " with status code " + response.statusCode);
          }
        }
      });
    });
}

function sendInfo(region, summonerName, socket) {
  Promise.all([
    getGameInfo(region),
    getPlayerInfo(region, summonerName)
  ])
  .then(values => {
    var send = mergeInfo(values[0], values[1]);
    socket.emit("info sent", send);
    this.called = false;
  });

  function mergeInfo(versionChampions, playerInfo){
    let toSend = {};

    let championsMap = versionChampions[1];
    let champMasteries = playerInfo[1];
    toSend.infos = playerInfo[0];

    for (let i = 0; i < champMasteries.length; ++i) {
      let champId = champMasteries[i].championId;
      let urlSquare = "http://ddragon.leagueoflegends.com/cdn/" + versionChampions[0] + "/img/champion/" + championsMap[champId][0] + ".png";
      champMasteries[i].name = championsMap[champId][1];
      champMasteries[i].riotName = championsMap[champId][0];
      champMasteries[i].urlImage = urlSquare;

      champId = championsMap[champId];
    }
    toSend.champMasteries = champMasteries;
    return toSend;
  }
}

main();
