class Utils {
	static getRandom(max, min) {
		return parseInt(Math.random() * (parseFloat(max - min)) + parseFloat(min));
	}

	static getDelta(context1, context2) {
		var w = context1.canvas.width;
		var h = context1.canvas.height;
		var delta = 0;
		var data1 = context1.getImageData(0, 0, w, h).data;
		var data2 = context2.getImageData(0, 0, context2.canvas.width, context2.canvas.height).data;
		for (var x = 0 ; x < w ; x++) {
			for (var y = 0 ; y < h ; y++) {
				delta += Math.abs(data1[y*4*w + x*4 + 0] - data2[y*4*w + x*4 + 0]);
				delta += Math.abs(data1[y*4*w + x*4 + 1] - data2[y*4*w + x*4 + 1]);
				delta += Math.abs(data1[y*4*w + x*4 + 2] - data2[y*4*w + x*4 + 2]);
				delta += Math.abs(data1[y*4*w + x*4 + 3] - data2[y*4*w + x*4 + 3]);
			}
		}
		return delta;
	}
}
