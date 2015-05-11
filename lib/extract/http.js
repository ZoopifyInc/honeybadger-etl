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

module.exports = HTTP;

/** log facility */
var log = require('debug')('HoneyBadger:Extractor:HTTP');

/** core deps */
var util = require('util');
var url = require('url');
var events = require('events');
var http = require('http');
var https = require('https');
var stream = require('stream');
var Extractor = module.parent.exports;

util.inherits( HTTP, events.EventEmitter );
util.inherits( HTTP, stream.Transform );
function HTTP( options ) {

	var $this = this;
    var client = null;
    var request = null;
	var requestURL = null;
    var readyState = 0;
    var fStream = null;

    events.EventEmitter.call(this);
    stream.Transform.call(this,{objectMode:true});

    this.connect = function(){
    	readyState = 1; // Connecting
        requestURL = url.parse(options.source.url);
		client = (options.source.url.indexOf('https') > -1) ? https : http;
        readyState = 2; // Success
        // log('Ready to extract.');
        $this.emit('ready', null, 'success');
    };

    this.start = function(){
        if (readyState < 2) throw('Extractor is not ready to start');
        // log('Starting extraction on URL: %s', options.source.url);
        request = client.request(requestURL, function(response){
            // log('%s Response STATUS: %s', options.source.url, response.statusCode);
            response.pipe($this);
        });
        request.end();
    };

    this._transform = function(chunk, encoding, callback){
        callback(null, chunk);
    };

    this._flush = function(callback){
        // log('Completed reading HTTP resource');
        callback();
    };

    process.nextTick(function(){
        $this.connect();
    });
}