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
					let delta = new Vector2(object.x - tileRect.x, object.y - tileRect.y);
					correctCollision(object, delta, collision.overlap);
				} else if (object.tileEffect) {
					object.tileEffect(airType);
				}
			}
		}
	}

	return hit;
}

function continuousTileCollision(object) {
	let hit = false;
	let aabbSize = new Vector2(Math.abs(object.velocity.x) + object.size * 2, Math.abs(object.velocity.y) + object.size * 2)
	let increment = object.size / 4;
	let subDivisions = Math.floor(aabbSize.length / increment);
	let velIncrement = object.velocity.normalize().multiply(increment);

	let op = object.position;
	for (let a = 0; a <= subDivisions; a++) {
		object.position = object.position.add(velIncrement);
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
						let delta = new Vector2(object.x - tileRect.x, object.y - tileRect.y);
						correctCollision(object, delta, collision.overlap);
					} else if (object.tileEffect) {
						object.tileEffect(airType);
					}
				}
			}
		}
		if (hit) break;
	}
	
	return hit;
}

function correctCollision(object, delta, overlap) {
	if (Math.abs(delta.x) > Math.abs(delta.y)) delta.y = 0;
	else delta.x = 0;

	delta = delta.normalize();
	delta.x *= overlap.x;
	delta.y *= overlap.y;
	object.position = object.position.add(delta);
	object.velocity = object.velocity.add(delta);
	object.velocity = object.velocity.multiply(FRICTION);
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
	if (Math.abs(col1.x - col2.x) > col1.size + col2.size || Math.abs(col1.y - col2.y) > col1.size + col2.size) {
		collision.hit = false;
		return collision;
	}
	
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