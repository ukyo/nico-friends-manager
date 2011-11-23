//Not Support IE.
var imagecache = (function(){

var ls = window.localStorage,
	prefix = "IMAGECACHE",
	BlobBuilder = window.MozBlobBuilder || window.WebKitBlobBuilder || window.BlobBuilder;

function set(url, type, callback, async){
	callback = callback || function(){};
	async = async != null ? async : true;
	var xhr = new XMLHttpRequest(),
		bb = new BlobBuilder(),
		fr = new FileReader();
	
	xhr.open('GET', url, async);
	xhr.responseType = 'arraybuffer';
	
	xhr.onload = function(){
		if(this.status == 200 || this.status == 206){
			var self = this;
			bb.append(this.response);
			fr.onload = function(){
				ls[prefix + url] = this.result;
				callback.call(self, this.result);
			};
			fr.readAsDataURL(bb.getBlob('image/' + type));
		} else if(this.status == 404){
			ls[prefix + url] = '../image/browser_action_icon.png';
			callback.call(this, 'not found');
		} else {
			callback.call(this, 'error');
		}
	}
	xhr.send();
}

function get(url){
	return ls[prefix + url];
}

return {
	set: set,
	get: get
};

})();
