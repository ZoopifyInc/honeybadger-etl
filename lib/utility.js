Object.defineProperties(module.exports, {
	dsn: {
		value: function parseDSN(dsn) {
			var args;
			var components = require('url').parse(dsn);

			var mysql = function(){
				var hostname = components.hostname,
					port = components.port,
					auth = components.auth.split(':'),
					user = auth.shift(),
					password = auth.shift(),
					database = components.pathname ? components.pathname.substr(1).replace(/\/.*$/, '').replace(/\?.*$/, '') : null,
					socket = null,
					flags = null;

				return { host: hostname, user: user, password: password, database: database, port: port, socket: socket, flags: flags };
			};

			var ftp = function(){
				var hostname = components.hostname,
					port = components.port || 21,
					auth = components.auth.split(':'),
					user = auth.shift(),
					password = auth.shift();
					path = components.path;

				return { host: hostname, user: user, password: password, port: port, path: path };
			};

			if (components.hostname) {
				switch(components.protocol)
				{
					case 'mysql:':
						args = mysql();
					break;
					case 'ftp:':
						args = ftp();
					break;
					default:
						throw new Error('Not implemented');
				}
			}
			else args = [arguments[0]];
			return args;
		},
		enumerable: true,
		configurable: true,
		writeable: true
	},
	tokenz: {
		value: function tokenz(query, data) {

		    var tkexp = /{(.*?)}/gi;
		    var fnexp = /\((.*?)\)/;
		    var tokens = query.match(tkexp);

		    var getDate = function(date){
		        switch(date)
		        {
		            case "today":
		                var d = new Date();
		            break;
		            case "yesterday":
		                var d = new Date();
		                d.setDate(d.getDate()-1);
		            break;
		            default:
		                var d = new Date(date);
		        }

                var m = d.getMonth()+1;
                var dd = d.getDate();
                return d.getFullYear() + '-' + ( (m < 10) ? '0'+m : m ) + '-' + ( (dd < 10) ? '0'+dd : dd );
		    };

		    if (tokens && tokens.length) {
		        tokens.forEach(function(item,index){
		            var token = item.replace('{','').replace('}','');
		            var fn = token.match(fnexp);
		            var arg = null;

		            if (fn && fn.length) {
		                arg = fn[1];
		                fn = token.substr(0,token.indexOf('('));

		                switch(fn)
		                {
		                    case "Date":
		                        var val = getDate(arg);
		                        query = query.replace(item, val);
		                    break;
		                }
		                return;
		            }

		            if (data && data[token]) {
		            	query = query.replace(item, data[token]);
		            }
		        });
		    }

		    return query;
		},
		enumerable: true,
		configurable: true,
		writable: true
	},
	noop: {
		value: function noop() {},
		enumerable: true,
		configurable: true,
		writable: true
	},
	makePath: {
		value: function makePath(filepath) {
			var mkdirp = require('mkdirp');
			var path = require('path');
			var fs = require('fs');
			var dirname = path.dirname(filepath);

			if (fs.existsSync(dirname)) return true;

			return mkdirp.sync(dirname);
		},
		enumerable: true,
		configurable: true,
		writable: true
	}
});
