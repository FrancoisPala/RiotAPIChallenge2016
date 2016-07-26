/**
 * Created by Jam on 26-Jul-16.
 */

"use strict";

var request = require('request');
var rp = require('request-promise');
var express = require('express');
var app = express();
var serv = require('http').Server(app);
var io = require('socket.io')(serv);

class infoProcessing  {
  constructor(ApiKey, data, socket){
    this.ApiKey = ApiKey;
    let tmp = data.split(",");
    this.summonerName = tmp[0];
    this.region = tmp[1].toLowerCase();
    this.PLATFORMS = {
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
    this.version = "";
    this.socket = socket;
    this.id = {};
  }

  sendInfo() {
    return Promise.all([
        this.getGameInfo(),
        this.getPlayerInfo()
      ])
      .then(values => {
        this.socket.emit("info sent", this.mergeInfo(values[0], values[1]));
        return false;
      });
  }

  getGameInfo() {
    let promiseGetVersion = this.getVersion();
    return promiseGetVersion.then(function () {
      let req = "http://ddragon.leagueoflegends.com/cdn/" + this.version + "/data/en_US/champion.json " ;
      return rp({uri: req, json: true})
        .then(function(data) {
          let championsMap = {};
          let str = data.data;
          for (let champ in str) {
            championsMap[str[champ].key] = [str[champ].id, str[champ].name] ;
          }
          return championsMap;
        })
        .catch (function (e) {
          console.error("ChampionJSON Request Fail");
          return Promise.reject(new Error("ChampionJSON Request Fail"));
        })
        ;
    });
  }

  getVersion () {
    let req = "https://global.api.pvp.net/api/lol/static-data/" + this.region + "/v1.2/versions?api_key=" + this.ApiKey;
    return rp({uri: req, json: true}).promise().bind(this)
      .then(function (data) {
        this.version = data[0];
      })
      .catch(function(e) {
        console.error("GetVersion Request Fail " + e);
        return Promise.reject(new Error("GetVersion Request Fail"));
      })
      ;
  }

  getPlayerInfo() {
    let promiseGetSummId = this.getSummonerId();
    return promiseGetSummId.then(function(infos) {
      let req = "https://" + this.region + ".api.pvp.net/championmastery/location/" + this.PLATFORMS[this.region] + "/player/" + this.id.id + "/champions?api_key=" + this.ApiKey;
      return rp({uri: req, json: true})
        .then( function(str) {
          for (let i = 0; i < str.length; ++i) {
            delete str[i].playerId;
            delete str[i].lastPlayTime;
            delete str[i].championPointsSinceLastLevel;
          }
          return str;
        })
        .catch( function(e) {
          console.error("ChampionMastery Request Failed");
          return Promise.reject(new Error("ChampionMastery Request Failed"));
        })
        ;
    });
  }

  getSummonerId() {
    let req = "https://" + this.region + ".api.pvp.net/api/lol/" + this.region + "/v1.4/summoner/by-name/" + this.summonerName + "?api_key=" + this.ApiKey;
    let sN = this.summonerName.replace(/\s+/g, '');
    sN = sN.toLowerCase();
    return rp({uri: req, json: true}).promise().bind(this)
      .then(function (str) {
        this.id = {
          id: str[sN].id,
          name: str[sN].name,
          region: this.region,
          icon: "http://ddragon.leagueoflegends.com/cdn/6.9.1/img/profileicon/" + str[sN].profileIconId + ".png",
          level: str[sN].summonerLevel
        };
      })
      .catch(function(e) {
        console.error("SummonerId Request Failed " + e);
        return Promise.reject(new Error("SummonerId Request Failed"));
      })
      ;
  }

  mergeInfo(versionChampions, playerInfo){
    let toSend = {};
    let championsMap = versionChampions;
    let champMasteries = playerInfo;
    toSend.infos = this.id;
    for (let i = 0; i < champMasteries.length; ++i) {
      let champId = champMasteries[i].championId;
      let urlSquare = "http://ddragon.leagueoflegends.com/cdn/" + this.version + "/img/champion/" + championsMap[champId][0] + ".png";
      champMasteries[i].name = championsMap[champId][1];
      champMasteries[i].riotName = championsMap[champId][0];
      champMasteries[i].urlImage = urlSquare;
      champId = championsMap[champId];
    }
    toSend.champMasteries = champMasteries;
    return toSend;
  }
};

module.exports = infoProcessing;
