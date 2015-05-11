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

module.exports = Filesystem;

/** log facility */
var log = require('debug')('HoneyBadger:Loader:Filesystem');

/** core deps */
var fs = require('fs');
var FileQueue = require('filequeue');
var path = require('path');
var util = require('util');
var utility = require('../utility');
var stream = require('stream');
var EventEmitter = require('events').EventEmitter;

util.inherits( Filesystem, EventEmitter );
util.inherits( Filesystem, stream.Transform );
function Filesystem( options ) {

	var $this = this;
	EventEmitter.call(this);
	stream.Transform.call(this, {objectMode: true});

	log('Streaming to %s',options.target.path);

	var beans = 0;
	var bin = options.binary || false;
	var headers = [];
	var target = path.resolve(utility.tokenz(options.target.path));
	var fq = new FileQueue(100);

	utility.makePath(target);

	// TODO: don't be a fool make the path first if you can
    // fs.exists(basepath, function(exists){

	var fStream = fq.createWriteStream(target, { flags: 'w', encoding: 'utf8', mode: 0666 });
	this.pipe(fStream);

	this.on('end',function(){
		fStream.end();
	});

	/** We are TOTALLY ASSUMING that chunks are records 
	 *  coming from a CSV stream processor. That's probably not
	 *  the safest assumption longterm ;)
	 */
	this._transform = function(chunk, encoding, callback) {
		
		if (!bin) beans++;
		// log('Processed record', beans);

		(!bin) ? this.push(chunk.join(',')+'\r\n') : this.push(chunk);
		callback(null);
	};

	this._flush = function(callback){
		if (!bin) log('Flushed '+beans+' lines to %s',target);
		callback();
	};

	process.nextTick(function(){
		$this.emit('ready');
	});
}