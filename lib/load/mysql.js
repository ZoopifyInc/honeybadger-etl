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

module.exports = MySQL;

/** log facility */
var log = require('debug')('HoneyBadger:Loader:MySQL');

/** core deps */
var util = require('util');
var utility = require('../utility');
var stream = require('stream');
var EventEmitter = require('events').EventEmitter;
var myfifo = require('node-myfifo');

util.inherits( MySQL, EventEmitter );
util.inherits( MySQL, stream.Transform );
function MySQL( options ) {

	var $this = this;
	EventEmitter.call(this);
	stream.Transform.call(this, {objectMode: true});

	var beans = 0;
	var inserts = 0;
	var headers = [];

	var dsn = utility.dsn(options.target.dsn);
	var connection = new myfifo({
		username: dsn.user,
		password: dsn.password,
		host: dsn.host,
		basepath: '/tmp/',
		database: dsn.database,
		table: options.target.schema.name
	});

	connection.on('ready', function(err){
		if (err) {
			log('Connection error');
			console.trace(err);
			return;
		}
		log('Connection ready');
		$this.emit('ready');
	});

	connection.on('error', function(err){
		console.trace(err);
	});

	log('Initializing loader');

	/** We are TOTALLY ASSUMING that chunks are records
	 *  coming from a CSV stream processor. That's probably not
	 *  the safest assumption longterm ;)
	 */
	this._transform = function(chunk, encoding, callback) {
		if (beans === 0) { // CSV header row
			headers = chunk;
		} else if (chunk.length > 0){
			var record = [];
			options.transform.normalize.forEach(function(item, index){
				var i = headers.indexOf(item.in);
				record.push(chunk[i]);
			});
			connection.write('\t'+record.join('\t')+"\n");
		} else { log('empty chunk?',chunk.toString());}

		beans++;
		if ((beans % 10000) == 1) log('Processed record', beans);

		if (this._readableState.pipesCount > 0) this.push(chunk);
		return callback();
	};

	this._flush = function(callback){
		log('Completed processing %s records, 1 header',beans);
		connection.end();
		callback();
	};

	this.on('finish',function(){
		log('finish fired');
	});

	this.on('end',function(){
		log('end fired');
	});

}
