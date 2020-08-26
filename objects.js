class LootPiece {
	active = true;
	type = 'rect';
	physics = 'dynamic';

	constructor(x, y) {
		this.position = new Vector2(x, y);
		this.size = TILE_SIZE / 2;
	}

	onCollision(withObject) {
		if (!this.active) return;
		if (withObject == player) {
			player.loot++;
			this.active = false;
		}
	}

	draw() {
		if (!this.active || !objectInview(this.x, this.y)) return;
		ctx.fillStyle = 'gold';
		ctx.fillRect(this.position.x - this.size / 2, this.position.y - this.size / 2, this.size, this.size);
	}

	get width() { return this.size; }
	get height() { return this.size; }
	get x() { return this.position.x };
	get y() { return this.position.y };
	set x(value) { this.position.x = value };
	set y(value) { this.position.y = value };
}

class Hammer {
	size = TILE_SIZE * 2;
	type = 'rect';
	physics = 'dynamic';
	durability = 100;
	useTime = 20;

	active = true;
	timer = 0;
	rotation = new Vector2(0, 1);


	constructor(x, y) {
		this.position = new Vector2(x, y);
	}

	use() {
		if (!this.active) {
			this.timer = 0;
			this.active = true;
		}
	}

	onCollision(withObject) {
		if (withObject == player) {
			this.active = false;
			player.held = this;
			
			let index = currentLevel.objects.indexOf(this);
			if (index >= 0) currentLevel.objects.splice(index, 1);
		}
	}

	updateHeld() {
		if (!this.active) return;
		this.timer++;
		if (this.timer >= this.useTime) {
			let ix = player.x + player.rotation.x * this.size; iy = player.y + player.rotation.y * this.size;
			let index = tileAtCoords(ix, iy);
			let tiles = tilesNearIndex(index);
			for (let tile of tiles) {
				let type = currentLevel.getType(0, tile);
				if (type == WOOD || type == CNCRT || type == GLASS) currentLevel.addLife(0, tile, -25);
			}
			this.timer = 0;
			this.active = false;
		}
	}

	draw() {
		ctx.fillStyle = substColors[WOOD];
		ctx.fillRect(this.position.x - this.size / 8, this.position.y - this.size / 2, this.size / 4, this.size);
		ctx.fillStyle = substColors[METAL];
		ctx.fillRect(this.position.x - this.size / 2, this.position.y - this.size / 1.25, this.size, this.size / 4);
	}

	drawHeld() {
		let offset = lerp(Math.PI, 0, smoothStop(this.timer / this.useTime, 3));
		let angle = player.rotation.rotate(offset).angle;
		console.log(offset);
		ctx.translate(player.x, player.y);
		ctx.rotate(angle + Math.PI/2);

		ctx.fillStyle = substColors[WOOD];
		ctx.fillRect(-this.size / 8, -this.size, this.size / 4, this.size);
		ctx.fillStyle = substColors[METAL];
		ctx.fillRect(-this.size / 2, -this.size * 1.25, this.size, this.size / 4);
		
		ctx.rotate(-(angle + Math.PI/2));
		ctx.translate(-player.x, -player.y);
	}

	get width() { return this.size; }
	get height() { return this.size; }
	get x() { return this.position.x };
	get y() { return this.position.y };
	set x(value) { this.position.x = value };
	set y(value) { this.position.y = value };
}