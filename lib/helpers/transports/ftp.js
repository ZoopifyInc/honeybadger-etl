// Copyright Impact Marketing Specialists, Inc. and other contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var FTP = exports;

/** log facility */
var log = require('debug')('HoneyBadger:Helper:FTP');

/** core deps */
var util = require('util');
var url = require('url');
var events = require('events');
var libftp = require('ftp');
var stream = require('stream');

FTP.validate = function(options, callback){
	var c = new libftp();

	log('Validating connection to source');
	c.on('ready', function() {
		log('Connection success');
		c.end();
		process.nextTick(function(){
			callback(null,{success:true});
		});
	});

	c.on('error', function(err) {
		log('Connection error');
		console.trace(err);
		process.nextTick(function(){
			callback(err, null);
		});
	});

	c.connect({
		host: options.uri,
		port: options.port,
		user: options.auth.username,
		password: options.auth.password
	});
};

FTP.browse = function(source, callback){
	var c = new libftp();

	var basepath = source.basepath || '/';

	log('Browsing source');

	c.on('ready', function() {
		c.list(basepath, function(err, list) {
			log('Returning file list');
			c.end();
			process.nextTick(function(){
				callback(err, list);
			});
		});
	});

	c.on('error', function(err) {
		log('Error browsing source');
		console.trace(err);
		process.nextTick(function(){
			callback(err, null);
		});
	});

	c.connect({
		host: source.uri,
		port: source.port,
		user: source.auth.username,
		password: source.auth.password
	});
};

FTP.get = function(source, target, callback){
	var c = new libftp();
	var get_stream = null;

	log('Fetching source target');
	c.on('ready', function() {
		c.get(target, function(err, stream){
			if (!err) {
				get_stream = stream;
				get_stream.once('close', function(){
					log('Data stream closed');
				});
				get_stream.once('finish', function(){
					log('Data stream finished');
				});
				get_stream.once('end', function(){
					log('Data stream ended');
				});
			// process.nextTick(function(){
				if (callback) callback(err, stream);
				// c.end();
			// });
			}
		});
	});

	c.on('close', function(){
		log('Closing connection');
	});

	c.on('end', function(){
		log('Get data stream end');
		get_stream.end();
	});

	c.on('error', function(err) {
		log('Error fetching source target');
		console.trace(err);
		process.nextTick(function(){
			callback(err, null);
		});
	});

	c.connect({
		host: source.uri,
		port: source.port,
		user: source.auth.username,
		password: source.auth.password
	});
};

FTP.put = function(stream, source, target, callback){
	var c = new libftp();

	log('Putting file to target');
	stream.on('finish', function(){
		log('Incoming data stream finished');
	});

	c.on('ready', function() {
		log('Streaming data to output target');
		c.put(stream, target, function(err){
			c.end();
		});
	});

	c.on('close', function(){
		log('Completed writing to remote target; connection closed');
		c.destroy();
		callback(null, true);
	});

	c.on('error', function(err) {
		log('Error writing to remote target');
		console.trace(err);
		process.nextTick(function(){
			callback(err, null);
		});
	});

	c.connect({
		host: source.uri,
		port: source.port,
		user: source.auth.username,
		password: source.auth.password
	});
};
