class SubstanceLayer {
	constructor(size) {
		this._stride = 3; /*1: Effect Type, 2: quantity, 3: Lifetime */
		this.grid = new Array(size * this._stride);
		this.grid.fill(0);
	}

	spawnTile(index, type) {
		let typeIndex = index * this._stride;
		if (this.grid[typeIndex] == type && substanceTypes[type]) {
			this.grid[++typeIndex] += substanceTypes[type].quantity * Math.random() / 2;
		} else {
			this.grid[typeIndex++] = type;
			if (substanceTypes[type]) this.grid[typeIndex++] = substanceTypes[type].quantity;
			if (substanceTypes[type]) this.grid[typeIndex] = substanceTypes[type].life;
		}
	}

	getType(levelIndex) {
		return this.grid[levelIndex * this._stride];
	}

	setType(levelIndex, type) {
		this.grid[levelIndex * this._stride] = type;
	}

	getQuantity(levelIndex) {
		return this.grid[levelIndex * this._stride + 1];
	}

	setQuantity(levelIndex, value) {
		this.grid[levelIndex * this._stride + 1] = value;
	}

	getLife(levelIndex) {
		return this.grid[levelIndex * this._stride + 2];
	}

	setLife(levelIndex, value) {
		this.grid[levelIndex * this._stride + 2] = value;
	}

	resetTile(index) {
		let tileIndex = index * this._stride;
		this.grid[tileIndex++] = GRND;
		this.grid[tileIndex++] = GRND;
		this.grid[tileIndex] = GRND;
	}

	draw() {
		for (let e = 0; e < this.length; e++) {
			let type = this.getType(e);
			if (type <= 0) continue;
			ctx.fillStyle = substColors[type];
			let x = e % currentLevel.width, y = (e - x) / currentLevel.width * TILE_SIZE;
			x *= TILE_SIZE;
			if (pointInView(x, y)) {
				ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
			}
		}
	}

	get length() { return this.grid.length / this._stride; }
}

class LevelExit extends GameObject {
	size = (TILE_SIZE * ROOM_SIZE) / 4;
	type = 'circle';
	physics = 'static';

	constructor(x, y){
		super(x, y);
	}

	onCollision(withObject) {
		if (player.loot >= 404 && withObject == player) {
			newGame();
		}
	}

	draw() {
		if (objectInView(this.x, this.y, this.size, this.size)) {
			ctx.fillStyle = 'black';
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.size, 0, Math.PI*2, false);
			ctx.fill();
		}

		if (player.loot >= 404) {
			ctx.fillStyle = '#ffca00';
			let mt = ctx.measureText('EXIT');
			let width = mt.width;
			let height = mt.actualBoundingBoxAscent + mt.actualBoundingBoxDescent;
			let x = clamp(this.x, panX + width/2, panX + w - width/2);
			let y = clamp(this.y, panY + height/2, panY + h - height/2);
				
			ctx.fillText('EXIT', x, y);
		}
	}

	get radius() { return this.size; }
}

class GameLevel {
	_layers = [];
	objects = [];
	width = 0;
	height = 0;
	start = new Vector2(TILE_SIZE + (TILE_SIZE * ROOM_SIZE)/2, TILE_SIZE + (TILE_SIZE * ROOM_SIZE)/2);
	exit = new LevelExit(0, TILE_SIZE + (TILE_SIZE * ROOM_SIZE)/4);

	constructor(width, height) {
		this.width = width;
		this.height = height;
		this._layers[0] = new SubstanceLayer(width * height); //ground
		this._layers[1] = new SubstanceLayer(width * height); //air
		this.start.x = this.exit.x = width * TILE_SIZE / 2;
		this.start.y = height * TILE_SIZE - (TILE_SIZE * ROOM_SIZE)/4 - TILE_SIZE;
		this.objects.push(this.exit);
	}

	spawnTile(index, type) {
		//TO DO check for legal tile
		let layer = (substanceTypes[type].state < 3) ? 0 : 1;
		
		let groundType = this.getType(0, index);
		let airType = this.getType(1, index);
		if ((substanceTypes[groundType].effects.has(type)) &&
			(airType <= GRND || substanceTypes[airType].effects.has(type)) ) {
			this._layers[layer].spawnTile(index, type);
		} else {
			elementInteraction(type, index);
		}
	}

	getType(layer, index) {
		return this._layers[layer].getType(index);
	}

	setType(layer, index, type) {
		this._layers[layer].setType(index, type);
	}

	addLife(layer, index, life) {
		let cLife = this.getLife(layer, index);
		this.setLife(layer, index, cLife + life);
	}

	getLife(layer, index) {
		return this._layers[layer].getLife(index);
	}

	setLife(layer, index, life) {
		this._layers[layer].setLife(index, life);
	}

	addQuantity(layer, index, quantity) {
		let cQuant = this.getQuantity(layer, index);
		this.setQuantity(layer, index, cQuant + quantity);
	}

	getQuantity(layer, index) {
		return this._layers[layer].getQuantity(index);
	}

	setQuantity(layer, index, quantity) {
		this._layers[layer].setQuantity(index, quantity);
	}

	resetTile(layer, index) {
		this._layers[layer].resetTile(index);
	}

	draw() {
		let yMin = Math.floor(panY / TILE_SIZE), yMax = yMin + Math.floor(canvas.height / TILE_SIZE) + 1;
		yMin = clamp(yMin, 0, currentLevel.height), yMax = clamp(yMax, 0, currentLevel.height - 1);
		let xMin = Math.floor(panX / TILE_SIZE), xMax = xMin + Math.floor(canvas.width / TILE_SIZE) + 1;
		xMin = clamp(xMin, 0, currentLevel.height), xMax = clamp(xMax, 0, currentLevel.height - 1);
		let tile;
		for (let y = yMin; y <= yMax; y++) {
			tile = y * currentLevel.width
			for (let x = xMin; x <= xMax; x++) {
				let air = this.getType(1, tile + x);
				let ground = this.getType(0, tile + x);
				let color;
				if (air > GRND) {
					color = (ground > GRND) ? averageHexColors([substColors[air], substColors[ground]]) : substColors[air];
				} else if (ground > GRND) color = substColors[ground];
	
				if (color) {
					ctx.fillStyle = color;
					ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
				}
			}
		}
		this.drawStart();
		//this.exit.draw();
	}

	drawLayer(layer) {
		this._layers[layer].draw();
	}

	drawStart() {
		const SIZE = (TILE_SIZE * ROOM_SIZE) / 4;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = 'white';
		if (objectInView(this.start.x, this.start.y, SIZE, SIZE)) {
			ctx.fillStyle = 'black';
			ctx.beginPath();
			ctx.arc(this.start.x, this.start.y, SIZE, 0, Math.PI*2, false);
			ctx.fill();
			ctx.fillStyle = 'white';
			ctx.fillText('START', this.start.x, this.start.y);
		}
	}

	get length() { return this.width * this.height };
}

function generateLevel(width, height) {
	let rooms = [];
	let index = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (x == 0 || y == 0 || x == width - 1 || y == height - 1) {
				rooms.push([0,0,0,0]);				
			}
			else {
				let width = Math.floor(MIN_ROOM_SIZE + Math.random() * (ROOM_SIZE - MIN_ROOM_SIZE)),
					height = Math.floor(MIN_ROOM_SIZE + Math.random() * (ROOM_SIZE - MIN_ROOM_SIZE)),
					left = Math.floor(Math.random() * (ROOM_SIZE - width)),
					top = Math.floor(Math.random() * (ROOM_SIZE - height));
			
				rooms.push([left, top, left + width, top + height]);
			}
			index++;
		}
	}

	return generateTileGrid(rooms, width, height);
}

function generateTileGrid(rooms, width, height) {
	let lootLeft = 404;
	let level = new GameLevel(width * ROOM_SIZE, height * ROOM_SIZE);
	//Iterate through one 16x16 room at a time
	let roomIndex = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let room = width * y + x;
			if (rooms[room][3] == 0) {
				roomIndex += ROOM_SIZE;
				continue;
			}

			let wallType = WALL_SUBST[Math.floor(Math.random() * WALL_SUBST.length)];
			let left = rooms[room][0], top = rooms[room][1], right = rooms[room][2], bottom = rooms[room][3];
			let openings = createOpenings(rooms[room]);
			let di = Math.floor(Math.random() * openings.length);
			let door = openings[di];
			for (let ry = top; ry < bottom; ry++) {
				for (let rx = left; rx < right; rx++) {
					if (Math.abs(rx - door[0]) <= 1 && Math.abs(ry - door[1]) <= 1) continue;
					//Offset room index [left, top] by tile index
					let tileIndex = roomIndex + (ry * ROOM_SIZE * width) + rx;
					if (rx >= left || ry >= top || rx <= right - 1 || ry <= bottom - 1) {
						if (rx == left || ry == top || rx == right - 1 || ry == bottom - 1) {
							level.setType(0, tileIndex, wallType);
							level.setQuantity(0, tileIndex, 1);
							level.setLife(0, tileIndex, substanceTypes[wallType].life);
						} else if (Math.random() > 0.9) {
							let lx = tileIndex % level.width, ly = (tileIndex - x) / level.width;
							let loot = new LootPiece(Math.floor(lx) * TILE_SIZE, Math.floor(ly) * TILE_SIZE);
							loot.x += loot.size;
							loot.y += loot.size;
							
							level.objects.push(loot);
							lootLeft -= loot.value;
						}
					}
				}
			}
			//Make 3 remaining openings into windows
			for (let o = 0; o < openings.length; o++) {
				if (wallType != METAL && o != di) {
					let window = openings[o];
					let wIndex = roomIndex + (window[1] * ROOM_SIZE * width) + window[0];
					level.setType(0, wIndex, GLASS);
					level.setLife(0, wIndex, substanceTypes[GLASS].life);
				}
			}
			
			roomIndex += ROOM_SIZE;
		}
		//Skip the full row of rooms
		roomIndex += ROOM_SIZE * width * ROOM_SIZE;
	}

	//Random start point
	//Random exit point

	while(lootLeft > 0) {
		let x = y = TILE_SIZE;
		if (Math.random() > 0.6) {
			x += Math.random() * ((ROOM_SIZE * TILE_SIZE) - TILE_SIZE), y += Math.random() * (level.height * TILE_SIZE - TILE_SIZE);
		} else {
			x += Math.random() * (level.width * TILE_SIZE - TILE_SIZE) , y += Math.random() * (ROOM_SIZE * TILE_SIZE - TILE_SIZE);
		}
		
		x -= x % TILE_SIZE;
		y -= y % TILE_SIZE;
		
		if (Math.random() > 0.5) x = ((1 + level.width - 2) * TILE_SIZE) - x;
		if (Math.random() > 0.5) y = ((1 + level.height - 2) * TILE_SIZE) - y;
		level.objects.push(new LootPiece(x, y));
		lootLeft--;
	}

	return sealLevel(level);
}

function createOpenings(room) {
	let doors = [];

	//left
	doors[0] = [room[0], Math.floor((room[1] + room[3]) / 2)];
	//right
	doors[1] = [room[2]-1, Math.floor((room[1] + room[3]) / 2)];
	//top
	doors[2] = [Math.floor((room[0] + room[2]) / 2), room[1]];
	//Bottom
	doors[3] = [Math.floor((room[0] + room[2]) / 2), room[3]-1];

	return doors;
}

function sealLevel(level) {
	let index = 0;
	for (let y = 0; y < level.height; y++) {
 		for (let x = 0; x < level.width; x++) {
			 if (x == 0 || y == 0 || x == level.width - 1 || y == level.height - 1) {
				level.setType(0, index, METAL);
				level.setQuantity(0, index, 1);
				level.setLife(0, index, substanceTypes[METAL].life);
			 }
			 index++;
		 }
	}

	return level;
}

//NOTE: This is problematic for objects larger than TILE_SIZE
function tilesNearPosition(x, y) {
	let index = tileAtCoords(x, y);
	return tilesNearIndex(index);
}

function tilesNearIndex(index) {
	let tiles = []; 
	for (let y = -1; y < 2; y++) {
		for (let x = -1; x < 2; x++) {
			let checkTile = index + (currentLevel.width * y);
			if (Math.floor(checkTile / currentLevel.width) !=  Math.floor((checkTile += x) / currentLevel.width)) continue;
			if (checkTile < 0 || checkTile > currentLevel.length) continue;
			tiles.push(checkTile);
		}
	}
	return tiles;
}

function tileAtCoords(x, y) {
	return Math.floor(Math.floor(y / TILE_SIZE) * currentLevel.width + Math.floor(x / TILE_SIZE));
}