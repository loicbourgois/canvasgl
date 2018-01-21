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
			in vec4 color;

			out vec4 vColor;

			void main() {
				gl_Position = vec4((pos * vec2(2,-2) / canvasDimensions - vec2(1,-1)) , 1, 1);
				vColor = color;
			}
		`);
		this.setFragmentSource(`#version 300 es
			precision mediump float;

			in vec4 vColor;

			out vec4 outColor;

			void main() {
				outColor = vColor;
			}
		`);
		var program = this.getProgram();
		this.colorAttributeLocation = this.gl.getAttribLocation(program, 'color');
		this.positionAttributeLocation = this.gl.getAttribLocation(program, 'pos');
		this.canvasDimensionsLocation = this.gl.getUniformLocation(program, 'canvasDimensions');

		this.positionBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.context.gl.ARRAY_BUFFER, this.positionBuffer);

		this.vao = this.context.gl.createVertexArray();
		this.context.gl.bindVertexArray(this.vao);
		this.context.gl.enableVertexAttribArray(this.positionAttributeLocation);
		this.context.gl.enableVertexAttribArray(this.colorAttributeLocation);

		this.size = 6;


		this.context.gl.vertexAttribPointer(
			this.positionAttributeLocation,
			2,
			this.context.gl.FLOAT,
			false,
			4*this.size,
			4*0
		);
		this.context.gl.vertexAttribPointer(
			this.colorAttributeLocation,
			4,
			this.context.gl.FLOAT,
			false,
			4*this.size,
			4*2
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
		this.programs[this.PROGRAM_FILL_RECT].context.fillStyle = 'rgb(0,0,0)';
	}

	fillRect (x, y, w, h) {
		var regexp = /[-]{0,1}[\d]*[.]{0,1}[\d]+/g;
		var color = this.programs[this.PROGRAM_FILL_RECT].context.fillStyle.match(regexp);
		var r = parseFloat(color[0])/255.0;
		var g = parseFloat(color[1])/255.0;
		var b = parseFloat(color[2])/255.0;
		var a = color[3] ? parseFloat(color[3]) : 1;
		this.programs[this.PROGRAM_FILL_RECT].addData(
			[
				x, y, r, g, b, a,
				x+w, y, r, g, b, a,
				x+w, y+h, r, g, b, a,
				x, y, r, g, b, a,
				x, y+h, r, g, b, a,
				x+w, y+h, r, g, b, a
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


