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
var mysql = require('mysql');

util.inherits( MySQL, EventEmitter );
util.inherits( MySQL, stream.Transform );
function MySQL( options ) {

	var $this = this;
	EventEmitter.call(this);
	stream.Transform.call(this, {objectMode: true});

	var drained = false;
	var beans = 0;
	var inserts = 0;
	var errors = 0;
	var headers = [];
	var table = options.target.schema.name;

	var dsn = utility.dsn(options.target.dsn);
	var pool = mysql.createPool({
		user: dsn.user,
		password: dsn.password,
		host: dsn.host,
		database: dsn.database
	});

	log('Initializing loader');
	pool.getConnection(function(err,connection){
		if (connection) connection.release();
		if (err) {
			log('Connection error');
			console.trace(err);
			return;
		}
		log('Connection ready');
		$this.emit('ready');
	});


	/** We are TOTALLY ASSUMING that chunks are records
	 *  coming from a CSV stream processor. That's probably not
	 *  the safest assumption longterm ;)
	 */
	this._transform = function(chunk, encoding, callback) {
		if (beans === 0) { // CSV header row
			headers = chunk;
		} else if (chunk.length > 0){
			var record = {};
			var newChunk = [];
			var newHeaders = [];
			options.transform.normalize.forEach(function(item, index){
				var i = headers.indexOf(item.in);
				newHeaders.push(item.out);
				newChunk.push(chunk[i]);
				record[item.out] = chunk[i];
			});

			// log(headers,newHeaders,newChunk,record);

			pool.getConnection(function(err, connection){
				var query = connection.query('INSERT INTO `' + table + '` (??) VALUES (?) ON DUPLICATE KEY UPDATE ?', [newHeaders,newChunk,record], function(err, rows){
					inserts++;
					if ((inserts % 10000) == 1) log('Query completed query for record:', inserts);

					// if (err) log(err);
					if (err) errors++;

					// Release connection
					connection.release();

					// log(drained, inserts, beans, errors);

					// Close the pool if we're done; and it's beans-1 cause of the header
					if (drained && (inserts == (beans-1))) {
						pool.end();
						log('Completed %s inserts with %s errors', inserts, errors);
						if (err) {
							log(query.sql);
							log(err);
						}
					}
				});
			});
		} else { log('empty chunk?',chunk.toString());}

		beans++;
		if ((beans % 10000) == 1) log('Processed record', beans);

		if (this._readableState.pipesCount > 0) this.push(chunk);
		return callback();
	};

	this._flush = function(callback){
		drained = true;
		log('Completed processing %s records, 1 header',beans);
		callback();
	};

}
