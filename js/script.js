class _CreateObject {
	constructor(args) {
		Object.assign(this, args);
		this.destroyed = false;

		this.base = 1;
		if (this.isUserShip) {
			this.side = 50;
			this.baseColor = '#df0';
			this.hitColor = '#a23';
			this.color = this.baseColor;
			this.life = 5;
		}
		else {
			this.x = Math.floor(Math.random() * this.ctx.canvas.width);
			this.side = 25;
			this.baseColor = '#ff006c';
			this.hitColor = '#f93';
			this.color = this.baseColor;
			this.life = 5;
			this.vy = 1 + Math.random();
		}
	}
}

class _Bullet extends _CreateObject {
	constructor(args) {
		super(args);
	}

	draw() {
		let ctx = this.ctx;
		ctx.save();
		ctx.lineWidth = 4;
		ctx.strokeStyle = this.color;
		ctx.beginPath();
		ctx.moveTo(this.x, this.y);
		ctx.lineTo(this.x, this.y - 2);
		ctx.stroke();
		ctx.restore();
	}

	update(time) {
		this.y -= 15;
	}
}


class _Ship extends _CreateObject {
	constructor(args) {
		super(args);
		this.y = -this.side * 2;
	}

	draw() {
		let ctx = this.ctx;
		ctx.fillStyle = this.color;
		this.addFragments();
	}

	addFragments() {
		let ctx = this.ctx;
		let cx = this.x;
		let heightScale = .5;
		let fragments = this.base * this.base;
		let halfSide = this.side / 2;
		let rHeight = Math.floor(this.side * heightScale);
		let rowBase = this.base * 2 - 1;

		let i = 0;
		let row = 0;
		let isInverted = this.isUserShip ? false : true;
		let pos = 0;

		while (i < fragments) {
			if (i == rowBase) {
				isInverted = !isInverted;
				row++;
				rowBase += (rowBase - (2 + 1 * row - 1) * row) / row;
				pos = 0;
			}

			let x = cx + halfSide * row + halfSide * pos;
			pos++;
			let y = this.y + halfSide * row;

			ctx.beginPath();

			if (isInverted) {
				ctx.moveTo(x, y - rHeight);
				ctx.lineTo(x + halfSide, y);
				ctx.lineTo(x + this.side, y - rHeight);
			}
			else {
				ctx.moveTo(x, y);
				ctx.lineTo(x + halfSide, y - rHeight);
				ctx.lineTo(x + this.side, y);
			}
			ctx.closePath();
			ctx.fill();
			ctx.stroke();

			isInverted = !isInverted;
			i++;
		}
	}
}

class _Arkanoid {
	constructor(args) {
		Object.assign(this, args);
		this.canvas = document.querySelector(this.canvas);
		this.ctx = this.canvas.getContext('2d');
		this.BCR = this.canvas.getBoundingClientRect();
		this.w = this.BCR.width;
		this.h = this.BCR.height;
		this.uBullets = [];
		this.eBullets = [];
		this.eShips = [];
		this.score = 0;

		this.mouse = {
			x: null,
			y: null
		}

		this.uShip = new _Ship({
			ctx: this.ctx,
			isUserShip: true
		});

		let eShip = new _Ship({
			ctx: this.ctx,
			isUserShip: false
		});
		this.eShips.push(eShip);

		setInterval(() => {
			let eShip = new _Ship({
				ctx: this.ctx,
				isUserShip: false
			});
			this.eShips.push(eShip);
		}, 1500);

		this.canvas.addEventListener('mousemove', e => {
			this.mouse.x = e.clientX - this.BCR.x;
			this.mouse.y = e.clientY - this.BCR.y;
		});

		this.canvas.addEventListener('click', e => {
			let bullet = this.addBullet(true);
			this.uBullets.push(bullet);
		});

		this.canvas.addEventListener('mousedown', e => {
			this.INT = setInterval(() => {
				let bullet = this.addBullet(true);
				this.uBullets.push(bullet);
			}, 25);
		});

		this.canvas.addEventListener('mouseup', e => {
			clearInterval(this.INT);
		});

		window.addEventListener('reside', e => {
			this.onResize();
		});

		this.update();
	}

	addBullet(user) {
		return new _Bullet({
			ctx: this.ctx,
			x: this.mouse.x,
			y: this.mouse.y,
			isUserShip: user,
			hit: false,
			hitPoints: 1,
			cw: this.w,
			ch: this.h
		});
	}

	detectCollision(eShip) {
		let bullet;
		let length = this.uBullets.length;

		let i = 0;
		while (i < length) {
			bullet = this.uBullets[i];

			if (bullet.x >= eShip.x && bullet.x <= eShip.x + eShip.side * eShip.base && bullet.y <= eShip.y && this.uShip.y >= eShip.y && !bullet.hit) {
				bullet.hit = true;
				eShip.color = eShip.hitColor;
				setTimeout(() => {
					eShip.color = eShip.baseColor;
				}, 50);
				eShip.life -= bullet.hitPoints;
				if (eShip.life <= 0) {
					eShip.destroyed = true;
				}
			}
			i++;
		}

		return eShip;
	}

	update(time) {
		let frametime = time / 1000;
		this.t = time - this.prevtime;
		this.prevtime = time;
		this.ctx.clearRect(0, 0, this.w, this.h)

		this.uShip.x = this.mouse.x - this.uShip.side / 2;
		this.uShip.y = this.mouse.y + this.uShip.side / 4;
		this.uShip.draw();

		this.ctx.strokeStyle = '#1f2029';

		let i = 0;
		let length = this.eShips.length;
		while (i < length) {
			let eShip = this.eShips[i];
			if (eShip.y <= this.h + eShip.side && !eShip.destroyed) {
				eShip.draw();
				eShip.y += eShip.vy;
				this.detectCollision(eShip);
			}
			i++;
		}

		let j = 0;
		while (j < this.uBullets.length) {
			let uBullet = this.uBullets[j];
			if (uBullet.y > 0 && !uBullet.hit) {
				uBullet.draw();
				uBullet.update(time);
			}
			j++;
		}


		window.requestAnimationFrame(time => this.update(time));
	}

	onResize() {
		this.BCR = this.canvas.getBoundingClientRect();
		this.w = this.BCR.width;
		this.h = this.BCR.height;
	}
}

new _Arkanoid({
	canvas: 'canvas'
});