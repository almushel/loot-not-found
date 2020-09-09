class GameObject {
	_durability = 100;
	size = TILE_SIZE;
	position = new Vector2(0, 0);
	velocity = new Vector2(0, 0);
	type = 'rect';
	physics = 'dynamic';

	constructor(x, y) {
		this.position.x = x;
		this.position.y = y;
	}

	onInteract() {
		player.pickup(this);
	}

	draw(x, y) {}
	drawDurability(x, y) {
		if (this.durability == 0) {
			ctx.strokeStyle = 'red';
			ctx.beginPath();
			let length = this.size/3;
			ctx.moveTo(x - length, y - length);
			ctx.lineTo(x + length, y + length);
			ctx.moveTo(x + length, y - length);
			ctx.lineTo(x - length, y + length);
			ctx.stroke();
		}
	}
	drawLabel(x, y) {
		colorText(this.constructor.name, x, y - TILE_SIZE * 2, 'white', '16px Arial');

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
	get durability() { return this._durability }
	set durability(value) { this._durability = clamp(value, 0, 100); }
}

class LootPiece extends GameObject{
	active = true
	value = 4;

	constructor(x, y) {
		super(x, y);
		this.size = TILE_SIZE / 2;
	}

	onInteract = ()=>{}

	onCollision(withObject) {
		if (this.active && withObject == player) {
			player.loot += this.value;
			this.active = false;
			zzfx(...[.3,,700,,.02,.16,,1.78,,,606,.05,,,.2,.04,,.51,,.11]);
		}
	}

	draw(x, y) {
		if (this.active && pointInView(x, y)) {
			let tile = tileAtCoords(x, y);
			let tileType = currentLevel.getType(1, tile);
			let color = tileType > GRND ? averageHexColors([substColors[tileType], substColors[GOLD]]) : substColors[GOLD];
			colorRect(x, y, this.size, this.size, color, true);
		}
	}
}

class Hammer extends GameObject {
	useTime = 20;
	timer = 0;
	rotation = new Vector2(0, 1);

	constructor(x, y) {
		super(x, y);
		this.size = TILE_SIZE * 2;
	}

	onUse() {
		if (this.timer == 0) {
			this.timer = 1;
		}
	}

	onCollision(withObject) {
		if (withObject == player) {
			player.interactables.push(this);
		}
	}

	updateHeld() {
		if (!this.timer) return;
		this.timer++;
		if (this.timer == Math.floor(this.useTime / 2)) {
			let hit = 0;
			let ix = player.x + player.rotation.x * this.size, iy = player.y + player.rotation.y * this.size;
			let index = tileAtCoords(ix, iy);
			let tiles = tilesNearIndex(index);
			for (let tile of tiles) {
				let type = currentLevel.getType(0, tile);
				if (SOLID_SUBST_SET.has(type)) {
					currentLevel.addLife(0, tile, -25);
					hit++;
				}
			}
			if (hit) {
				zzfx(...[,,400,,,0,2,.8,,,,,,4,-0.5,.8,,.55,.05]);
				this.durability -= 10;
			}
		} else if (this.timer == this.useTime + 8) {
			this.timer = 0;
		}
	}

	draw(x, y) {
		let tile = tileAtCoords(x, y);
		let tileType = currentLevel.getType(1, tile);
		ctx.translate(x, y);
		let color = tileType > GRND ? averageHexColors([substColors[tileType], substColors[WOOD]]) : substColors[WOOD];
		colorRect(0, 0, this.size / 6, this.size, color, true);
		color = tileType > GRND ? averageHexColors([substColors[tileType], substColors[METAL]]) : substColors[METAL];
		colorRect(-this.size / 3, -this.size / 2, this.size / 1.5, this.size / 4, color);
		this.drawDurability(0, 0);
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
	armed = false;
	constructor(x, y) {
		super(x, y);
		this.size = TILE_SIZE;
	}

	onUse() {
		this.position.x = player.position.x + player.rotation.x * (player.size + this.size);
		this.position.y = player.position.y + player.rotation.y * (player.size + this.size);
		this.velocity = player.velocity.add(player.rotation.multiply(10));
		
		if (!objectTileCollision(this)) {
			this.armed = true;
			currentLevel.objects.push(this);
			let index = player.items.indexOf(this);
			if (index >= 0) player.items[index] = null;
		} 
	}

	onCollision(withObject) {
		if (withObject == player && !this.armed) {
			player.interactables.push(this);
		} else if (this.armed) {
			let tiles = tilesNearPosition(this.x, this.y);
			for (let tile of tiles) {
				currentLevel.spawnTile(tile, OIL);
				currentLevel.spawnTile(tile, FIRE);
			}
			zzfx(...[.5,.02,356,.15,,.4,4,1.33,-0.6,,,,,,,.1,,.2,.3])
			let index = currentLevel.objects.indexOf(this);
			if (index >= 0) currentLevel.objects.splice(index, 1);
		}
	}

	draw(x, y) {
		const capHeight = this.size/3;
		colorRect(x - this.size/4, y - this.size/2, this.size/2, capHeight, 'red');
		colorRect(x - this.size/4, y - this.size/2 + capHeight, this.size/2, this.size - capHeight, 'olive');
	}

	drawHeld() {
		return;
	}

	get width() { return this.size/2; }
}

class Grenade extends GameObject {
	_blastRadius = 6;
	armed = false;
	type = 'circle';
	constructor(x, y) {
		super(x, y);
	}

	onUse() {
		this.position.x = player.position.x + player.rotation.x * (player.size + this.size);
		this.position.y = player.position.y + player.rotation.y * (player.size + this.size);
		this.velocity = player.velocity.add(player.rotation.multiply(10));
		
		if (!objectTileCollision(this)) {
			this.armed = true;
			currentLevel.objects.push(this);
			let index = player.items.indexOf(this);
			if (index >= 0) player.items[index] = null;
		} 
	}

	onCollision(withObject) {
		if (withObject == player && !this.armed) {
			player.interactables.push(this);
		} else if (this.armed) {
			let tile = tileAtCoords(this.x, this.y);
			for (let y = -this._blastRadius + 1; y < this._blastRadius; y++) {
				for (let x = -this._blastRadius + 1; x < this._blastRadius; x++) {
					if (Math.abs(x) + Math.abs(y) > this._blastRadius) continue;
					let checkTile = tile + (y * currentLevel.width);
					if (currentLevel.getType(0, checkTile) == METAL) continue;
					if (Math.floor(checkTile / currentLevel.width) !=  Math.floor((checkTile += x) / currentLevel.width)) continue;
					currentLevel.setType(1, checkTile, FIRE);
					currentLevel.addLife(0, checkTile, -200);
				}
			}
			zzfx(...[,,1e3,,.02,.3,4,3,.8,.5,,,,,12,.7]);
				
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
	armed = false;
	type = 'circle';
	constructor(x, y) {
		super(x, y);
	}

	onUse() {
		this.position.x = player.position.x + player.rotation.x * (player.size + this.size);
		this.position.y = player.position.y + player.rotation.y * (player.size + this.size);
		this.velocity = player.velocity.add(player.rotation.multiply(10));
		
		if (!objectTileCollision(this)) {
			this.armed = true;
			currentLevel.objects.push(this);
			let index = player.items.indexOf(this);
			if (index >= 0) player.items[index] = null;
		} 
	}

	onCollision(withObject) {
		if (withObject == player && !this.armed) {
			player.interactables.push(this);
		} else if (this.armed) {
			let tiles = tilesNearPosition(this.x, this.y);
			for (let tile of tiles) {
				currentLevel.spawnTile(tile, WATER);
			}
			zzfx(...[.5,.02,356,.15,,.4,4,1.33,-0.6,,,,,,,.1,,.2,.3])
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

class Door extends GameObject {
	size = TILE_SIZE * 3;
	physics = 'static';
	locked = false;
	open = false;
	constructor(x, y) {
		super(x, y);
	}

	onInteract() {
		let key = player.items[player.held];
		if (key && key.constructor.name == Key.name) key.onUse();
		if (!this.locked) {
			let hit = checkCollision(player, getTileCollider(tileAtCoords(this.x, this.y))).hit;
			if (this.open) {
				if (!hit) {
					this.open = false;
					zzfx(...[,,100,,.1,.2,1,2,,,100,.01,.05,.9,50,,,.4,.1,1]);
				}
			} else {
				this.open = true;
				zzfx(...[,,100,,.1,.2,1,2,,,100,.01,.05,.9,50,,,.4,.1,1]);
			}
		}
	}

	onCollision(whichObject, collision) {
		if (whichObject == player) {
			player.interactables.push(this);
			//TO-DO: Separate collision from interaction range
			let overlap = collision.overlap;
			if (!this.open && (Math.abs(overlap.x) > this.size/3 || Math.abs(collision.overlap.y) > this.size/3)) {
				if (overlap = checkCollision(whichObject, getTileCollider(tileAtCoords(this.x, this.y))).overlap) {
					let correction = new Vector2(whichObject.x - this.x, whichObject.y - this.y);
					if (Math.abs(correction.x) > Math.abs(correction.y)) correction.y = 0;
					else correction.x = 0;
				
					correction = correction.normalize();
					correction.x *= overlap.x;
					correction.y *= overlap.y;
					whichObject.position = whichObject.position.add(correction);
					whichObject.velocity = whichObject.velocity.add(correction);
					whichObject.velocity = whichObject.velocity.multiply(FRICTION);
				}
			}
		}
	}

	draw(x, y) {
		ctx.fillStyle = substColors[WOOD];
		ctx.strokeStyle = substColors[METAL];
		ctx.beginPath();
		ctx.rect(x - this.size/6, y - this.size/6, this.size/3, this.size/3);
		if (!this.open) ctx.fill();
		ctx.stroke();
	}

	drawLabel(x, y) {
		let locked = (!this.open && this.locked) ? ' (Locked)' : '';
		colorText(this.constructor.name + locked, x, y - TILE_SIZE * 2, 'white', '16px Arial');
	}
}

class Key extends GameObject {
	constructor(x, y) {
		super(x, y);
	}

	onCollision(whichObject) {
		if (whichObject == player) {
			player.interactables.push(this);
		}
	}

	onUse() {
		let interactable = player.interactables[0];
		if (interactable && interactable.constructor.name == Door.name && interactable.locked) {
			interactable.locked = false;
			let index = player.items.indexOf(this);
			if (index >= 0) player.items[index] = null;
		}

		return false;
	}

	draw(x, y) {
		colorRect(x - this.size/6, y-this.size/4, this.size/3, this.size, substColors[GOLD]);
		colorRect(x - this.size/3, y+this.size/4, this.size/1.5, this.size/2);
	}
}