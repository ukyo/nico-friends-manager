(function() {
var url = "http://www.nicovideo.jp/my/friend";

function createNotification( img, title, body ) {
	return webkitNotifications.createNotification( img, title, body );
}

function isLogin() {
	var ret;
	
	$.ajax({
		url: url,
		async: false,
		success: function(){
			ret = true;
		}
	});
	
	return ret;
}

function loadNicoFriends( callback ) {
	var friends = {},
		page = 1,
		rhref = /href=\"[^h][^t][^t][^p]/,
		rsrc = /src=\"[^h][^t][^t][^p]/,
		callback = callback || checkNicoFriends;
	
	function loadNicoFriendsByPage( page ) {
		var $data, isSuccess;
		
		function load() {
			$.ajax({
				url: url,
				data: { page: page },
				async: false,
				success: function( data ) {
					$data = $(data.replace( rhref, 'href="' + url + '/' ).replace( rsrc, 'src="' + url + '/' ));
					$data.find( ".report" ).each( function( i, v ) {
						var $this = $(this),
							a = $this.find("h4 > a"),
							id = a.attr("href").split( '/user/' )[1];
						friends[id] = friends[id] || {};
						friends[id].name = a.text();
						friends[id].description = $this.find("p").text().replace(/(\n|\r\n)/g, '');
					});
					isSuccess = true;
				},
				error: function ( xhr, state ) {
					isSuccess = false;
				}
			});
		}

		load();
		
		//return num of friends.
		return isSuccess ? $data.find( "#myContHead h3" ).text().substring( 5, 8 ) : null;
	}
	
	function slowLoad() {
		setTimeout( function() {
			var res = loadNicoFriendsByPage( page );
			if ( res === null ) {
				slowLoad();
			} else if ( page <= ( res/10|1 ) ) {
				++page;
				slowLoad();
			} else {
				callback( friends );
			}
		}, 1000 );
	}
	
	slowLoad();
}

function checkNicoFriends( friends, callback ) {
	var adds, removes, oldFriends, callback = callback || showNotifications;
	
	function check( a, b ) {
		var o = {};
		$.each( a, function( k, v ) {
			!b[k] && ( o[k] = v );
		});
		return o;
	}
	
	function checkAdd() {
		return check( friends, oldFriends );
	}
	
	function checkRemove() {
		return check( oldFriends, friends );
	}
	
	function updateHistory() {
		var history = [];
		
		function push( o, type ) {
			if ( $.isEmptyObject( o ) ) return;
			$.each( o, function( k, v ) {
				history.push({
					timeStamp: new Date(),
					id: k,
					name: v.name,
					type: type 
				});
			});
		}
		
		push( adds, "add" );
		push( removes, "removes" );
		
		history = history.concat( utils.ls.get( "history" ) || [] ).slice( 0, options.maxHistory() ).sort( function( a, b ) {
			return a.timeStamp == b.timeStamp ? 0 : a.timeStamp < b.timeStamp ? 1 : -1;
		});
		
		utils.ls.set( "history", history );
	}
	
	if ( utils.ls.get("friends") ) {
		oldFriends = utils.ls.get( "friends" );
		adds = checkAdd();
		removes = checkRemove();
	}
	
	utils.ls.set( "friends", friends );
	updateHistory();
	callback( adds, removes );
}

function showNotifications( adds, removes ) {
	adds = adds || {};
	removes = removes || {};
	var notifications = [],
		title = "";
	
	function push( o, title, body ) {
		$.each( o, function( k, v ) {
			notifications.push( createNotification( utils.iconURL( k ), title, v.name + body ) );
		});
	}
	
	push( adds, title, "さんがフレンドになりました。");
	push( removes, title, "さんがフレンドから外れました。");
	
	$.each( notifications, function( i, v ) {
		v.show();
	});
	
	setTimeout(function(){
		$.each( notifications, function( i, v ){
			v.cancel();
		});
	}, 60 * 1000);
}

function loopNicoNotification() {
	setTimeout( function() {
		isLogin() && loadNicoFriends();
		loopNicoNotification();
	}, options.loadInterval() );
}

if (isLogin()) {
	loadNicoFriends();
	loopNicoNotification();
}

background = {
	createNotification: createNotification,
	loadNicoFriends: loadNicoFriends,
	checkNicoFriends: checkNicoFriends,
	showNotifications: showNotifications,
	loopNicoNotification: loopNicoNotification
};

})();