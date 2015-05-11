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

module.exports = FTP;

/** log facility */
var log = require('debug')('HoneyBadger:Extractor:FTP');

/** core deps */
var util = require('util');
var url = require('url');
var events = require('events');
var libftp = require('ftp');
var stream = require('stream');
var Extractor = module.parent.exports;

util.inherits( FTP, events.EventEmitter );
util.inherits( FTP, stream.Transform );
function FTP( options ) {

	var $this = this;
	var client = null;
    var readyState = 0;
    var fStream = null;

    events.EventEmitter.call(this);
    stream.Transform.call(this,{objectMode:true});

    this.connect = function(){
    	readyState = 1; // Connecting
		client = new libftp();

		client.on('error', function(error) {
			readyState = -1; // Error
			log('Connection failed: %s', error);
            console.trace('Connection failed:', error);
			$this.emit('error',error);
		});

        client.on('ready', function() {
            readyState = 2; // Success
            log('Connected to FTP as %s.', options.source.auth.username);
            $this.emit('ready', null, 'success');
        });

		client.on('close', function() {
			readyState = 2; // Success
			log('Client closed connection to source');
		});

		client.connect({
			host: options.source.uri,
			port: options.source.port,
			user: options.source.auth.username,
			password: options.source.auth.password
		});

    };

    this.start = function(){
        if (readyState < 2) throw('Extractor is not ready to start');
        log('Starting extraction');

        client.get(options.target.res, function(error, ftp_stream){
            if (error) {
                log('Error extracting target');
                console.trace(error);
                $this.emit('error',error);
                return;
            }

            log('Setting up resource stream');

            fStream = ftp_stream;
            fStream.once('close', function(){
                log('Resource stream closed');
                // client.end();
            });

            fStream.once('finish', function(){
                log('Resource stream finished');
                client.end();
                $this.end();
            });

            fStream.once('end', function(){
                log('Resource stream ended');
                // client.end();
            });

            if (options.target.format === 'delimited-text') {
                log('Target is delimited-text; engaging CSV helper');

                var _delim = { csv: ',', tsv: "\t", pipe: '|' }[ options.target.options.delimiter || 'csv' ];
                var _quot = { default: '', dquote: '"', squote: "'" }[ options.target.options.escape || 'default' ];

                var csv = require('../helpers/csv');

                log('Using delimiter %s', _delim);
                log('Using escapeChar `%s`', _quot);

                // Overwrite stream
                var csvStream = csv.parse(_delim, _quot, fStream);
                csvStream.on('headers',function(error, res){
                    log('Received headers from CSV helper');
                });

                csvStream.on('end',function(){
                    log('CSV stream ended');
                });

                csvStream.on('finish',function(){
                    log('CSV stream finished');
                });

                csvStream.pipe($this);
            }

            // $this.emit('data', dStream);
        });
    };

    var keeppushing = true;
    this._transform = function(chunk, encoding, callback){
        this.emit('data',chunk);
        callback();
    };

    this._flush = function(callback){
        log('Completed reading FTP resource');
        callback();
    };

    // this.destroy = function(){
    //     if (client !== null) {
    //        log('Destroying FTP extractor');
    //         try {
    //             client.end();
    //             client = null;
    //         } catch(e) {
    //             console.trace(e);
    //         }
    //     } else log('Client already destroyed');
    // };

    this.connect();
}
