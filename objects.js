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

	timer = 1;
	rotation = new Vector2(0, 1);


	constructor(x, y) {
		this.position = new Vector2(x, y);
	}

	use() {
		if (!this.active) {
			this.timer = 1;
		}
	}

	onCollision(withObject) {
		if (withObject == player) {
			this.timer = 0;
			player.held = this;
			
			let index = currentLevel.objects.indexOf(this);
			if (index >= 0) currentLevel.objects.splice(index, 1);
		}
	}

	updateHeld() {
		if (!this.active) return;
		this.timer++;
		if (this.timer == this.useTime - (this.useTime / 10)) {
			let ix = player.x + player.rotation.x * this.size; iy = player.y + player.rotation.y * this.size;
			let index = tileAtCoords(ix, iy);
			let tiles = tilesNearIndex(index);
			for (let tile of tiles) {
				let type = currentLevel.getType(0, tile);
				if (type == WOOD || type == CNCRT || type == GLASS) currentLevel.addLife(0, tile, -25);
			}
		} else if (this.timer == this.useTime + 8) {
			this.timer = 0;
		}
	}

	draw() {
		ctx.translate(this.position.x, this.position.y);
		ctx.fillStyle = substColors[WOOD];
		ctx.fillRect(-this.size / 12, -this.size / 2, this.size / 6, this.size);
		ctx.fillStyle = substColors[METAL];
		ctx.fillRect(-this.size / 3, -this.size / 2, this.size / 1.5, this.size / 4);
		ctx.translate(-this.position.x, -this.position.y)
	}
 
	drawHeld() {
		if (this.active) {
			let offset = lerp(Math.PI, 0, smoothStop(clamp(this.timer, 0, this.useTime) / this.useTime, 3));
			let angle = player.rotation.rotate(offset).angle;
			ctx.translate(player.x, player.y);
			ctx.rotate(angle + Math.PI/2);
	
			ctx.fillStyle = substColors[WOOD];
			ctx.fillRect(-this.size / 12, -this.size, this.size / 6, this.size);
			ctx.fillStyle = substColors[METAL];
			ctx.fillRect(-this.size / 3, -this.size, this.size / 1.5, this.size / 4);
			
			ctx.rotate(-(angle + Math.PI/2));
			ctx.translate(-player.x, -player.y);
		}
	}

	get active() { return this.timer > 0;}
	get width() { return this.size; }
	get height() { return this.size; }
	get x() { return this.position.x };
	get y() { return this.position.y };
	set x(value) { this.position.x = value };
	set y(value) { this.position.y = value };
}