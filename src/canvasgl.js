'use strict';

function ProgramWrapper(context) {
	var this_ = this;
	this_.context = context;
	this_.gl = this_.context.gl;
	this_.source = {};
	this_.shader = {};

	this_.setFragmentSource = function(source) {
		this_.source.fragment = source;
		this_.shader.fragment = this_.createShader(
			this_.gl,
			this_.gl.FRAGMENT_SHADER,
			source
		);
	};

	this_.setVertexSource = function(source) {
		this_.source.vertex = source;
		this_.shader.vertex = this_.createShader(
			this_.gl,
			this_.gl.VERTEX_SHADER,
			source
		);
	};

	this_.createShader = function(gl, type, source) {
		var shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
		if (success) {
			return shader;
		}
		gl.deleteShader(shader);
	};

	this_.createProgram = function(gl, vertexShader, fragmentShader) {
		var program = gl.createProgram();
		vertexShader ? null : vertexShader = this_.shader.vertex;
		fragmentShader ? null : fragmentShader = this_.shader.fragment;
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		var success = gl.getProgramParameter(program, gl.LINK_STATUS);
		if (success) {
			return program;
		}
		gl.deleteProgram(program);
	};

	this_.getProgram = function () {
		this_.program = this_.createProgram(
			this_.gl,
			this_.vertexShader,
			this_.fragmentShader
		);
		return this_.program;
	};
}


function FillRectProgramWrapper(context) {
	var this_ = this;
	ProgramWrapper.call(this_, context);

	this_.setVertexSource(`#version 300 es
		precision mediump float;
		in vec2 pos;
		void main() {
			gl_Position = vec4((vec2(1,1)*(pos) * vec2(2,-2) / vec2(512, 512) - vec2(1,-1)) , 1, 1);
		}
	`);
	this_.setFragmentSource(`#version 300 es
		precision mediump float;
		out vec4 outColor;
		void main() {
			outColor = vec4(0, 0, 0, 1);
		}
	`);

	var positionAttributeLocation = this_.gl.getAttribLocation(this_.getProgram(), 'pos');
	var positionBuffer = this_.gl.createBuffer();
	this_.gl.bindBuffer(context.gl.ARRAY_BUFFER, positionBuffer);

	var vao = context.gl.createVertexArray();
	context.gl.bindVertexArray(vao);
	context.gl.enableVertexAttribArray(positionAttributeLocation);

	var size = 2;          // 2 components per iteration
	var type = context.gl.FLOAT;   // the data is 32bit floats
	var normalize = false; // don't normalize the data
	var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
	var offset = 0;        // start at the beginning of the buffer
	context.gl.vertexAttribPointer(
		positionAttributeLocation,
		size,
		type,
		normalize,
		stride,
		offset
	);

	context.gl.useProgram(this_.getProgram());

	context.gl.bindVertexArray(vao);
	var primitiveType = context.gl.TRIANGLES;
	this_.data = [];

	this_.addData = function(data) {
		this_.data.push(...data);
	};

	this_.blit = function () {
		context.gl.viewport(0, 0, context.gl.canvas.width, context.gl.canvas.height);
		context.gl.bufferData(context.gl.ARRAY_BUFFER, new Float32Array(this_.data), context.gl.STATIC_DRAW);
		context.gl.drawArrays(primitiveType, offset, this_.data.length/size);
	};
}


class ContextGL2 {
	constructor(context) {
		this.context = context;
		this.canvas = context.canvas;
		this.PROGRAM_FILL_RECT = this.getNextConst();
		this.PATH = this.getNextConst();

		this.canvas2 = this.canvas.cloneNode(true);
		this.canvas2.id = this.canvas.id;
		this.canvas.parentNode.appendChild(this.canvas2);
		this.canvas.remove();
		this.canvas = null;
		this.canvas = this.canvas2;

		this.gl = this.canvas2.getContext('webgl2');
		this.instructions = [];



		this.programs = [];
		this.programs[this.PROGRAM_FILL_RECT] = new FillRectProgramWrapper(this);
	}

	fillRect (x, y, w, h) {
		this.programs[this.PROGRAM_FILL_RECT].addData(
			[
				x, y,
				x+w, y,
				x+w, y+h,
				x, y,
				x, y+h,
				x+w, y+h
			]
		);
		//this_.programs[PROGRAM_FILL_RECT].use(x, y, w, h);
		return true;
	}

	getNextConst () {
		return this.nextConst ? ++this.nextConst : this.nextConst = 1;
	}

	beginPath () {
		this.instructions.push({type:this.PATH});
		return true;
	}

	blit () {
		this.programs[this.PROGRAM_FILL_RECT].blit();
	}


	//getImageData(x, y, w, h) {
	//	return this.context.getImageData(x, y, w, h);
	//}

	getImageData(x, y, w, h) {
		var imageData = {};
		imageData.data = null;

		var pixels = new Uint8Array(w * h* 4);
		this.gl.readPixels(0, 0, w, h, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
		imageData.data = new Uint8Array(w*h * 4);

		for (x = 0 ; x < w ; x++) {
			for (y = 0 ; y < h ; y++) {
				imageData.data[y*4*w + x*4 + 0] = pixels[(h-y-1)*4*w + x*4 + 0];
				imageData.data[y*4*w + x*4 + 1] = pixels[(h-y-1)*4*w + x*4 + 1];
				imageData.data[y*4*w + x*4 + 2] = pixels[(h-y-1)*4*w + x*4 + 2];
				imageData.data[y*4*w + x*4 + 3] = pixels[(h-y-1)*4*w + x*4 + 3];
			}
		}

		return imageData;
	}
}

function CanvasGL(canvas) {
	var canvasTmp = document.createElement('canvas');
	var webgl2 = canvasTmp.getContext('webgl2', {antialias: false, alpha:false});
	if (webgl2) {
		canvas.old = {};
		canvas.old.getContext = canvas.getContext.bind(canvas);
		canvas.getContext = function(contextType) {
			if (contextType === '2d') {
				canvas.contextGl = new ContextGL2(canvas.old.getContext(contextType));
				return canvas.contextGl;
			}
			else {
				return canvas.old.getContext(contextType);
			}
		};
	}
	else {
		//console.warn('webgl2 not supported');
	}
	canvasTmp.remove();
	return canvas;
}


