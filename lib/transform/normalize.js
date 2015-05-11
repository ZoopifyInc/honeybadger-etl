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

module.exports = Normalize;

/** log facility */
var log = require('debug')('HoneyBadger:Transformer:Normalize');

/** core deps */
var util = require('util');
var stream = require('stream');
var EventEmitter = require('events').EventEmitter;
// var Transformer = module.parent.exports;

util.inherits( Normalize, EventEmitter );
util.inherits( Normalize, stream.Transform );
function Normalize( options ) {

	var $this = this;
	EventEmitter.call(this);
	stream.Transform.call(this, {objectMode: true});

	log('Initialize normalizer %s', options.name);

	var beans = 0;
	var headers_to_map = [];
	var headers_raw = [];
	var indexes = [];

	options.transform.normalize.forEach(function(item, index){
		headers_to_map[item.in] = item.out;
	});

	/** We are TOTALLY ASSUMING that chunks are records
	 *  coming from a CSV stream processor. That's probably not
	 *  the safest assumption longterm ;)
	 */
	this._transform = function(chunk, encoding, callback) {
		var pick = [];
		var toss = [];

		if (beans === 0) { // CSV header row
			// log('Transforming CSV headers');
			chunk.forEach(function(item,index){
				if (typeof headers_to_map[item] !== undefined) {
					indexes.push(index);
					pick.push(item);
				} else toss.push(item);
			});

			// chunk = pick;
			// log('Transformed headers', chunk.length,chunk.equals(options.transform.input),toss.length);
		} else {
			chunk.forEach(function(item,index){
				if (indexes.indexOf(index) > -1) pick.push(item);
				else toss.push(item);
			});

			// chunk = pick;
		}

		beans++;
		// log('%s - Processed record', options.name, beans);

		if (this._readableState.pipesCount > 0) this.push(chunk);
		return callback();
	};

	this._flush = function(callback){
		log('Completed '+beans+' records');
		callback();
	};
}

// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
};
