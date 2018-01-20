describe('fillRect()', function() {

	beforeEach(function() {
		var fixture = `
			<div id='fixture'>
				<canvas id='canvas'></canvas>
				<canvas id='canvasgl'></canvas>
			</div>
		`;
		document.body.insertAdjacentHTML(
			'afterbegin',
			fixture
		);
	});

	afterEach(function() {
		document.body.removeChild(document.getElementById('fixture'));
	});

	it('should work', function() {
		var canvas = document.getElementById('canvas');
		var context = canvas.getContext('2d');
		var canvasgl = new CanvasGL(document.getElementById('canvasgl'));
		var contextgl = canvasgl.getContext('2d');
		var contexts = [context, contextgl];
		var canvass = [canvas, canvasgl];
		var rands = [];
		var length = 512;
		var min = 1;
		var max = length - min;
		var count = 100;
		var i = 0;
		for (i = 0 ; i < count ; i++) {
			rands.push([
				Utils.getRandom(min, max*(1-0.125)),
				Utils.getRandom(min, max*(1-0.125)),
				Utils.getRandom(min, max*0.125),
				Utils.getRandom(min, max*0.125)
			]);
		}
		contexts.forEach(function(context) {
			context.canvas.setAttribute('height', length);
			context.canvas.setAttribute('width', length);
			context.canvas.style.height  = length +'px';
			context.canvas.style.width  = length +'px';
			var t0 = performance.now();
			for (i = 0 ; i < count ; i++) {
				context.fillRect(rands[i][0], rands[i][1], rands[i][2], rands[i][3]);
			}
			if (context.blit) {
				context.blit();
			}
			var t1 = performance.now();
			var time = t1 - t0;
		});
		var delta = Utils.getDelta(context, contextgl);
		expect(delta).toBe(0);
	});

	it('should work with custom dimensions', function() {
		var canvas = document.getElementById('canvas');
		var context = canvas.getContext('2d');
		var canvasgl = new CanvasGL(document.getElementById('canvasgl'));
		var contextgl = canvasgl.getContext('2d');
		var contexts = [context, contextgl];
		var canvass = [canvas, canvasgl];
		var rands = [];
		var w = 512;
		var h = 256;
		var minW = 1;
		var maxW = w - minW;
		var minH = 1;
		var maxH = h - minH;
		var count = 100000;
		var i = 0;
		for (i = 0 ; i < count ; i++) {
			rands.push([
				Utils.getRandom(minW, maxW*(1-0.125)),
				Utils.getRandom(minH, maxH*(1-0.125)),
				Utils.getRandom(minW, maxW*0.125),
				Utils.getRandom(minH, maxH*0.125)
			]);
		}
		contexts.forEach(function(context) {
			context.canvas.setAttribute('height', h);
			context.canvas.setAttribute('width', w);
			context.canvas.style.height  = h +'px';
			context.canvas.style.width  = w +'px';
			var t0 = performance.now();
			for (i = 0 ; i < count ; i++) {
				context.fillRect(rands[i][0], rands[i][1], rands[i][2], rands[i][3]);
			}
			if (context.blit) {
				context.blit();
			}
			var t1 = performance.now();
			var time = t1 - t0;
		});
		var delta = Utils.getDelta(context, contextgl);
		expect(delta).toBe(0);
	});

	it('should work with random dimensions and be faster', function() {
		var canvas = document.getElementById('canvas');
		var context = canvas.getContext('2d');
		var canvasgl = new CanvasGL(document.getElementById('canvasgl'));
		var contextgl = canvasgl.getContext('2d');
		var contexts = [contextgl, context];
		var canvass = [canvasgl, canvas];
		var rands = [];
		var w = Utils.getRandom(100, 1000);
		var h = Utils.getRandom(100, 1000);
		var minW = 1;
		var maxW = w - minW;
		var minH = 1;
		var maxH = h - minH;
		var count = 100000;
		var i = 0;
		for (i = 0 ; i < count ; i++) {
			rands.push([
				Utils.getRandom(minW, maxW*(1-0.125)),
				Utils.getRandom(minH, maxH*(1-0.125)),
				Utils.getRandom(minW, maxW*0.125),
				Utils.getRandom(minH, maxH*0.125)
			]);
		}
		var times = [];
		contexts.forEach(function(context) {
			context.canvas.setAttribute('height', h);
			context.canvas.setAttribute('width', w);
			context.canvas.style.height  = h +'px';
			context.canvas.style.width  = w +'px';
			var t0 = performance.now();
			for (i = 0 ; i < count ; i++) {
				context.fillRect(rands[i][0], rands[i][1], rands[i][2], rands[i][3]);
			}
			if (context.blit) {
				context.blit();
			}
			var t1 = performance.now();
			var time = t1 - t0;
			times.push(time);
		});
		var delta = Utils.getDelta(context, contextgl);
		expect(delta).toBe(0);
		expect(times[0]).toBeLessThan(times[1]);
	});
});
