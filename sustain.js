
var SustainFile = function(context) {
	this.context = context;
	this.buffer = null;
	this.start = 0;
	this.end = 0;
	this.pingpong = false;
	this.samples = new Float32Array(0);
	this.numsamples = 0;
	this.samplerate = 44100;
}

SustainFile.prototype.load = function(filename, start, end, pingpong) {
	var _this = this;
	var request = new XMLHttpRequest();
	request.open('GET', filename, true);
	request.responseType = 'arraybuffer';
	request.onload = function() {
	    context.decodeAudioData(request.response, function(buffer) {
	    	_this.start = start;
			_this.end = end;
			_this.pingpong = pingpong;
			var data = buffer.getChannelData(0);
			_this.samplerate = buffer.sampleRate;
			_this.samples = data;
			_this.numsamples = buffer.length;
		}, function(e) {
			console.error(e);
		});
	}
	request.send();
}

var SustainPlayer = function(context, sound) {
	var _this = this;
	this.sound = sound;
	this.position = 0;
	this.delta = 1;
	this.playing = false;
	this.gate = false;
	this.inloop = false;
	var buffersize = 8192;
	this.scriptNode = context.createScriptProcessor(buffersize, 0, 1);
	this.scriptNode.onaudioprocess = function(e) {
		var output = e.outputBuffer.getChannelData(0);
		for(var i=0; i<buffersize; i++) {

			if (_this.playing) {
				output[i] = _this.sound.samples[_this.position];
			} else {
				output[i] = 0.0;
			}

			if (_this.playing) {
				if (_this.position < _this.sound.numsamples) {
					_this.position += _this.delta;

					if (_this.delta == 1) {
					 	if (_this.position >= _this.sound.start && _this.position <= _this.sound.end) {
							_this.inloop = true;
						} else {
							_this.inloop = false;
						}
					}

					if (_this.delta == 1 && _this.position >= _this.sound.end) {
						if (_this.gate) {
							if (_this.inloop) {
								if (_this.sound.pingpong) {
									// pingpong loop go backwards
									_this.delta = -1;
								} else {
									// standard loop, jump back
									_this.position = _this.sound.start;
								}
							}
						}
					}

					if (_this.sound.pingpong && _this.inloop && _this.delta == -1 && _this.position <= _this.sound.start) {
						// pingpong loop reset
						_this.delta = 1;
					}

				} else {
					_this.playing = false;
					_this.gate = false;
				}
			}
		}
	}
}

SustainPlayer.prototype.attack = function() {
	if (!this.playing) {
		if (this.position >= this.sound.numsamples) {
			this.position = 0;
		}
		this.playing = true;
		this.inloop = false;
		this.delta = 1;
	}
	if (!this.gate) {
		this.gate = true;
	}
}

SustainPlayer.prototype.release = function() {
	if (this.gate) {
		this.gate = false;
	}
}

SustainPlayer.prototype.connect = function(destination) {
	this.scriptNode.connect(destination);
}



