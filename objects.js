class GameObject {
	size = TILE_SIZE;
	position = new Vector2(0, 0);
	velocity = new Vector2(0, 0);
	type = 'rect';
	physics = 'dynamic';

	constructor(x, y) {
		this.position.x = x;
		this.position.y = y;
	}

	draw(x, y) {}
	drawLabel(x, y) {
		ctx.fillStyle = 'white';
		ctx.font = '16px Arial';
		ctx.fillText(this.constructor.name, x, y - TILE_SIZE * 2);
	}
	drawHeld() {}
	updateHeld() {}
	onCollision(withObject) {}

	get width() { return this.size; }
	get height() { return this.size; }
	get x() { return this.position.x; }
	get y() { return this.position.y; }
	set x(value) { this.position.x = value; }
	set y(value) { this.position.y = value; }
}

class LootPiece extends GameObject{
	active = true;
	color = '#ffca00';
	value = 4;

	constructor(x, y) {
		super(x, y);
		this.size = TILE_SIZE / 2;
	}

	onCollision(withObject) {
		if (this.active && withObject == player) {
			player.loot += this.value;
			this.active = false;
		}
	}

	draw(x, y) {
		if (this.active && pointInView(x, y)) {
			let tile = tileAtCoords(x, y);
			let tileType = currentLevel.getType(1, tile);
			ctx.fillStyle = tileType > GRND ? averageHexColors([substColors[tileType], this.color]) : this.color;
			ctx.fillRect(x - this.size / 2, y - this.size / 2, this.size, this.size);
		}
	}
}

class Hammer extends GameObject {
	durability = 100;
	useTime = 20;
	timer = 0;
	rotation = new Vector2(0, 1);

	constructor(x, y) {
		super(x, y);
		this.size = TILE_SIZE * 2;
	}

	use() {
		if (this.timer == 0) {
			this.timer = 1;
		}
	}

	onCollision(withObject) {
		if (withObject == player) {
			player.pickups.push(this);
		}
	}

	updateHeld() {
		if (!this.timer) return;
		this.timer++;
		if (this.timer == Math.floor(this.useTime / 2)) {
			let ix = player.x + player.rotation.x * this.size, iy = player.y + player.rotation.y * this.size;
			let index = tileAtCoords(ix, iy);
			let tiles = tilesNearIndex(index);
			for (let tile of tiles) {
				let type = currentLevel.getType(0, tile);
				if (type == WOOD || type == CNCRT || type == GLASS) {
					currentLevel.addLife(0, tile, -25);
				}
			}
		} else if (this.timer == this.useTime + 8) {
			this.timer = 0;
		}
	}

	draw(x, y) {
		let tile = tileAtCoords(x, y);
		let tileType = currentLevel.getType(1, tile);
		ctx.translate(x, y);
		ctx.fillStyle = tileType > GRND ? averageHexColors([substColors[tileType], substColors[WOOD]]) : substColors[WOOD];
		ctx.fillRect(-this.size / 12, -this.size / 2, this.size / 6, this.size);
		ctx.fillStyle = tileType > GRND ? averageHexColors([substColors[tileType], substColors[METAL]]) : substColors[METAL];
		ctx.fillRect(-this.size / 3, -this.size / 2, this.size / 1.5, this.size / 4);
		ctx.translate(-x, -y)
	}
 
	drawHeld() {
		if (this.timer) {
			let offset = lerp(Math.PI, 0, smoothStop(clamp(this.timer, 0, this.useTime) / this.useTime, 3));
			let angle = player.rotation.rotate(offset).angle;
			
			ctx.translate(player.x, player.y);
			ctx.rotate(angle + Math.PI/2);
			this.draw(0, -this.size/2)
			ctx.rotate(-(angle + Math.PI/2));
			ctx.translate(-player.x, -player.y);
		}
	}
}

class FireBomb extends GameObject {
	active = false;
	constructor(x, y) {
		super(x, y);
		this.size = TILE_SIZE;
	}

	use() {
		this.position.x = player.position.x + player.rotation.x * (player.size + this.size);
		this.position.y = player.position.y + player.rotation.y * (player.size + this.size);
		this.velocity = player.velocity.add(player.rotation.multiply(10));
		
		if (!objectTileCollision(this)) {
			currentLevel.objects.push(this);
			let index = player.items.indexOf(this);
			if (index >= 0) player.items[index] = null;
		} 
	}

	onCollision(withObject) {
		if (withObject == player) {
			player.pickups.push(this);
		} else if (this.active) {
			let tiles = tilesNearPosition(this.x, this.y);
			for (let tile of tiles) {
				currentLevel.spawnTile(tile, OIL);
				currentLevel.spawnTile(tile, FIRE);
			}
			let index = currentLevel.objects.indexOf(this);
			if (index >= 0) currentLevel.objects.splice(index, 1);
		}
	}

	draw(x, y) {
		const capHeight = this.size/3;
		ctx.fillStyle = 'red';
		ctx.fillRect(x - this.size/4, y - this.size/2, this.size/2, capHeight);
		ctx.fillStyle = 'olive';
		ctx.fillRect(x - this.size/4, y - this.size/2 + capHeight, this.size/2, this.size - capHeight);
	}

	drawHeld() {
		return;
	}

	get width() { return this.size/2; }
}

class Grenade extends GameObject {
	_blastRadius = 6;
	active = false;
	type = 'circle';
	constructor(x, y) {
		super(x, y);
	}

	use() {
		this.position.x = player.position.x + player.rotation.x * (player.size + this.size);
		this.position.y = player.position.y + player.rotation.y * (player.size + this.size);
		this.velocity = player.velocity.add(player.rotation.multiply(10));
		
		if (!objectTileCollision(this)) {
			currentLevel.objects.push(this);
			let index = player.items.indexOf(this);
			if (index >= 0) player.items[index] = null;
		} 
	}

	onCollision(withObject) {
		if (withObject == player) {
			player.pickups.push(this);
		} else if (this.active) {
			let tile = tileAtCoords(this.x, this.y);
			for (let y = -this._blastRadius + 1; y < this._blastRadius; y++) {
				for (let x = -this._blastRadius + 1; x < this._blastRadius; x++) {
					if (Math.abs(x) + Math.abs(y) > this._blastRadius) continue;
					let checkTile = tile + (y * currentLevel.width) + x;
					currentLevel.setType(1, checkTile, FIRE);
					currentLevel.addLife(0, checkTile, -200);
				}
			}
				
			let index = currentLevel.objects.indexOf(this);
			if (index >= 0) currentLevel.objects.splice(index, 1);
		}
	}

	draw(x, y) {
		ctx.fillStyle = 'olive';
		ctx.beginPath();
		ctx.arc(x, y, this.radius, 0, Math.PI*2, false);
		ctx.fill();
	}

	get radius() { return this.size/2; }
}

class Balloon extends GameObject {
	_blastRadius = 4;
	active = false;
	type = 'circle';
	constructor(x, y) {
		super(x, y);
	}

	use() {
		this.position.x = player.position.x + player.rotation.x * (player.size + this.size);
		this.position.y = player.position.y + player.rotation.y * (player.size + this.size);
		this.velocity = player.velocity.add(player.rotation.multiply(10));
		
		if (!objectTileCollision(this)) {
			currentLevel.objects.push(this);
			let index = player.items.indexOf(this);
			if (index >= 0) player.items[index] = null;
		} 
	}

	onCollision(withObject) {
		if (withObject == player) {
			player.pickups.push(this);
		} else if (this.active) {
			let tiles = tilesNearPosition(this.x, this.y);
			for (let tile of tiles) {
				currentLevel.spawnTile(tile, WATER);
			}
				
			let index = currentLevel.objects.indexOf(this);
			if (index >= 0) currentLevel.objects.splice(index, 1);
		}
	}

	draw(x, y) {
		ctx.fillStyle = 'blue';
		ctx.beginPath();
		ctx.arc(x, y, this.radius, 0, Math.PI*2, false);
		ctx.fill();
	}

	get radius() { return this.size/2; }
}