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
                // this async.waterfall is our whole function for the code. It calls other waterfalls and all the function in this file


                /**
                 * THIS IS TO BE SPLITTED IN TWO: getGameInfo and getUserInfo. Those funcs now have to run asynchronously using promises, in a synchronous function (mergeInfo).
                 *
                 */

                  // La moitié des infos sont la
                  var test = getGameInfo(region);
                  test.then(function(championsMap) {
                    console.log("map is in the merge");
                  });

                  //l'autre moitié ici pls
                  var playerInfo = getPlayerInfo(region, summonerName);
                  playerInfo.then(function(more) {
                    console.log(more);
                  });


                //async.waterfall([
                //  async.apply(getGameInfo, ApiKey, toSend, championsMap, region, summonerName, version),
                //], function (err, ApiKey, toSend, championsMap, region, summonerName, version) {
                //    if (!err) {
                //        socket.emit("info sent", toSend);
                //        called = false;
                //    }
                //});





            }
        });
    });
}

function getGameInfo(region) {
  //async.waterfall([
  //    async.apply(getApiKey, pathToYourApiKey, ApiKey, toSend, championsMap, region, summonerName, version),
  //    getVersion,
  //    getChampionsJson,
  //    getPlayerInfo
  //], function (err, ApiKey, toSend, championsMap, region, summonerName, version) {
  //    callback(null, ApiKey, toSend, championsMap, region, summonerName, version);
  //});

  function logError(e) {
    console.error("error is:" + e);
    throw (e);
  }
  var a = getVersion(region);
  var b = a.then(function (version) {
    console.log("in the getchampionjson " + version);
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

          console.log("got the map");
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
  //return Promise.resolve(all);
  return Promise.all([b]);

}

function getVersion (region) {
  console.log("in the getVersion: " + ApiKey);
    let req = "https://global.api.pvp.net/api/lol/static-data/" + region + "/v1.2/versions?api_key=" + ApiKey;
    return rp({uri: req, json: true})
      .then(function (data) {
        let version = "";
        //let str = JSON.parse(body);
        version = data[0];
        console.log("Current version is: " + version);
        return Promise.resolve(version);
      })
      .catch(function(e) {
        console.log("get version request failed");
        return Promise.resolve("Request Fail");
      })
    ;
  //{
  //      if (!error && response.statusCode == 200) {
  //        let version = "";
  //          let str = JSON.parse(body);
  //          version = str[0];
  //          console.log("Current version is: " + version);
  //        return Promise.resolve(version);
  //      }
  //      else {
  //          if (error && response) {
  //              console.log("Problem with the request, error is: " + error + " with status code " + response.statusCode);
  //          }
  //        return Promise.resolve("Fail");
  //      }
  //  });
}

//function getChampionsJson (version) {
//  console.log("in the getchampionjson " + version);
//    let req = "http://ddragon.leagueoflegends.com/cdn/" + version + "/data/en_US/champion.json " ;
//    request(req, function (error, response, body) {
//        if (!error && response.statusCode == 200) {
//          let championsMap = {};
//            let str = JSON.parse(body);
//            delete str.type;
//            delete str.format;
//            delete str.version;
//            str = str.data;
//            for (let champ in str) {
//                let champTmp = [];
//                champTmp.push(str[champ].id);
//                champTmp.push(str[champ].name);
//                championsMap[str[champ].key] = champTmp;
//            }
//
//          //console.log(championsMap);
//          return Promise.resolve(championsMap);
//
//          //callback(null, ApiKey, toSend, championsMap, region, summonerName, version);
//        }
//        else {
//          console.log("ERROR");
//            if (error && response) {
//                console.log("Problem with the request, error is: " + error + " with status code " + response.statusCode);
//            }
//          return Promise.resolve("Fail");
//        }
//    });
//}

function getPlayerInfo(region, summonerName) {
    //async.waterfall([
    //    async.apply(getSummonerId, ApiKey, toSend, championsMap, region, summonerName, version),
    //    getSummonerMasteries,
    //    mergeInfo
    //], function (err, ApiKey, toSend, championsMap, region, summonerName, version) {
    //    callback(null, ApiKey, toSend, championsMap, region, summonerName, version);
    //});


  let a = getSummonerId(region, summonerName);
  let b = a.then(function(infos) {
    console.log(infos);
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
            //console.log(str);
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
    console.log("alors la: " + value);
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
          //callback(null, id, ApiKey, toSend, championsMap, region, summonerName, version);
        }
        else {
          if (error && response) {
            console.log("Problem with the request, error is: " + error + " with status code " + response.statusCode);
          }
        }
      });
    });
}

//function getSummonerMasteries(infos, ApiKey, toSend, championsMap, region, summonerName, version, callback) {
//    let req = "https://" + region + ".api.pvp.net/championmastery/location/" + PLATFORMS[region] + "/player/" + infos.id + "/champions?api_key=" + ApiKey;
//    request(req, function (error, response, body) {
//        if (!error && response.statusCode == 200) {
//            let str = JSON.parse(body);
//            for (let i = 0; i < str.length; ++i) {
//                delete str[i].playerId;
//                delete str[i].lastPlayTime;
//                delete str[i].championPointsSinceLastLevel;
//            }
//            callback(null,infos, str, ApiKey, toSend, championsMap, region, summonerName, version);
//        }
//        else {
//            if (error && response){
//                console.log("Problem with the request, error is: " + error + " with status code " + response.statusCode);
//            }
//        }
//    });
//}

function mergeInfo(infos, champMasteries, ApiKey, toSend, championsMap, region, summonerName, version, callback) {
    //in here we merge champion masteries and championsmap
    toSend.infos = infos;
    for (let i = 0; i < champMasteries.length; ++i) {
        let champId = champMasteries[i].championId;
        let urlSquare = "http://ddragon.leagueoflegends.com/cdn/" + version + "/img/champion/" + championsMap[champId][0] + ".png";
        champMasteries[i].name = championsMap[champId][1];
        champMasteries[i].riotName = championsMap[champId][0];
        champMasteries[i].urlImage = urlSquare;

        champId = championsMap[champId];
    }
    toSend.champMasteries = champMasteries;
    callback(null, ApiKey, toSend, championsMap, region, summonerName, version);
}

main();
