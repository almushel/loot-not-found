const NOEFF = -1; //No effect
const GRND = 0;
const CNCRT = 1;
const WOOD = 2;
const METAL = 3;
const GLASS = 4;
const WATER = 5;
const BLOOD = 6;
const OIL = 7;
const ICE = 8;

const FIRE = 10;
const SMOKE = 11;
const GAS = 12;
const STEAM = 13;
const SHOCK = 14;
const BMIST = 15; //Blood mist
const E_STM = 16; //Electrified steam

const ALL_SUBST = [GRND, CNCRT, WOOD, METAL, GLASS, WATER, FIRE, SMOKE, GAS, STEAM, SHOCK];

const EMPTY_SET = new Set();
const SOLID_SUBST_SET = new Set([GRND, CNCRT, WOOD, METAL, GLASS]);
const GAS_SUBST_SET = new Set([FIRE, SMOKE, GAS, STEAM, SHOCK]);
const ALL_SUBST_SET = new Set(ALL_SUBST);

/*
	Substances properties:
		state:
			1 (solid): no expansion, layer 0
			2 (liquid): slow expansion into empty space, layer 0
			3 (gas): faster expansion into empty space, layer 1
			4 (plasma): fastest exansion into vulnerable tiles, layer 1
		life: lifetime and/or durability of substance tile
		quantity: amount of substance in tile (used for expansion)
		decay: rate at which substance life counts down every frame
		ondeath: substance tile left behind when life reaches zero
		
*/

const substanceTypes = [];
//.effects[0] is ground layer .effect[1] is air layer
substanceTypes[GRND]  = {life: Infinity, quantity: 1, state: 0, effects: new Set([WATER, OIL, BLOOD, ICE, SMOKE, STEAM, GAS]), };
//liquid/solid
substanceTypes[CNCRT] = {life: 100, 	quantity: 1,  state: 1, effects: EMPTY_SET, 		ondeath: NOEFF, };
substanceTypes[WOOD]  = {life: 50, 		quantity: 1,  state: 1, effects: new Set([FIRE]), 	ondeath: NOEFF, };
substanceTypes[METAL] = {life: 200, 	quantity: 1,  state: 1, effects: new Set([SHOCK]), 	ondeath: NOEFF, };
substanceTypes[GLASS] = {life: 25, 		quantity: 1,  state: 1, effects: EMPTY_SET, 		ondeath: NOEFF, };
substanceTypes[WATER] = {life: 100, 	quantity: 64, state: 2, effects: new Set([SMOKE, STEAM, SHOCK, GAS, WATER, BLOOD]), ondeath: NOEFF, };
substanceTypes[OIL] =   {life: 200, 	quantity: 64, state: 2, effects: new Set([SMOKE, STEAM, GAS, FIRE, OIL]), ondeath: NOEFF, };
substanceTypes[BLOOD] = {life: 100, 	quantity: 64, state: 2, effects: new Set([SMOKE, STEAM, SHOCK, GAS, BLOOD]), ondeath: NOEFF, };
substanceTypes[ICE]   = {life: 100, 	quantity: 1,  state: 2, effects: new Set([SMOKE, STEAM, SHOCK, GAS]), ondeath: WATER, };
//energy/gas
substanceTypes[FIRE]  = {life: 60, 		quantity: 1,  state: 4, effects: new Set([WOOD]), 		ondeath: SMOKE, };
substanceTypes[SMOKE] = {life: 60, 		quantity: 32, state: 3, effects: new Set([SMOKE, GRND, WATER, BLOOD, OIL, FIRE]), 	ondeath: NOEFF, };
substanceTypes[GAS]   = {life: 60, 		quantity: 60, state: 3, effects: new Set([GAS, GRND, WATER]), 		ondeath: NOEFF, };
substanceTypes[STEAM] = {life: 120, 	quantity: 64, state: 3, effects: new Set([STEAM, GRND, WATER]), 		ondeath: NOEFF, };
substanceTypes[SHOCK] = {life: 60, 		quantity: 60, state: 4, effects: EMPTY_SET, 		ondeath: NOEFF, };

const substColors = new Array(substanceTypes.length).fill('#000000');
substColors[GRND] = '#202020';
substColors[CNCRT] = '#505050';
substColors[WOOD] = '#402920';
substColors[METAL] = '#707070';
substColors[GLASS] = 'skyblue';
substColors[WATER] = '#4040b0';
substColors[BLOOD] = '#330000';
substColors[ICE] = '#f0f0ff';
substColors[FIRE] = '#d03510';
substColors[SMOKE] = '#121212';
substColors[GAS] = 'green';
substColors[STEAM] = '#b0b0cf';
substColors[SHOCK] = 'yellow';
substColors[E_STM] = 'orange'; //Electrified steam

//Using map to set every index to a unique array filled with NOEFF instead of a bunch of references to the same array, which I would never want
const effectMatrix 	= new Array(substanceTypes.length).fill(null).map(() => {return new Array(substanceTypes.length).fill(NOEFF) });
//[firstEffect][secondEffect] = result
effectMatrix[FIRE][WATER] = STEAM;
effectMatrix[WATER][FIRE] = STEAM;
effectMatrix[FIRE][GRND] = SMOKE;
effectMatrix[FIRE][SMOKE] = SMOKE;

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
}

function physicsUpdate() {
	updateElements();
	let cv = control();
	if (cv) {
		player.rotation = player.rotation.add(cv).normalize();
		player.velocity = player.velocity.add(cv.multiply(player.acceleration));
	}
	player.position = player.position.add(player.velocity);
	player.velocity.length *= player.friction;

	objectTileCollision(player);
	for (let object of currentLevel.objects) {
		let collision = checkCollision(player.collider, object);
		if (collision.hit) {
			object.onCollision(player);
		}
	}
}

function updateElements() {
	for (let e = currentLevel.length - 1; e >= 0; e--) {
		for (let layer = 0; layer < 2; layer++) {
			let type = currentLevel.getType(layer, e);
			if (type <= GRND) continue; //No effect in this tile

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
	let tileHP = currentLevel.getLife(0, tileIndex);
	let state = substanceTypes[elementType].state;

	let decay = Math.random();
	if (state >= 3) { currentLevel.addLife(1, tileIndex, -decay);}
	if (state == 4) { 
		if (tileHP <= 0) {
			currentLevel.resetTile(0, tileIndex);
			currentLevel.resetTile(1, tileIndex);
		} else if (currentLevel.getType(0, tileIndex) > GRND) {
			currentLevel.addLife(0, tileIndex, -decay);
			currentLevel.addLife(1, tileIndex, decay);
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
