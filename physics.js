/*
	Element tiles:
		-1 hp per tick
		1 hp elemental damage to adjacent tiles per tick
			Only damage weak tiles (i.e. fire damages wood, but not concrete)
			Tiles inherit elemental effect at certain HP threshold (50%?)
			If adjacent tile already has elemental effect, check for interactions (electricity + water)
			If adjacent tile is empty, check for fill effect (fire produces smoke)	
*/
const NOEFF = -1; //No effect
const FIRE = 0;
const WATER = 1;
const SHOCK = 2;
const SMOKE = 3;
const GAS = 4;
const STEAM = 5;
const E_WAT = 6; //Electrified water
const E_STM = 7; //Electrified steam

//TO-DO: Separate life and quantity
const effectTypes = [
	{life: 300, ondeath: 3, },					//0 fire
	{life: 300, ondeath: -1, }, 				//1 water
	{life: 300, ondeath: -1, },					//2 electricity
	{life: 600, ondeath: -1, },  				//3 smoke
	{life: 300, ondeath: -1, },					//4 gas
	{life: 900, ondeath: -1, },					//5 steam
	{life: 300, ondeath: -1, }, 				//6 electrified water
	{life: 300, ondeath: -1, }, 				//7 electrified steam
];

//[firstEffect][secondEffect] = result
const effectMatrix 	= [];
effectMatrix[FIRE] 	= [NOEFF, STEAM, NOEFF, SMOKE, FIRE , NOEFF, NOEFF];
effectMatrix[WATER] = [STEAM, NOEFF, E_WAT, NOEFF, NOEFF, NOEFF, E_WAT];
effectMatrix[SHOCK] = [NOEFF, E_WAT, NOEFF, NOEFF, NOEFF, NOEFF, E_WAT];
effectMatrix[SMOKE] = [NOEFF, NOEFF, NOEFF, NOEFF, NOEFF, NOEFF, NOEFF];
effectMatrix[GAS] 	= [NOEFF, NOEFF, NOEFF, NOEFF, NOEFF, NOEFF, NOEFF];
effectMatrix[STEAM] = [NOEFF, NOEFF, NOEFF, NOEFF, NOEFF, NOEFF, NOEFF];
effectMatrix[E_WAT] = [NOEFF, E_WAT, NOEFF, NOEFF, NOEFF, NOEFF, NOEFF];
effectMatrix[E_STM] = [NOEFF, NOEFF, NOEFF, NOEFF, NOEFF, NOEFF, NOEFF];

const effectColors = ['red', '#2020ff', 'yellow', '#090909', 'green', '#c0f0ff', 'yellow', 'orange'];

class LevelEffects {
	constructor(size) {
		this._stride = 2; /*1: Effect Type, 2: Lifetime */
		this.grid = [];
		this.grid.length = size * this._stride;
		this.grid.fill(-1);
	}

	getType(levelIndex) {
		return this.grid[levelIndex * this._stride];
	}

	setType(levelIndex, type) {
		this.grid[levelIndex * this._stride] = type;
		if (effectTypes[type]) this.setLifeTime(levelIndex, effectTypes[type].life);
	}

	getLifetime(levelIndex) {
		return this.grid[levelIndex * this._stride + 1];
	}

	setLifeTime(levelIndex, value) {
		this.grid[levelIndex * this._stride + 1] = value;
	}

	draw() {
		ctx.globalAlpha = 0.4;
		let effects = currentLevel.effects;
		for (let e = 0; e < currentLevel.grid.length; e++) {
			let type = effects.getType(e);
			if (type < 0) continue;
			ctx.fillStyle = effectColors[type];
			let x = e % currentLevel.width, y = (e - x) / currentLevel.width;
			ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
		}
		ctx.globalAlpha = 1;
	}

	get length() { return this.grid.length; }
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
		let tileType = currentLevel.grid[tile];
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
	let effects = currentLevel.effects;
	for (let e = currentLevel.grid.length - 1; e >= 0; e--) {
		let type = effects.getType(e);
		let lifeTime = effects.getLifetime(e);
		if (type < 0) continue; //No effect in this tile

		//TO-DO: Move to elementEffectOnTile
		if (lifeTime <= 0 || currentLevel._tileHP[e] <= 0) {
			currentLevel._tileHP[e] = 100;
			let deathEffect = effectTypes[type].ondeath
			if (deathEffect >= 0) effects.setType(e, deathEffect);
			else effects.setType(e, -1);
			continue;
		}

		elementEffectOnTile(e, type);

		let checkTiles = tilesNearIndex(e);
		checkTiles = shuffle(checkTiles);
		for (let checkTile of checkTiles) {
			if (checkTile == e) continue; //skip current tile
			let tileType = currentLevel.grid[checkTile];
			let ctType = effects.getType(checkTile);
			if (ctType == NOEFF || ctType == type) {
				if (tileTypes[tileType].effects.has(type)) { elementSpread(e, checkTile, type);}
				//TO-DO: Move into more general function
				else if (type == FIRE && tileType == 0) effects.setType(checkTile, SMOKE);
			} else {
				elementInteraction(checkTile, type);
			}
		}
	}
}

function elementEffectOnTile(tileIndex, elementType) {
	let effects = currentLevel.effects;
	let lifeTime = effects.getLifetime(tileIndex);
	switch (elementType) {
		case FIRE: //fire
			effects.setLifeTime(tileIndex, lifeTime - Math.random());
			currentLevel._tileHP[tileIndex] -= Math.random();
			if (currentLevel._tileHP[tileIndex] <= 0) currentLevel.grid[tileIndex] = 0;
			break;
		case WATER:
			break;
		case SHOCK:
			break;
		case SMOKE:
			effects.setLifeTime(tileIndex, lifeTime - Math.random() / 2);
			break;
		case STEAM:
			effects.setLifeTime(tileIndex, lifeTime - Math.random() / 2);
			break;
		default:
			break;
	}
}

function elementSpread(tileFrom, tileTo, element) {
	let effects = currentLevel.effects;
	switch (element) {
		case FIRE: //fire
			if (effects.getType(tileTo) < 0 && Math.random() > 0.98) effects.setType(tileTo, element);
			break;
		case WATER: {//water
			let fromLife = effects.getLifetime(tileFrom);
			if (fromLife > 1) {
				let toLife = (effects.getType(tileTo) == element) ? effects.getLifetime(tileTo) : 0;
				if (!toLife) effects.setType(tileTo, element);
				effects.setLifeTime(tileTo, toLife + 1);
				effects.setLifeTime(tileFrom, fromLife - 1);
			}
			break;
		}
		case SHOCK:
			break;
		case SMOKE: {
			let fromLife = effects.getLifetime(tileFrom);
			if (fromLife > 4) {
				let toLife = (effects.getType(tileTo) == element) ? effects.getLifetime(tileTo) : 0;
				if (!toLife) effects.setType(tileTo, element);
				effects.setLifeTime(tileTo, toLife + 4);
				effects.setLifeTime(tileFrom, fromLife - 4);
			}
		}
			break;
		case STEAM: {
				let fromLife = effects.getLifetime(tileFrom);
				if (fromLife > 4) {
					let toLife = (effects.getType(tileTo) == element) ? effects.getLifetime(tileTo) : 0;
					if (!toLife) effects.setType(tileTo, element);
					effects.setLifeTime(tileTo, toLife + 4);
					effects.setLifeTime(tileFrom, fromLife - 4);
				}
			}
			break
		default:
			break;
	}
}

function elementInteraction(tile, sourceElement) {
	let effects = currentLevel.effects;
	let tileType = currentLevel.grid[tile];
	let targetElement = effects.getType(tile);
	let result = effectMatrix[sourceElement][targetElement];

	if (result != NOEFF && tileTypes[tileType].effects.has(result)) {
		effects.setType(tile, result);
	}
}
