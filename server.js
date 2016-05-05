"use strict";

var port = 8083;
var express = require('express');
//var _ = require('lodash');
var app = express();
var serv = require('http').Server(app);

var request = require('request');
var async = require('async');

var io = require('socket.io')(serv);

app.use(express.static('public'));

serv.listen(port);


let pathToYourApiKey = "./config.json";


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
        let ApiKey = "";
        let region = "";
        //let location = "";
        let summonerName = "";
        let version = "";
        let championsMap = {};
        let toSend = null;

        console.log("client connected");

        socket.on("client info", function (data) {
            let tmp = data.split(",");
            summonerName = tmp[0];
            region = tmp[1].toLowerCase();
            async.waterfall([
                async.apply(getGameInfo, ApiKey, toSend, championsMap, region, summonerName, version),
            ], function (err, ApiKey, toSend, championsMap, region, summonerName, version) {
                if (!err) {
                    socket.emit("info sent", toSend);
                }
                console.log("\nMAIN WATERFALL IS DONE\n");
            });
        });
    });
}



function getGameInfo(ApiKey, toSend, championsMap, region, summonerName, version, callback) {
    async.waterfall([
        async.apply(getApiKey, pathToYourApiKey, ApiKey, toSend, championsMap, region, summonerName, version),
        getVersion,
        getChampionsJson,
        getPlayerInfo
    ], function (err, ApiKey, toSend, championsMap, region, summonerName, version) {
        //console.log("\nJUST BEFORE the end, ApiKey= " + ApiKey + "\ntoSend= " + toSend + "\nchampionsMap= " + championsMap + "\nregion= " + region + "\nsummonerName= " + summonerName + "\nversion= " + version + "\n");
        callback(null, ApiKey, toSend, championsMap, region, summonerName, version);
    });
}

function getApiKey(file, ApiKey, toSend, championsMap, region, summonerName, version, callback) {
    ApiKey = require(file);
    callback(null, ApiKey, toSend, championsMap, region, summonerName, version);
}

function getVersion (ApiKey, toSend, championsMap, region, summonerName, version, callback) {
    let req = "https://global.api.pvp.net/api/lol/static-data/" + region + "/v1.2/versions?api_key=" + ApiKey;
    request(req, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            let str = JSON.parse(body);
            version = str[0];
            callback(null, ApiKey, toSend, championsMap, region, summonerName, version);
        }
        else {
            console.log("Problem with the request, error is: " + error + " with status code " + response.statusCode)
        }
    });
}

function getChampionsJson (ApiKey, toSend, championsMap, region, summonerName, version, callback) {
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
            callback(null, ApiKey, toSend, championsMap, region, summonerName, version);
        }
        else {
            console.log("Problem with the request, error is: " + error + " with status code " + response.statusCode)
        }
    });
}

function getPlayerInfo(ApiKey, toSend, championsMap, region, summonerName, version, callback) {
    async.waterfall([
        async.apply(getSummonerId, ApiKey, toSend, championsMap, region, summonerName, version),
        getSummonerMasteries,
        mergeInfo
    ], function (err, ApiKey, toSend, championsMap, region, summonerName, version) {
        //console.log("JUST AFTER THE MERGE INFO AND RESULT IS: " + ApiKey + "\n" + toSend + "\n" + championsMap + "\n");
        callback(null, ApiKey, toSend, championsMap, region, summonerName, version);
    });
}

function getSummonerId(ApiKey, toSend, championsMap, region, summonerName, version, callback) {
    let req = "https://na.api.pvp.net/api/lol/" + region + "/v1.4/summoner/by-name/" + summonerName + "?api_key=" + ApiKey;
    let sN = summonerName.replace(/\s+/g, '');
    request(req, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            let str = JSON.parse(body);
            callback(null, str[sN]['id'], ApiKey, toSend, championsMap, region, summonerName, version);
        }
        else {
            console.log("Problem with the request, error is: " + error + " with status code " + response.statusCode)
        }
    });
}

function getSummonerMasteries(summId, ApiKey, toSend, championsMap, region, summonerName, version, callback) {
    let req = "https://na.api.pvp.net/championmastery/location/" + PLATFORMS[region] + "/player/" + summId + "/champions?api_key=" + ApiKey;
    request(req, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            let str = JSON.parse(body);
            for (let i = 0; i < str.length; ++i) {
                delete str[i].playerId;
                delete str[i].lastPlayTime;
                delete str[i].championPointsSinceLastLevel;
            }
            callback(null, str, ApiKey, toSend, championsMap, region, summonerName, version);
        }
        else {
            console.log("Problem with the request, error is: " + error + " with status code " + response.statusCode)
        }
    });
}

function mergeInfo(champMasteries, ApiKey, toSend, championsMap, region, summonerName, version, callback) {
    //in here we merge champion masteries and championsmap
    for (let i = 0; i < champMasteries.length; ++i) {
        let champId = champMasteries[i].championId;
        let urlSquare = "http://ddragon.leagueoflegends.com/cdn/" + version + "/img/champion/" + championsMap[champId][1] + ".png";
        champMasteries[i].name = championsMap[champId][0];
        champMasteries[i].urlImage = urlSquare;
        champId = championsMap[champId];
    }
    toSend = champMasteries;
    console.log("\nIN THE MERGE INFO, ApiKey= " + ApiKey + "\ntoSend= " + toSend + "\nchampionsMap= " + championsMap + "\nregion= " + region + "\nsummonerName= " + summonerName + "\nversion= " + version + "\n");
    callback(null, ApiKey, toSend, championsMap, region, summonerName, version);
}

main();