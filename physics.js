class Vector2 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	add(vector) {
		return new Vector2(this.x + vector.x, this.y + vector.y);
	}

	subtract(vector) {
		return new Vector2(this.x - vector.x, this.y - vector.y);
	}

	multiply(scalar) {
		if (scalar === 0) return new Vector2(0, 0);
		return new Vector2(this.x * scalar, this.y * scalar);
	}

	divide(scalar) {
		if (scalar === 0) return new Vector2(0, 0);
		return new Vector2(this.x / scalar, this.y / scalar);
	}

	rotate(angle) {
		let x = this.x * Math.cos(angle) - this.y * Math.sin(angle), 
			y = this.x * Math.sin(angle) + this.y * Math.cos(angle);
		return new Vector2(x, y);
	}

	dotProduct(vector, normalized) {
		let v1 = normalized ? this : this.normalize();
		let v2 = normalized ? vector : vector.normalize();

		return v1.x * v2.x + v1.y * v2.y
	}

	normalize() {
		let magnitude = Math.hypot(this.x, this.y);

		return this.divide(magnitude);
	}

	get length() {
		return Math.hypot(this.x, this.y);
	}

	set length(scalar) {
		if (scalar <= 0) {
			this.x = this.y = 0;
		} else {
			let nv = this.normalize().multiply(scalar);
			this.x = nv.x;
			this.y = nv.y;
		}
	}

	get angle () { return Math.atan2(this.y, this.x) }
}

function physicsUpdate() {
	updateElements();
	for (let object of currentLevel.objects) {
		if (Math.abs(object.velocity.x) > 0 || Math.abs(object.velocity.y) > 0) {
			object.position = object.position.add(object.velocity);
			object.velocity = object.velocity.multiply(FRICTION);
			if (Math.abs(object.velocity.x) < 0.01) object.velocity.x = 0;
			if (Math.abs(object.velocity.y) < 0.01) object.velocity.y = 0;
			if (Math.abs(object.velocity.x) == 0 && Math.abs(object.velocity.y) == 0) {
				console.log('boom')
				object.active = true;
				object.onCollision(null);
			}
		}
	}
	let cv = control();
	if (cv) {
		player.rotation = player.rotation.add(cv).normalize();
		player.velocity = player.velocity.add(cv.multiply(player.acceleration));
	}
	player.position = player.position.add(player.velocity);
	player.velocity.length *= AIR_RESISTANCE;
	if (player.held >= 0) player.items[player.held].updateHeld();

	objectTileCollision(player);
	for (let object of currentLevel.objects) {
		let collision = checkCollision(player.collider, object);
		if (collision.hit) {
			object.onCollision(player);
		}
	}
	particles.update();
}

function updateElements() {
	for (let e = currentLevel.length - 1; e >= 0; e--) {
		for (let layer = 0; layer < 2; layer++) {
			let type = currentLevel.getType(layer, e);
			if (type <= GRND) continue; //No effect in this tile

			if (substanceTypes[type].state == 1 && currentLevel.getLife(layer, e) <= 0) {
				let tx = e % currentLevel.width, ty = ((e - tx) / currentLevel.width) * TILE_SIZE;
				tx *= TILE_SIZE;
				particles.spawn([type, tx, ty, 1 - (Math.random() * 2), 1 - (Math.random() * 2), 4], 1);
				particles.spawn([type, tx, ty, 1 - (Math.random() * 2), 1 - (Math.random() * 2), 4], 1);
				particles.spawn([type, tx, ty, 1 - (Math.random() * 2), 1 - (Math.random() * 2), 4], 1);
				particles.spawn([type, tx, ty, 1 - (Math.random() * 2), 1 - (Math.random() * 2), 4], 1);
				currentLevel.resetTile(layer, e);
			}

			if (layer == 1) elementEffectOnTile(e, type);

			let checkTiles = shuffle(tilesNearIndex(e));
			for (let checkTile of checkTiles) {
				if (checkTile == e) continue; //skip current tile
				let ctType = currentLevel.getType(layer, checkTile);

				if (ctType > NOEFF) {
					elementSpread(layer, e, checkTile);
				} 
			}
		}
	}
}

function elementEffectOnTile(tileIndex, elementType) {
	let state = substanceTypes[elementType].state;

	let decay = Math.random();
	if (state >= 3) { currentLevel.addLife(1, tileIndex, -decay);}
	if (state == 4) { 
		if (currentLevel.getType(0, tileIndex) > GRND) {
			currentLevel.addLife(0, tileIndex, -decay);
			currentLevel.addLife(1, tileIndex, decay);
		}

		if (currentLevel.getLife(0, tileIndex) <= 0) {
			currentLevel.resetTile(0, tileIndex);
			currentLevel.resetTile(1, tileIndex);
		}
	}

	let lifeTime = currentLevel.getLife(1, tileIndex);
	if (lifeTime <= 0) {
		let deathEffect = substanceTypes[elementType].ondeath
		if (deathEffect >= GRND) currentLevel.spawnTile(tileIndex, deathEffect);
		else currentLevel.setType(1, tileIndex, GRND);
	}
}

function elementSpread(layer, tileFrom, tileTo) {	
	let fromType = currentLevel.getType(layer, tileFrom);
	let state;
	if (substanceTypes[fromType] && (state = substanceTypes[fromType].state) == 1) return;
	
	//TO DO: Make this make more sense
	let airType = currentLevel.getType(layer, tileTo);
	let groundType = currentLevel.getType(0, tileTo);

	let toType = state > 2 ? airType : groundType;
	let hasType = state > 2 ? groundType : airType;

	if (fromType > GRND) {
		if (substanceTypes[hasType].effects.has(fromType) && (toType <= GRND || toType == fromType || substanceTypes[toType].effects.has(fromType)) ) {
			let spreadQuant = state > 2 ? 4 : 1;
			if (state < 4 && currentLevel.getQuantity(layer, tileFrom) > spreadQuant) {
				let toQuant = (airType == fromType) ? currentLevel.getQuantity(layer, tileTo) : 0;
				
				if (!toQuant) currentLevel.spawnTile(tileTo, fromType);
				else currentLevel.addLife(layer, tileTo, Math.random());
		
				currentLevel.setQuantity(layer, tileTo, toQuant + spreadQuant); //Why can't this bad addQuantity?
				if (state === 3) spreadQuant *= 1.2;
				currentLevel.addQuantity(layer, tileFrom, -spreadQuant);
				
			} else if (state == 4) {
				if (Math.random() > 0.96) currentLevel.spawnTile(tileTo, fromType);
			}
		} else {
			elementInteraction(fromType, tileTo);
		}
	}
}

function elementInteraction(fromType, tileTo) {
	let groundType = currentLevel.getType(0, tileTo);
	let airType = currentLevel.getType(1, tileTo);

	let result;
	if (effectMatrix[fromType]) {
		if (!(result = effectMatrix[fromType][groundType])) {
			result = effectMatrix[fromType][airType];
		}
	} else {
		console.log('invalid substance type for interaction');
		result = NOEFF;
	}

	if (result && result > GRND) {
		currentLevel.spawnTile(tileTo, result);
	}
}
