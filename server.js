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
//var async = require('async');
var rp = require('request-promise');

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

        socket.on("client info", function (data) {
            if (called == false){
              called = true;
              let tmp = data.split(",");
              summonerName = tmp[0];
              region = tmp[1].toLowerCase();

              var a = sendInfo();

              function sendInfo() {
                Promise.all([
                    getGameInfo(region),
                    getPlayerInfo(region, summonerName)
                  ])
                  .then(values => {
                    var send = mergeInfo(values[0], values[1]);
                    socket.emit("info sent", send);
                    called = false;
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
            }
        });
    });
}

function getGameInfo(region) {
  var a = getVersion(region);
  var b = a.then(function (version) {
    let req = "http://ddragon.leagueoflegends.com/cdn/" + version + "/data/en_US/champion.json " ;
    return rp({uri: req, json: true})
      .then( function(data) {
        let championsMap = {};
        let str = data.data;
        for (let champ in str) {
          championsMap[str[champ].key] = [str[champ].id, str[champ].name] ;
        }
        return Promise.resolve(championsMap);
      })
      .catch (function (e) {
        return Promise.reject(new Error("ChampionJSON Request Fail"));
      })
      .catch(function(err) {
        console.error(err);
      })
    ;
  });
  return Promise.all([a, b]);
}

function getVersion (region) {
    let req = "https://global.api.pvp.net/api/lol/static-data/" + region + "/v1.2/versions?api_key=" + ApiKey;
    return rp({uri: req, json: true})
      .then(function (data) {
        return Promise.resolve(data[0]);
      })
      .catch(function(e) {
        return Promise.reject(new Error("GetVersion Request Fail"));
      })
      .catch(function(err) {
        console.error(err);
      })
    ;
}

function getPlayerInfo(region, summonerName) {
  let a = getSummonerId(region, summonerName);
  let b = a.then(function(infos) {
    let req = "https://" + region + ".api.pvp.net/championmastery/location/" + PLATFORMS[region] + "/player/" + infos.id + "/champions?api_key=" + ApiKey;
    return rp({uri: req, json: true})
      .then( function(str) {
        for (let i = 0; i < str.length; ++i) {
          delete str[i].playerId;
          delete str[i].lastPlayTime;
          delete str[i].championPointsSinceLastLevel;
        }
        return Promise.resolve(str);
      })
      .catch( function(e) {
        return Promise.reject(new Error("ChampionMastery Request Failed"));
      })
      .catch(function(err) {
        console.error(err);
      })
    ;
  });
  return Promise.all([a, b]);
}

function getSummonerId(region, summonerName) {
    let req = "https://" + region + ".api.pvp.net/api/lol/" + region + "/v1.4/summoner/by-name/" + summonerName + "?api_key=" + ApiKey;
    let sN = summonerName.replace(/\s+/g, '');
    sN = sN.toLowerCase();

    return rp({uri: req, json: true})
      .then(function (str) {
        let id = {
          id: str[sN].id,
          name: str[sN].name,
          region: region,
          icon: "http://ddragon.leagueoflegends.com/cdn/6.9.1/img/profileicon/" + str[sN].profileIconId + ".png",
          level: str[sN].summonerLevel
        };
        return Promise.resolve(id);
      })
      .catch(function(e) {
        return Promise.reject(new Error("SummonerId Request Failed"));
      })
      .catch(function(err) {
        console.error(err);
      })
    ;
}

main();
