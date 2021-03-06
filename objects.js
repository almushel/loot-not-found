class GameObject {
	_durability = 100;
	size = TILE_SIZE;
	position = new Vector2(0, 0);
	rotation = new Vector2(0, 1);
	velocity = new Vector2(0, 0);
	type = 'rect';
	physics = 'dynamic';

	constructor(x, y) {
		this.position.x = x;
		this.position.y = y;
	}

	//Interaction in player inventory
	onUse(){}

	//Interaction in game level
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
	onCollision(withObject) {}

	get width() { return this.size; }
	get height() { return this.size; }
	get x() { return this.position.x; }
	get y() { return this.position.y; }
	set x(value) { this.position.x = value; }
	set y(value) { this.position.y = value; }
	get durability() { return this._durability }
	set durability(value) { this._durability = clamp(value, 0, 100); }
	get interactCollider() {return this}
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
			zzfx(...SOUND_EFFECTS['lootpickup']);
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
	set durability(v) {}
}

class Hammer extends GameObject {
	constructor(x, y) {
		super(x, y);
		this.size = TILE_SIZE * 2;
	}

	onUse() {
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
			zzfx(...SOUND_EFFECTS['hammerhit']);
			this.durability -= 10;
		}
	}

	onCollision(withObject) {
		if (withObject == player) {
			player.interactables.push(this);
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
}

class FireBomb extends GameObject {
	armed = false;
	constructor(x, y) {
		super(x, y);
		this.size = TILE_SIZE;
	}

	onUse = useThrowable;

	onCollision(withObject) {
		if (withObject == player && !this.armed) {
			player.interactables.push(this);
		} else if (this.armed) {
			let tiles = tilesNearPosition(this.x, this.y);
			for (let tile of tiles) {
				currentLevel.spawnTile(tile, OIL);
				currentLevel.spawnTile(tile, FIRE);
			}
			zzfx(...SOUND_EFFECTS['firebomb']);
			let index = currentLevel.objects.indexOf(this);
			if (index >= 0) currentLevel.objects.splice(index, 1);
		}
	}

	draw(x, y) {
		const capHeight = this.size/3;
		colorRect(x - this.size/4, y - this.size/2, this.size/2, capHeight, 'red');
		colorRect(x - this.size/4, y - this.size/2 + capHeight, this.size/2, this.size - capHeight, 'olive');
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

	onUse = useThrowable;

	onCollision(withObject) {
		if (withObject == player && !this.armed) {
			player.interactables.push(this);
		} else if (withObject != player && this.armed) {
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

			let boomCollider = { x: this.x, y: this.y, type: 'circle', radius: TILE_SIZE + this._blastRadius * TILE_SIZE, };

			currentLevel.objects.forEach(e => {
				if(e != this && checkCollision(e, boomCollider).hit) {
					let delta = new Vector2(e.x - this.x, e.y - this.y);
					delta.length = (boomCollider.radius / delta.length) * TILE_SIZE / 2;
					e.velocity = e.velocity.add(delta);
					e.durability -= 100;
					if (e.armed != undefined) e.armed = 1;
				}
			});

			if (checkCollision(player, boomCollider).hit) {
				let delta = new Vector2(player.x - this.x, player.y - this.y);
					delta.length = (boomCollider.radius / delta.length) * TILE_SIZE / 2;
				player.velocity = player.velocity.add(delta);
				player.hp -= 50;
			}

			zzfx(...SOUND_EFFECTS['boom']);
				
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

	onUse = useThrowable;

	onCollision(withObject) {
		if (withObject == player && !this.armed) {
			player.interactables.push(this);
		} else if (this.armed) {
			let tiles = tilesNearPosition(this.x, this.y);
			for (let tile of tiles) {
				currentLevel.spawnTile(tile, WATER);
			}
			zzfx(...SOUND_EFFECTS['firebomb']);
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
	size = TILE_SIZE;
	physics = 'static';
	locked = false;
	_open = false;

	constructor(x, y) {
		super(x, y);
	}

	onInteract() {
		if (!this.durability) return;
		let key = player.items[player.held];
		if (key && key.constructor.name == Key.name) key.onUse();
		if (!this.locked) {
			let hit = checkCollision(player, this).hit;
			if (this.open) {
				if (!hit) {
					this.open = false;
					zzfx(...SOUND_EFFECTS['door']);
				}
			} else {
				this.open = true;
				zzfx(...SOUND_EFFECTS['door']);
			}
		}
	}

	onCollision(whichObject, collision) {
		if (whichObject == player) {
			player.interactables.push(this);

			let overlap = collision.overlap;
			if (!this.open && (Math.abs(overlap.x) > this.size/2 || Math.abs(collision.overlap.y) > this.size/2)) {
				if (overlap = checkCollision(whichObject, this).overlap) {
					let delta = new Vector2(whichObject.x - this.x, whichObject.y - this.y);
					correctCollision(whichObject, delta, overlap);
				}
			}
		}
	}

	draw(x, y) {
		if (this.open) ctx.fillStyle = averageHexColors([substColors[WOOD], substColors[GRND]]);
		else ctx.fillStyle = substColors[WOOD];
		ctx.strokeStyle = substColors[METAL];
		ctx.beginPath();
		ctx.rect(x - this.size/2, y - this.size/2, this.size, this.size);
		ctx.fill();
		ctx.stroke();
	}

	drawLabel(x, y) {
		let locked = (!this.open && this.locked) ? ' (Locked)' : '';
		colorText(this.constructor.name + locked, x, y - TILE_SIZE * 2, 'white', '16px Arial');
	}

	get interactCollider() {
		return {x: this.x, y: this.y, type: 'rect', width: this.size * 2.5, height: this.size * 2.5};
	}

	get open() { return this._open || this.durability == 0; }
	set open(value) { this._open = value; }
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
	set durability(v) {}
}

function useThrowable() {
	this.position.x = player.position.x + player.rotation.x * (player.size + this.size);
	this.position.y = player.position.y + player.rotation.y * (player.size + this.size);
	this.velocity = player.velocity.add(player.rotation.multiply(10));
	
	if (!objectTileCollision(this)) {
		this.armed = true;
		currentLevel.objects.push(this);
		let index = player.items.indexOf(this);
		if (index >= 0) player.items[index] = null;
		return true;
	}
	return false;
}