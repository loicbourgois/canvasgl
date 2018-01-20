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
});
