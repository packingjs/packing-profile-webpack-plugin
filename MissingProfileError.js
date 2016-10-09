/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
function MissingProfileError(module, name, value) {
	Error.call(this);
	Error.captureStackTrace(this, MissingProfileError);
	this.name = "MissingProfileError";
	this.requests = [
		{ name: name, value: value }
	];
	this.module = module;
	this._buildMessage();
}
module.exports = MissingProfileError;

MissingProfileError.prototype = Object.create(Error.prototype);

MissingProfileError.prototype._buildMessage = function() {
	this.message = this.requests.map(function(request) {
		if(request.name === request.value)
			return "Missing profile: " + request.name;
		else
			return "Missing profile: (" + request.name + ") " + request.value;
	}).join("\n");
};

MissingProfileError.prototype.add = function(name, value) {
	for(var i = 0; i < this.requests.length; i++)
		if(this.requests[i].name === name) return;
	this.requests.push({ name: name, value: value });
	this._buildMessage();
};
