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

var CSV = exports;

/** log facility */
var log = require('debug')('HoneyBadger:Helper:CSV');

/** core deps */
var util = require('util');
var events = require('events');
var Readable = require('stream').Readable;
var Parser = require('csv-streamify');

CSV.parse = function(delimiter, quotes, data, headersCallback){

	var $this = this;
	var headers = false;

	var parser = new Parser({
		delimiter: delimiter,
		quote: quotes,
		newline: '\n',
		objectMode: true,
		columns: true, // csv-streamify REMOVES the header row from the stream
	});

	/** We don't need to do anything here */
	parser.on('readable',function(record){
	});

	/** Watch for headers */
	parser.on('data',function(record){
		if (parser.lineNo === 0 && headers === false) {
			log('Parser discovered headers');
			headers = true;
			record.map(function(i){
				return i.toString().trim();
			});
			parser.emit('headers', record);
			if (headersCallback) headersCallback(null,{headers:record});
		}
	});

	parser.on('finish',function(){
		log('Parser finished with %s records', parser.lineNo);
	});

	parser.on('end',function(){
		log('Parser end');
	});

	parser.on('close',function(){
		log('Parser stream closed');
	});

	parser.on('error',function(err){
		log('Parser error', err);
	});

	/**
	* Let's see if data has a pipe() method.
	*
	* I'm using this as a dirty method to see if data
	* is a stream. We like streams :) we'll return it so
	* it's chainable.
	*/
	if ((data instanceof Readable)) {
		return data.pipe(parser);
	} else if (typeof data.data !== 'undefined') {
		parser.write(data.data);
		parser.end();
		return parser;
	}
};

