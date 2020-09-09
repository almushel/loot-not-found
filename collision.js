function objectTileCollision(object) {
	let hit = false;
	let nearTiles = tilesNearPosition(object.x, object.y);
	for (tile of nearTiles) {
		let groundType = currentLevel.getType(0, tile);
		let airType = currentLevel.getType(1, tile);

		if (groundType > GRND || airType > GRND) {
			let tileRect = getTileCollider(tile);
			let collision = checkCollision(object, tileRect);
			if (collision.hit) {
				if (substanceTypes[groundType].state == 1) {
					hit = true;
					let correction = new Vector2(object.x - tileRect.x, object.y - tileRect.y);
					if (Math.abs(correction.x) > Math.abs(correction.y)) correction.y = 0;
					else correction.x = 0;
		
					correction = correction.normalize();
					correction.x *= collision.overlap.x;
					correction.y *= collision.overlap.y;
					object.position = object.position.add(correction);
					object.velocity = object.velocity.multiply(FRICTION);
				} else {
					if (airType == FIRE) object.hp -= 0.125;
				}
			}
		}
	}

	return hit;
}

function getTileCollider(tileIndex) {
	let x = tileIndex % currentLevel.width;
	let y = Math.floor(tileIndex / currentLevel.width);
	let tileRect = {
		x: (x * TILE_SIZE) + (TILE_SIZE / 2), y: (y * TILE_SIZE) + (TILE_SIZE / 2),
		type: 'rect', width: TILE_SIZE, height: TILE_SIZE
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
				collision = circleRectOverlap(col2, col1);
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
		//TO-DO: This is wrong
		return { hit: true, overlap: { x: distX, y: distY } }
	}

	return { hit: false, overlap: 0 }
}

function circleRectOverlap(circle, rect) {
	let distX = circle.x - rect.x;
	let distY = circle.y - rect.y;
	let ang = Math.atan2(distY, distX) + Math.PI;
	let width = rect.width / 2 + Math.abs(Math.cos(ang) * circle.radius),
		height = rect.height / 2 + Math.abs(Math.sin(ang) * circle.radius);

	if (Math.abs(distX) < width && Math.abs(distY) < height) {
		return { hit: true, overlap: new Vector2(width - Math.abs(distX), height - Math.abs(distY)) };
	}

	return { hit: false, overlap: 0 };
}

function aabbOverlap(rect1, rect2) {
	let distX = Math.abs(rect1.x - rect2.x), distY = Math.abs(rect1.y - rect2.y);
	let width = (rect1.width + rect2.width) / 2, height = (rect1.height + rect2.height) / 2;

	if (distX <= width && distY <= height) {
		return { hit: true, overlap: new Vector2(width - distX, height - distY) };
	}

	return { hit: false, overlap: 0 };
}