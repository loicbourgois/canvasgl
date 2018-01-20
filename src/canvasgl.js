'use strict';

class ProgramWrapper {

	constructor(context) {
		this.context = context;
		this.gl = this.context.gl;
		this.canvas = this.context.gl.canvas;
		this.source = {};
		this.shader = {};
	}

	setFragmentSource (source) {
		this.source.fragment = source;
		this.shader.fragment = this.createShader(
			this.gl,
			this.gl.FRAGMENT_SHADER,
			source
		);
	}

	setVertexSource (source) {
		this.source.vertex = source;
		this.shader.vertex = this.createShader(
			this.gl,
			this.gl.VERTEX_SHADER,
			source
		);
	}

	createShader (gl, type, source) {
		var shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
		if (success) {
			return shader;
		}
		gl.deleteShader(shader);
	}

	createProgram (gl, vertexShader, fragmentShader) {
		var program = gl.createProgram();
		vertexShader ? null : vertexShader = this.shader.vertex;
		fragmentShader ? null : fragmentShader = this.shader.fragment;
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		var success = gl.getProgramParameter(program, gl.LINK_STATUS);
		if (success) {
			return program;
		}
		gl.deleteProgram(program);
	}

	getProgram () {
		this.program = this.createProgram(
			this.gl,
			this.vertexShader,
			this.fragmentShader
		);
		return this.program;
	}
}


class FillRectProgramWrapper extends ProgramWrapper {

	constructor(context_) {
		super(context_);
		this.setVertexSource(`#version 300 es
			precision mediump float;
			uniform vec2 canvasDimensions;
			in vec2 pos;

			void main() {
				gl_Position = vec4((pos * vec2(2,-2) / canvasDimensions - vec2(1,-1)) , 1, 1);
			}
		`);
		this.setFragmentSource(`#version 300 es
			precision mediump float;
			out vec4 outColor;
			void main() {
				outColor = vec4(0, 0, 0, 1);
			}
		`);
		var program = this.getProgram();
		this.positionAttributeLocation = this.gl.getAttribLocation(program, 'pos');
		this.canvasDimensionsLocation = this.gl.getUniformLocation(program, 'canvasDimensions');

		this.positionBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.context.gl.ARRAY_BUFFER, this.positionBuffer);

		this.vao = this.context.gl.createVertexArray();
		this.context.gl.bindVertexArray(this.vao);
		this.context.gl.enableVertexAttribArray(this.positionAttributeLocation);

		this.size = 2;          // 2 components per iteration
		this.type = this.context.gl.FLOAT;   // the data is 32bit floats
		this.normalize = false; // don't normalize the data
		this.stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
		this.offset = 0;        // start at the beginning of the buffer
		this.context.gl.vertexAttribPointer(
			this.positionAttributeLocation,
			this.size,
			this.type,
			this.normalize,
			this.stride,
			this.offset
		);

		this.gl.useProgram(program);
		this.context.gl.bindVertexArray(this.vao);
		this.primitiveType = this.context.gl.TRIANGLES;
		this.data = [];
	}


	addData (data) {
		this.data.push(...data);
	}


	blit () {
		this.gl.uniform2f(this.canvasDimensionsLocation, this.canvas.width, this.canvas.height);
		this.context.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		this.context.gl.bufferData(this.context.gl.ARRAY_BUFFER, new Float32Array(this.data), this.context.gl.STATIC_DRAW);
		this.context.gl.drawArrays(this.primitiveType, this.offset, this.data.length / this.size);
	}
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


