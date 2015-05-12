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

module.exports = Extractor;

/** log facility */
var log = require('debug')('HoneyBadger:Extractor');

/** core deps */
var util = require('util');
var events = require('events');

util.inherits(Extractor, events.EventEmitter );
function Extractor(){

	log('Extractor constructor');
    events.EventEmitter.call(this);

    /**
     * All Extractors must implement the following methods
     * Consider this an interface of sorts.
     *
     * this.connect();
     * this.start();
     * this.pause();
     * this.end();
     * this.pipe();
     * this.destroy();
     */

    this.extract = function(){
    	this.start();
    };

    this.init = function(){
    	this.connect();
    };
}

var ftp = require('./extract/ftp');
var rets = require('./extract/rets');

/**
 * Return an extractor
 * @param  {object} source    source configuration object
 * @param  {object} extractor extractor configuration object
 * @return {extractor}        instance of an extractor
 */
Extractor.Factory = function(options){
	if (!options || !options.source.type) throw('No extractor source type specified');

	// The type of extractor we use is based on the source we are trying to extract from
	switch(options.source.type){
		case 'file':
		break;
		case 'FTP':
			return new ftp(options);
		break;
		case 'http':
		break;
		case 'soap':
		break;
		case 'RETS':
			return new rets(options);
		break;
		case 'stream':
		break;
		default:
			throw('No supported extractor found', options.source.type);
	}
};
