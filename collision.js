function getTileCollider(tileIndex) {
	let x = tileIndex % currentLevel.width;
	let y = Math.floor(tileIndex / currentLevel.width);
	let tileRect = {
		x: (x * GRID_SIZE) + (GRID_SIZE / 2), y: (y * GRID_SIZE) + (GRID_SIZE / 2),
		type: 'rect', width: GRID_SIZE, height: GRID_SIZE
	};

	return tileRect;
}

function checkCollision(col1, col2) {
	let collision = {};
	if (col1.type == 'circle') {
		switch (col2.type) {
			case 'circle':
				collision = circleOverlap(col1, col2);
				break;
			case 'rect':
				collision = circleRectOverlap(col1, col2);
				break;
			default:
				break;
		}
	} else if (col1.type == 'rect') {
		switch (col2.type) {
			case 'circle':
				collision = circleRectOverlap(col1, col2);
				break;
			case 'rect':
				collision = aabbOverlap(col1, col2);
				break;
			default:
				break;
		}
	}

	return collision;
}

function circleOverlap(circle1, circle2) {
	let distX = circle1.x - circle2.x;
	let distY = circle1.y - circle2.y;
	let dist = Math.hypot(distX, distY);
	let width = circle1.radius + circle2.radius;
	if (dist <= width) {
		return { hit: true, overlap: { x: distX, y: distY } }
	}

	return { hit: false, overlap: 0 }
}

function circleRectOverlap(circle, rect) {
	let dist = new Vector2(circle.x - rect.x, circle.y - rect.y);
	let ang = Math.atan2(dist.y, dist.x) + Math.PI;
	let width = rect.width / 2 + Math.abs(Math.cos(ang) * circle.radius),
		height = rect.height / 2 + Math.abs(Math.sin(ang) * circle.radius);

	if (Math.abs(dist.x) <= width && Math.abs(dist.y) <= height) {
		return { hit: true, overlap: new Vector2(width - Math.abs(dist.x), height - Math.abs(dist.y)) };
	}

	return { hit: false, overlap: 0 };
}

function aabbOverlap(rect1, rect2) {
	let distX = rect1.x - rect2.x;
	let distY = rect1.y - rect2.y;

	if (distX <= (rect1.width + rect2.width) / 2 && distY <= (rect1.height + rect2.height) / 2) {
		return { hit: true, overlap: { x: distX, y: distY } };
	}

	return { hit: false, overlap: 0 };
}