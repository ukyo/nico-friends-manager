(function() {

function copyObject(o) {
	var ret = {};
	for(var k in o) {
		o.hasOwnProperty( k ) && ( ret[k] = o[k] );
	}
	return ret;
}

function type(v) {
	return v.constructor.name;
}

function _dateToString(o) {
	var t;
	for (var k in o) {
		if ( o.hasOwnProperty( k ) ) {
			t = type( o[k] );
			t === "Date" && ( o[k] = "TIME_STAMP " + o[k].toString() );
			t === "Object" && _dateToString( o[k] );
		}
	}
	return o;
}

function _stringToDate(o) {
	var t;
	for (var k in o) {
		if ( o.hasOwnProperty( k ) ) {
			t = type( o[k] );
			t === "String" && o[k].match( /^TIME_STAMP .+/ ) && ( o[k] = new Date(o[k].replace("TIME_STAMP ", "")) );
			t === "Object" && _stringToDate( o[k] );
		}
	}
	return o;
}

function iconURL( id ) {
	return "http://usericon.nimg.jp/usericon/" + ~~(id/10000) + "/" + id + ".jpg";
}

var ls = {
	set: function( k, v ) {
		var copy = v;
		type( v ) === "Object" && ( copy = copyObject( v ) );
		type( v ) === "Array" && ( copy = Array.prototype.concat( [], v ) );
	
		_dateToString( copy );
		localStorage[k] = JSON.stringify( copy );
	},
	get: function( k ) {
		try {
			return _stringToDate( JSON.parse( localStorage[k]) );
		} catch (e) {
			return undefined;
		}
	}
};

utils = {
	ls: ls,
	iconURL: iconURL,
	type: type,
	copyObject: copyObject
};

})();