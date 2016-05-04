"use strict";

var port = 8083;
var express = require('express');
//var _ = require('lodash');
var app = express();
var serv = require('http').Server(app);

var request = require('request');
var async = require('async');

var io = require('socket.io')(serv);

var s = require("./obj-server.js");

app.use(express.static('public'));

serv.listen(port);


let pathToYourApiKey = "./config.json";
let APIKey = "";
let region = "";
let location = "";
let summonerName = "";
let version = "";
let championsMap = {};
let toSend = null;

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
    io.on('connection', function (socket) {
        console.log("client connected");
        socket.on("client info", function (data) {
            let tmp = data.split(",");
            summonerName = tmp[0];
            region = tmp[1].toLowerCase();
            async.waterfall([
                getGameInfo,
                function bignou (callback) {
                    socket.emit("info sent", toSend);
                    callback(null);
                }
            ], function (err, result) {
                console.log("\nMAIN WATERFALL IS DONE\n" + err + " + " + result);
            });
        });
    });
}



function getGameInfo(callback) {
    async.waterfall([
        async.apply(getApiKey, pathToYourApiKey),
        getVersion,
        getChampionsJson,
        getPlayerInfo
    ], function (err, result) {
        callback(null);
    });
}

function getPlayerInfo(callback) {
    async.waterfall([
        getSummonerId,
        getSummonerMasteries,
        mergeInfo
    ], function (err, result) {
        callback(null);
    });
}

function mergeInfo(champMasteries, callback) {
    //in here we merge champion masteries and championsmap
    for (let i = 0; i < champMasteries.length; ++i) {
        let champId = champMasteries[i].championId;
        let urlSquare = "http://ddragon.leagueoflegends.com/cdn/" + version + "/img/champion/" + championsMap[champId][1] + ".png";
        champMasteries[i].name = championsMap[champId][0];
        champMasteries[i].urlImage = urlSquare;
        champId = championsMap[champId];
    }
    toSend = champMasteries;
    callback(null);
}

function getVersion (ApiKey, callback) {
    let req = "https://global.api.pvp.net/api/lol/static-data/" + region + "/v1.2/versions?api_key=" + ApiKey;
    request(req, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            let str = JSON.parse(body);
            version = str[0];
            callback(null);
        }
        else {
            console.log("Problem with the request, error is: " + error + " with status code " + response.statusCode)
        }
    });
}

function getChampionsJson (callback) {
    let req = "http://ddragon.leagueoflegends.com/cdn/" + version + "/data/en_US/champion.json " ;
    request(req, function (error, response, body) {
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
            callback(null);
        }
        else {
            console.log("Problem with the request, error is: " + error + " with status code " + response.statusCode)
        }
    });
}

function getApiKey(file, callback) {
    APIKey = require(file);
    callback(null, APIKey);
}

function getSummonerId(callback) {
    let req = "https://na.api.pvp.net/api/lol/" + region + "/v1.4/summoner/by-name/" + summonerName + "?api_key=" + APIKey;
    let sN = summonerName.replace(/\s+/g, '');
    request(req, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            let str = JSON.parse(body);
            callback(null, str[sN]['id']);
        }
        else {
            console.log("Problem with the request, error is: " + error + " with status code " + response.statusCode)
        }
    });
}

function getSummonerMasteries(summId, callback) {
    let req = "https://na.api.pvp.net/championmastery/location/" + PLATFORMS[region] + "/player/" + summId + "/champions?api_key=" + APIKey;
    request(req, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            let str = JSON.parse(body);
            for (let i = 0; i < str.length; ++i) {
                delete str[i].playerId;
                delete str[i].lastPlayTime;
                delete str[i].championPointsSinceLastLevel;
            }
            callback(null, str);
        }
        else {
            console.log("Problem with the request, error is: " + error + " with status code " + response.statusCode)
        }
    });
}

main();