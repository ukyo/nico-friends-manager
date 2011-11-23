$(function() {
	var selected;

	function viewNav() {
		var selected = getSelectedFromLocalStorage();
		
		$( ".selected" ).removeClass( "selected" );
		$( "#"+selected ).addClass( "selected" );
	}
	
	function getURLFromCache(id){
		var url = utils.iconURL( id );
		url = imagecache.get(url);
		if (!url) {
			url = utils.iconURL( id );
			// 非同期で取得するので返り値は素のURL。更新後の値は次回以降適用される。
			imagecache.set(url, "jpeg");
		}
		return url;
	}
	
	// フレンド削除時にはcsrf tokenが必要になる。
	// 今のところは、Ajaxで取得したページより正規表現で切り出している。
	// 仕様変更に弱いかも。
	function getCsrfToken() {
		var url = "http://www.nicovideo.jp/my/friend", ret;
		$.ajax({
			url: url,
			async: false,
			success: function(data){
				/Globals\.hash = '(([a-z0-9]|-)+)';/.exec(data);
				ret = RegExp.$1;
			}
		});
		return ret;
	}
	
	function deleteFriends() {
		var token = getCsrfToken(),
			friends = utils.ls.get("friends"),
			ids = [], i = 0;
		
		disableDeleteButton();
		
		$.each(friends, function( id, v ){
			ids.push(id);
		});
		
		function deleteFriend(id) {
			var isSuccess;
			
			// 削除予定のフレンド(id)がいないか、フレンドがいたとして
			// チェックが入っていなければ削除せずに戻る。
			// 後半のほうは原理的にはいらないんだけど、一応保険的な意味合いで。
			if (!friends[id] || !friends[id].checked) return false;
			
			$.ajax({
				type: "POST",
				dataType: "json",
				async: false,
				data: {target_user_id: id, token: token},
				url: "http://www.nicovideo.jp/api/friendlist/delete",
				success: function(data) {
					if (data.status === "ok") {
						isSuccess = true;
						console.log(id);
					}
				}
			});
			
			// エラーが起きた場合はundefined
			return isSuccess;
		}
		
		// 503を防ぐために1秒ごとに1件削除
		function slowDelete() {
			while(i < ids.length && friends[ids[i]] && !friends[ids[i]].checked){i++}
			
			setTimeout(function(){
				var isSuccess = deleteFriend(ids[i]);
				if(i >= ids.length) {
					utils.ls.set("friends", friends);
					viewChecked();
				} else if (!isSuccess) {
					slowDelete();
				} else if (isSuccess){
					delete friends[ids[i++]];
					slowDelete();
				}
			}, 1000);
		}
		
		slowDelete();
	}
	
	function viewFriends() {
		var html = "", friends = utils.ls.get("friends");
		
		setCurrentScrollToLocalStorage();
		setSelectedToLocalStorage("friends");
		
		$.each( friends, function( id, v ) {
			html += '<div id="'+id+'" class="item '+(v.checked ? "checked" : "")+'"><img src="'+getURLFromCache( id )+'" width="48" height="48"/>'+
				'<div class="name">'+v.name+'</div>'+
				'<div class="description">'+v.description+'</div>'+
				'</div>';
		});
		$("article").html(html);
		viewNav();
		viewNumFriends();
		viewScroll();
		disableDeleteButton();
	}
	
	function viewHistory() {
		var html ="", history = utils.ls.get("history");
		
		setCurrentScrollToLocalStorage();
		setSelectedToLocalStorage("history");
		
		$.each( history, function( i, v ) {
			var text = v.type === "add" ? "さんがフレンドになりました。" : "さんがフレンドから外れました。";
			html += '<div class="item" id="'+v.id+'"><img src="'+getURLFromCache( v.id )+'" width="48" height="48"/>'+
				'<div class="name">'+v.name+text+'</div>'+
				'<div class="description">'+v.timeStamp.toString()+'</div>'+
				'</div>';
		});
		$("article").html(html);
		viewNav();
		viewNumFriends();
		viewScroll();
		disableDeleteButton();
	}
	
	function viewChecked() {
		var html = "", friends = utils.ls.get("friends");
		
		setCurrentScrollToLocalStorage();
		setSelectedToLocalStorage("checked");
		
		$.each( friends, function( id, v){
			if(!v.checked) return;
			html += '<div id="'+id+'" class="item '+(v.checked ? "checked" : "")+'"><img src="'+getURLFromCache( id )+'" width="48" height="48"/>'+
				'<div class="name">'+v.name+'</div>'+
				'<div class="description">'+v.description+'</div>'+
				'</div>';
		});
		
		$("article").html(html);
		viewNav();
		viewNumFriends();
		viewScroll();
		activeDeleteButton();
	}
	
	function viewScroll() {
		var scroll = getScrollFromLocalStorage()[getSelectedFromLocalStorage()] || 0;
		$("article").scrollTop( scroll );
	}
	
	function viewNumFriends() {
		var friends = utils.ls.get("friends"),
			i = 0;
		$.each( friends, function( k, v ){ i++; });
		$("#num-friends").text(i);
	}
	
	function getSelectedFromLocalStorage() {
		return utils.ls.get("selected") || "friends";
	}
	
	function setSelectedToLocalStorage( selected ) {
		utils.ls.set( "selected", selected );
	}
	
	function getScrollFromLocalStorage() {
		return utils.ls.get("scroll") || {};
	}
	
	function setScrollToLocalStorage( scroll ) {
		utils.ls.set( "scroll", scroll );
	}
	
	function setCurrentScrollToLocalStorage() {
		var scroll = getScrollFromLocalStorage(), selected = getSelectedFromLocalStorage();
		scroll[selected] = $("article").scrollTop();
		setScrollToLocalStorage( scroll );
	}
	
	function activeDeleteButton(){
		$("#delete-friends").get(0).disabled = false;
	}
	
	function disableDeleteButton(){
		$("#delete-friends").get(0).disabled = true;
	}
	
	$("#friends").click(viewFriends);
	
	$("#history").click(viewHistory);
	
	$("#checked").click(viewChecked);
	
	// 検索フォームに文字を入力した時の動作。
	$("input").keyup(function( e ){
		var rval = new RegExp(".*"+$("input").val().toLowerCase()+".*"), $item = $(".item");
		
		$item.removeClass("disable").each(function( k, v ){
			rval.test($(this).find(".name").text().toLowerCase()) || $(this).addClass("disable");
		});
	});
	
	// フレンドのリストの内、一要素をダブルクリックした時の動作。
	// フレンドにチェックを入れる。
	$(".item").live("dblclick", function( e ){
		var friends = utils.ls.get("friends"), isChecked;

		friends[this.id].checked = isChecked = friends[this.id].checked ? false : true;
		isChecked ? $(this).addClass("checked") : $(this).removeClass("checked");
		utils.ls.set("friends", friends);
	});
	
	$("#delete-friends").click(deleteFriends);
	
	$(window).unload(setCurrentScrollToLocalStorage);
	
	selected = getSelectedFromLocalStorage();
	if ( selected === "friends" ) {
		viewFriends();
	} else if (selected === "history"){
		viewHistory();
	} else {
		viewChecked();
	}
	
	popup = {
		viewNav: viewNav,
		viewFriends: viewFriends,
		viewHistory: viewHistory,
		viewNumFriends: viewNumFriends,
		viewScroll: viewScroll,
		getSelectedFromLocalStorage: getSelectedFromLocalStorage,
		setSelectedToLocalStorage: setSelectedToLocalStorage,
		getScrollFromLocalStorage: getScrollFromLocalStorage,
		setScrollFromLocalStorage: setScrollToLocalStorage,
		setCurrentScrollToLocalStorage: setCurrentScrollToLocalStorage,
		deleteFriends: deleteFriends
	}
});
