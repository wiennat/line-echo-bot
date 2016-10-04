'use strict';
var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var CryptoJS = require("crypto-js");
var config = require('./config');

var http = express();
var port = config.port;

http.use(bodyParser.json());

function verifyRequest(req, res, next) {
	var channelSignature = req.get('X-Line-Signature');
	var sha256 = CryptoJS.HmacSHA256(JSON.stringify(req.body), config.channelSecret);
	var base64encoded = CryptoJS.enc.Base64.stringify(sha256);
	if (base64encoded === channelSignature) {
		next();
	} else {
		res.status(470).end();
	}
}

http.post('/', verifyRequest, function(req, res) {
	var result = req.body.events;
    console.log(req.body);
	if (!result || !result.length ) {
		res.status(470).end();
		return;
	}
	res.status(200).end();

	// One request may have serveral contents in an array.
	var content = result[0];
	// source
	var source = content.source;
	// Content type would be possibly text/image/video/audio/gps/sticker/contact.
	var type = content.type;
	// assume it's text type here.
	var timestamp = content.timestamp;

  var replyToken = content.replyToken;

  var message = content.message;

	sendMsg(replyToken, [{ type: 'text', text: message}],
    function(err) {
  		if (err) {
  			// sending message failed
  			return;
  		}
		    // message sent
	});
});

function sendMsg(replyToken, content, callback) {
	var data = {
		replyToken: replyToken,
		messages: content
	};

	request({
		method: 'POST',
		url: config.channelUrl + '/message/reply',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + config.channelToken
		},
		json: data
	}, function(err, res, body) {
		if (err) {
			callback(err);
		} else {
			callback();
		}
	});
}

http.listen(port);
