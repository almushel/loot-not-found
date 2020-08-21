/*
	Element tiles:
		-1 hp per tick
		1 hp elemental damage to adjacent tiles per tick
			Only damage weak tiles (i.e. fire damages wood, but not concrete)
			Tiles inherit elemental effect at certain HP threshold (50%?)
			If adjacent tile already has elemental effect, check for interactions (electricity + water)
			If adjacent tile is empty, check for fill effect (fire produces smoke)	
*/

//TO-DO: Separate life and quantity

//[firstEffect][secondEffect] = result
const effectMatrix 	= [];
effectMatrix[FIRE] 	= [NOEFF, STEAM, NOEFF, SMOKE, FIRE , NOEFF, NOEFF];
effectMatrix[WATER] = [STEAM, NOEFF, NOEFF, NOEFF, NOEFF, NOEFF, NOEFF];
effectMatrix[SHOCK] = [NOEFF, NOEFF, NOEFF, NOEFF, NOEFF, NOEFF, NOEFF];
effectMatrix[SMOKE] = [NOEFF, NOEFF, NOEFF, NOEFF, NOEFF, NOEFF, NOEFF];
effectMatrix[GAS] 	= [NOEFF, NOEFF, NOEFF, NOEFF, NOEFF, NOEFF, NOEFF];
effectMatrix[STEAM] = [NOEFF, NOEFF, NOEFF, NOEFF, NOEFF, NOEFF, NOEFF];
effectMatrix[E_STM] = [NOEFF, NOEFF, NOEFF, NOEFF, NOEFF, NOEFF, NOEFF];

class SubstanceLayer {
	constructor(size) {
		this._stride = 3; /*1: Effect Type, 2: quantity, 3: Lifetime */
		this.grid = [];
		this.grid.length = size * this._stride;
		this.grid.fill(0);
	}

	getType(levelIndex) {
		return this.grid[levelIndex * this._stride];
	}

	setType(levelIndex, type) {
		this.grid[levelIndex * this._stride] = type;
		if (substanceTypes[type]) this.setQuantity(levelIndex, substanceTypes[type].quantity);
		if (substanceTypes[type]) this.setLifeTime(levelIndex, substanceTypes[type].life);
	}

	getQuantity(levelIndex) {
		return this.grid[levelIndex * this._stride + 1];
	}

	setQuantity(levelIndex, value) {
		this.grid[levelIndex * this._stride + 1] = value;
	}

	getLifeTime(levelIndex) {
		return this.grid[levelIndex * this._stride + 2];
	}

	setLifeTime(levelIndex, value) {
		this.grid[levelIndex * this._stride + 2] = value;
	}

	draw() {
		ctx.globalAlpha = 0.4;
		for (let e = 0; e < this.length; e++) {
			let type = this.getType(e);
			if (type <= 0) continue;
			ctx.fillStyle = substColors[type];
			let x = e % currentLevel.width, y = (e - x) / currentLevel.width;
			ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
		}
		ctx.globalAlpha = 1;
	}

	get length() { return this.grid.length / this._stride; }
}

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
		let x = Math.cos(this.x) - Math.sin(this.y), y = Math.sin(this.x) + Math.cos(this.y);
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
}

function physicsUpdate() {
	updateElements();
	let cv = control();
	player.velocity = player.velocity.add(cv.multiply(player.acceleration));
	player.position = player.position.add(player.velocity);
	player.velocity.length *= player.friction;

	let width = currentLevel.width, height = currentLevel.height;
	let nearTiles = tilesNearPosition(player);
	for (tile of nearTiles) {
		let x = tile % width;
		let y = Math.floor(tile / width);
		let tileType = currentLevel.getTileType(0, tile);
		if (!tileType) continue;

		let tileRect = {
			x: (x * GRID_SIZE) + (GRID_SIZE / 2), y: (y * GRID_SIZE) + (GRID_SIZE / 2),
			type: 'rect', width: GRID_SIZE, height: GRID_SIZE
		};
		let collision = checkCollision(player.collider, tileRect);
		if (collision.hit) {
			let correction = new Vector2(player.x - tileRect.x, player.y - tileRect.y);
			if (Math.abs(correction.x) > Math.abs(correction.y)) correction.y = 0;
			else correction.x = 0;

			correction = correction.normalize();
			correction.x *= collision.overlap.x;
			correction.y *= collision.overlap.y;
			player.position = player.position.add(correction);
			player.velocity = player.velocity.add(correction);
			player.velocity = player.velocity.multiply(player.friction);
		}
	}
}

function updateElements() {
	for (let e = currentLevel.length - 1; e >= 0; e--) {
		let type = currentLevel.getTileType(1, e);
		if (type <= GRND) continue; //No effect in this tile
		let lifeTime = currentLevel.getTileLife(1, e);

		//TO-DO: Move to elementEffectOnTile
		if (lifeTime <= 0) {
			currentLevel.setTileLife(0, e, 100);
			let deathEffect = substanceTypes[type].ondeath
			if (deathEffect >= 0) currentLevel.setTileType(1, e, deathEffect);
			else currentLevel.setTileType(1, e, NOEFF);
			continue;
		}

		elementEffectOnTile(e, type);

		let checkTiles = shuffle(tilesNearIndex(e));
		for (let checkTile of checkTiles) {
			if (checkTile == e) continue; //skip current tile
			let tileType = currentLevel.getTileType(0, checkTile);
			let ctType = currentLevel.getTileType(1, checkTile);

			if (ctType > NOEFF || ctType == type) {
				if (substanceTypes[tileType].effects[1].has(type)) { elementSpread(e, checkTile, type);}
				//TO-DO: Move into more general function
				else if (type == FIRE && substanceTypes[tileType].effects[1].has(SMOKE))  {
					if (currentLevel.getTileType(1, checkTile) == SMOKE) {
						let quant = currentLevel.getTileQuantity(1, checkTile);
						currentLevel.setTileQuantity(1, checkTile, quant + Math.random());
					} else if (currentLevel.getTileType(0, checkTile) == WATER) {
						currentLevel.setTileType(1, checkTile, STEAM);
					} 
					else if (currentLevel.getTileType(1, checkTile) < 1) {
						currentLevel.setTileType(1, checkTile, SMOKE);
					}
				}
			} else {
				elementInteraction(checkTile, type);
			}
		}
	}
}

function elementEffectOnTile(tileIndex, elementType) {
	let lifeTime = currentLevel.getTileLife(1, tileIndex);
	switch (elementType) {
		case FIRE: //fire
			currentLevel.setTileLife(1, tileIndex, lifeTime - Math.random() / 2);
			let tileHP = currentLevel.getTileLife(0, tileIndex);
			currentLevel.setTileLife(0, tileIndex, tileHP - Math.random());
			if (tileHP <= 0) currentLevel.setTileType(0, tileIndex, GRND);
			break;
		case WATER:
			if (elementType == FIRE) currentLevel.setTileType(1, tileIndex, STEAM);
			break;
		case SHOCK:
			break;
		case SMOKE:
			currentLevel.setTileLife(1, tileIndex, lifeTime - Math.random() / 2);
			break;
		case STEAM:
			currentLevel.setTileLife(1, tileIndex, lifeTime - Math.random() / 2);
			break;
		default:
			break;
	}
}

function elementSpread(tileFrom, tileTo, element) {
	let toType = currentLevel.getTileType(1, tileTo);
	if (toType != element && toType > 1) return;
	let fromQuant = currentLevel.getTileQuantity(1, tileFrom);
	switch (element) {
		case FIRE: //fire
			if (Math.random() > 0.98) currentLevel.setTileType(1, tileTo, element);
			break;
		case WATER: {//water
			if (fromQuant > 1) {
				let toQuant = (currentLevel.getTileType(1, tileTo) == element) ? currentLevel.getTileQuantity(1, tileTo) : 0;
				if (!toQuant) currentLevel.setTileType(1, tileTo, element);
				currentLevel.setTileQuantity(1, tileTo, toQuant + 1);
				currentLevel.setTileQuantity(1, tileFrom, fromQuant - 1);
			}
			break;
		}
		case SHOCK:
			break;
		case SMOKE: {
			const spreadQuant = 2;
			if (fromQuant > spreadQuant && Math.random() > 0.5) {
				let toQuant = (currentLevel.getTileType(1, tileTo) == element) ? currentLevel.getTileQuantity(1, tileTo) : 0;
				if (!toQuant) currentLevel.setTileType(1, tileTo, element);
				currentLevel.setTileQuantity(1, tileTo, toQuant + spreadQuant);
				currentLevel.setTileQuantity(1, tileFrom, fromQuant - spreadQuant);
			}
		}
			break;
		case STEAM: {
				const spreadQuant = 2;
				if (fromQuant > spreadQuant) {
					let toQuant = (currentLevel.getTileType(1, tileTo) == element) ? currentLevel.getTileQuantity(1, tileTo) : 0;
					if (!toQuant) currentLevel.setTileType(1, tileTo, element);
					currentLevel.setTileQuantity(1, tileTo, toQuant + spreadQuant);
					currentLevel.setTileQuantity(1, tileFrom, fromQuant - spreadQuant);
				}
			}
			break
		default:
			break;
	}
}

function elementInteraction(tile, sourceElement) {
	let tileType = currentLevel.getTileType(0, tile);
	let targetElement = currentLevel.getTileType(1, tile);

	if (sourceElement <= 0 || targetElement <= 0) return;

	let result;
	if (sourceElement < effectMatrix.length && targetElement < effectMatrix[FIRE].length) result = effectMatrix[sourceElement][targetElement];
	else {
		console.log('invalid substance type for interaction');
		result = NOEFF;
	}

	if (result != NOEFF && substanceTypes[tileType].effects[1].has(result)) {
		currentLevel.setTileType(1, tile, result);
	}
}
