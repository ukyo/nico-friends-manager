(function() {

var defaults = {
		loadInterval: 30,
		maxHistory: 500
};
options = {
	loadInterval: function() {
		return ( utils.ls.get( "loadInterval" ) || defaults.loadInterval ) * 60 * 1000;
	},
	maxHistory: function() {
		return utils.ls.get( "maxHistory" ) || defaults.maxHistory;
	},
	setLoadInterval: function(i) {
		utils.ls.set("loadInterval", i || defaults.loadInterval);
	},
	setMaxHistory: function(i) {
		utils.ls.set("maxHistory", i || defaults.maxHistory);
	}
};
})();
