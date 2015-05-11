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

module.exports = Geocode;

/** log facility */
var log = require('debug')('HoneyBadger:Transformer:Geocode');

/** core deps */
var util = require('util');
var stream = require('stream');
var request = require('request');
var EventEmitter = require('events').EventEmitter;
// var Transformer = module.parent.exports;

util.inherits( Geocode, EventEmitter );
util.inherits( Geocode, stream.Transform );
function Geocode( options ) {

	var $this = this;
	EventEmitter.call(this);
	stream.Transform.call(this, {objectMode: true});

	log('Initialize geocoder');

	var beans = 0;

	var indexes = {
		Latitude:-1,
		Longitude:-1,
		StreetNumber:-1,
		StreetDirPrefix:-1,
		StreetName:-1,
		StreetSuffix:-1,
		StreetDirSuffix:-1,
		City:-1,
		PostalCode:-1,
	}

	/** We are TOTALLY ASSUMING that chunks are records
	 *  coming from a CSV stream processor. That's probably not
	 *  the safest assumption longterm ;)
	 */
	this._transform = function(chunk, encoding, callback) {

		// log(chunk);

		if (beans === 0) { // CSV header row
			indexes.Latitude = chunk.indexOf('Latitude');
			indexes.Longitude = chunk.indexOf('Longtitude');
			indexes.StreetNumber = chunk.indexOf('StreetNumber');
			indexes.StreetDirPrefix = chunk.indexOf('StreetDirPrefix');
			indexes.StreetName = chunk.indexOf('StreetName');
			indexes.StreetSuffix = chunk.indexOf('StreetSuffix');
			indexes.StreetDirSuffix = chunk.indexOf('StreetDirSuffix');
			indexes.City = chunk.indexOf('City');
			indexes.PostalCode = chunk.indexOf('PostalCode');

			if (indexes.Latitude < 0) { chunk.push('Latitude'); }
			if (indexes.Longitude < 0) { chunk.push('Longitude'); }

			beans++;
			// log(chunk);
			if (this._readableState.pipesCount > 0) this.push(chunk);
			return callback();
		} else {
			beans++;
			if (indexes.Latitude < 0 || indexes.Longitude < 0) {
				// log('chunk is missing lat and lng we need to do a lookup');

				var address = [];
				address.push(chunk[indexes.StreetNumber]);
				if (chunk[indexes.StreetDirPrefix]) address.push(chunk[indexes.StreetDirPrefix]);
				address.push(chunk[indexes.StreetName]);
				if (chunk[indexes.StreetSuffix]) address.push(chunk[indexes.StreetSuffix]);
				if (chunk[indexes.StreetDirPrefix]) address.push(chunk[indexes.StreetDirSuffix]);

				address = address.join(' ') + ', ' + chunk[indexes.City] + ' ' + chunk[indexes.PostalCode];

				// log(address);
				var url = 'https://nominatim.openstreetmap.org/search?q='+address+'&format=json&polygon=1&addressdetails=1';

				// log(url);
				request(url, function(error, response, body){
					var res = JSON.parse(body);
					if (res && res[0]) {
						// var lat = parseFloat(res[0].lat);
						// var lon = parseFloat(res[0].lon);
						var lat = res[0].lat;
						var lon = res[0].lon;
						chunk.push(lat);
						chunk.push(lon);
						log('Geocoder discovered lat: %s, lon: %s for %s',lat, lon, address);
					} else {
						chunk.push(0.00);
						chunk.push(0.00);
					}

					// log(chunk);
					if ($this._readableState.pipesCount > 0) $this.push(chunk);
					return callback();
				});

			} else {
				log('chunk already had lat and lng - dont do anything');
				if (this._readableState.pipesCount > 0) this.push(chunk);
				return callback();
			}
		}

		// log(chunk);
		// log('Processed record %s', beans);

	};

	// this._flush = function(callback){
	// 	log('Completed %s records',beans);
	// 	callback();
	// };
}
