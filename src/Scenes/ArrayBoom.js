class ArrayBoom extends Phaser.Scene {
    constructor() {
        super("arrayBoom");

        this.my = {sprite: {}, text: {}};
        this.my.sprite.bullet = [];
        this.maxBullets = 5;
        this.myScore = 0;
        this.currentWave = 1;
        this.gameIsOver = false;

        this.maxHealth = 3;
        this.currentHealth = 3;

        this.enemies = [];

        this.enemyTypes = [
            { key: "hippo",  scorePoints: 25, scale: 0.25, speed: 2500 },
            { key: "frog",   scorePoints: 15, scale: 0.25,  speed: 2250 },
            { key: "horse",  scorePoints: 20, scale: 0.25,  speed: 1250 },
            { key: "snake",  scorePoints: 30, scale: 0.25,  speed: 3250 },
        ];

        this.minSpawnDelay = 1000;
        this.maxSpawnDelay = 3500;
    }

    preload() {
        this.load.setPath("./assets/");


        this.load.image("hippo", "hippo.png");
        this.load.image("frog", "frog.png");
        this.load.image("horse", "horse.png");
        this.load.image("snake", "snake.png");

        this.load.image("blue_body_circle", "blue_body_circle.png");
        this.load.image("face_h", "face_h.png");
        this.load.image("blue_hand_point", "blue_hand_point.png");


        this.load.image("water_drop", "water_drop.png");


        this.load.image("whitePuff00", "whitePuff00.png");
        this.load.image("whitePuff01", "whitePuff01.png");
        this.load.image("whitePuff02", "whitePuff02.png");
        this.load.image("whitePuff03", "whitePuff03.png");


        this.load.image("food_tileset", "tilemap.png");
        this.load.image("shmup_tileset", "tiles_packed.png");
        this.load.tilemapTiledJSON("map3", "test_bg3.json");

        this.load.bitmapFont("rocketSquare", "KennyRocketSquare_0.png", "KennyRocketSquare.fnt");
        this.load.audio('hit', 'jingles_HIT13.ogg');
        this.load.audio('bgm', 'world_of_8bit_game.mp3');
    }

    create() {
        let my = this.my;


        this.myScore = 0;
        this.currentHealth = this.maxHealth;
        this.currentWave = 1;
        this.gameIsOver = false;
        this.enemies = [];
        this.my.sprite.bullet = [];
        this.minSpawnDelay = 1000;
        this.maxSpawnDelay = 3500;


        // TILEMAP
        // ---------------------------------------------------------------
        this.map = this.add.tilemap("map3", 16, 16, 16, 20);
        this.tileset1 = this.map.addTilesetImage("food_tileset",  "food_tileset");
        this.tileset2 = this.map.addTilesetImage("shmup_tileset", "shmup_tileset");
        this.tileLayerBase = this.map.createLayer("base", [this.tileset1, this.tileset2], 0, 0);
        this.tileLayerTop  = this.map.createLayer("top",  [this.tileset1, this.tileset2], 0, 0);
        this.tileLayerBase.setScale(3);
        this.tileLayerTop.setScale(3);
        this.tileLayerBase.setDepth(-2);
        this.tileLayerTop.setDepth(-1);

        // PLAYER
        // ---------------------------------------------------------------
        const playerX = game.config.width / 2;
        const playerY = game.config.height - 150;
        this.playerY = playerY;

        my.sprite.body = this.add.sprite(playerX, playerY, "blue_body_circle");
        my.sprite.body.setScale(1);

        my.sprite.face = this.add.sprite(playerX, playerY - 16, "face_h");
        my.sprite.face.setScale(1);

        my.sprite.hand = this.add.sprite(playerX + 100, playerY - 10, "blue_hand_point");
        my.sprite.hand.setScale(1);

        // ANIMATION, SOUND, INPUT
        // ---------------------------------------------------------------
        this.anims.create({
            key: "puff",
            frames: [
                { key: "whitePuff00" },
                { key: "whitePuff01" },
                { key: "whitePuff02" },
                { key: "whitePuff03" },
            ],
            frameRate: 20,
            repeat: 5,
            hideOnComplete: true
        });

        this.hit = this.sound.add('hit');

        this.left  = this.input.keyboard.addKey("A");
        this.right = this.input.keyboard.addKey("D");
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE); // Phaser.Input.Keyboard.KeyCodes.UP
        this.rKey  = this.input.keyboard.addKey("R");

        this.playerSpeed = 600;
        this.bulletSpeed = 1200;

        document.getElementById('description').innerHTML =
            '<h2>Picnic Defense!</h2><br>A: left // D: right // Space: fire // R: restart';

        // UI — wave, score, health..etc
        // ---------------------------------------------------------------
        my.text.score = this.add.bitmapText(460, 0, "rocketSquare", "Score " + this.myScore);
        my.text.score.setDepth(10);

        my.text.wave = this.add.text(10, 5, "Picnic Defence!!! ------------ Wave " + this.currentWave, {
            fontFamily: 'Times, serif',
            fontSize: 24,
            color: '#0a0a0a'
        }).setDepth(10);

        my.text.health = this.add.text(10, 35, this.getHealthString(), {
            fontFamily: 'Times, serif',
            fontSize: 22,
            color: '#ff4444'
        }).setDepth(10);

        // BGM and first wave enemy spawn
        // ---------------------------------------------------------------
        this.music = this.sound.add('bgm');
        this.music.play({ loop: true, volume: 0.06 });

        this.scheduleNextSpawn();
    }

    getHealthString() {
        let str = "HP: ";
        for (let i = 0; i < this.maxHealth; i++) {
            str += (i < this.currentHealth) ? "(Heart )" : "(No heart )";
        }
        return str;
    }

    scheduleNextSpawn() {
        let delay = Phaser.Math.Between(this.minSpawnDelay, this.maxSpawnDelay);
        this.time.delayedCall(delay, this.spawnEnemy, [], this);
    }

    spawnEnemy() {
        if (this.gameIsOver) return;

        let typeDef = Phaser.Utils.Array.GetRandom(this.enemyTypes);
        let spawnX = Phaser.Math.Between(60, game.config.width - 60);
        let spawnY = 60;
        let targetY = game.config.height + 40;
        let path;

        if (typeDef.key === "hippo") {
            path = new Phaser.Curves.Spline([spawnX, spawnY, spawnX, targetY]);

        } else if (typeDef.key === "frog") {
            let points = [spawnX, spawnY];
            for (let i = 1; i <= 6; i++) {
                let t = i / 6;
                let y = spawnY + t * (targetY - spawnY);
                let spread = 200 * (1 - t * 0.4);
                let x = (i % 2 === 0) ? (spawnX - spread) : (spawnX + spread);
                x = Phaser.Math.Clamp(x, 60, game.config.width - 60);
                points.push(x, y);
            }
            path = new Phaser.Curves.Spline(points);

        } else if (typeDef.key === "horse") {
            let endX = Phaser.Math.Between(200, 600);
            path = new Phaser.Curves.Spline([spawnX, spawnY, endX, targetY]);

        } else if (typeDef.key === "snake") {
            let points = [spawnX, spawnY];
            for (let i = 1; i <= 10; i++) {
                let t = i / 10;
                let y = spawnY + t * (targetY - spawnY);
                let spread = 260 * (1 - t * 0.3);
                let x = (i % 2 === 0) ? (spawnX + spread) : (spawnX - spread);
                x = Phaser.Math.Clamp(x, 60, game.config.width - 60);
                points.push(x, y);
            }
            path = new Phaser.Curves.Spline(points);
        }

        let enemy = this.add.follower(path, spawnX, spawnY, typeDef.key);
        enemy.setScale(typeDef.scale);
        enemy.scorePoints = typeDef.scorePoints;
        enemy.reachedBottom = false;

        enemy.startFollow({
            from: 0, to: 1,
            delay: 0,
            duration: typeDef.speed,
            ease: 'Sine.easeInOut',
            repeat: 0,
            yoyo: false,
            rotateToPath: false
        });

        this.enemies.push(enemy);
        this.scheduleNextSpawn();
    }

    checkWave() {
        if (this.currentWave === 1 && this.myScore >= 500) {
            this.currentWave = 2;
            this.minSpawnDelay = 400;
            this.maxSpawnDelay = 1500;
            //replenshi health
            this.currentHealth = this.maxHealth
            this.my.text.health.setText(this.getHealthString());

            this.my.text.wave.setText("Wave 2");

            let waveAnnounce = this.add.text(
                game.config.width / 2,
                game.config.height / 2,
                "Picnic defense ----------- WAVE 2!", {
                    fontFamily: 'Times, serif',
                    fontSize: 52,
                    color: '#080808'
                }
            ).setOrigin(0.5).setDepth(25);

            this.time.delayedCall(2000, () => waveAnnounce.destroy());
        }

        if (this.currentWave === 2 && this.myScore >= 1000) {
            this.you_win();
        }
    }

    update(time, delta) {
        let my = this.my;
        let dt = delta / 1000;

        if (this.gameIsOver) {
            if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
                this.music.stop();
                this.scene.restart();
            }
            return;
        }

        if (this.left.isDown) {
            if (my.sprite.body.x > my.sprite.body.displayWidth / 2) {
                my.sprite.body.x -= this.playerSpeed * dt;
            }
        }
        if (this.right.isDown) {
            if (my.sprite.body.x < game.config.width - my.sprite.body.displayWidth / 2) {
                my.sprite.body.x += this.playerSpeed * dt;
            }
        }

        my.sprite.face.x = my.sprite.body.x;
        my.sprite.face.y = my.sprite.body.y - 16;
        my.sprite.hand.x = my.sprite.body.x + 34;
        my.sprite.hand.y = my.sprite.body.y - 10;

        if (Phaser.Input.Keyboard.JustDown(this.space)) {
            if (my.sprite.bullet.length < this.maxBullets) {
                my.sprite.bullet.push(this.add.sprite(
                    my.sprite.body.x,
                    my.sprite.body.y - (my.sprite.body.displayHeight / 2),
                    "water_drop"
                ).setScale(0.5));
            }
        }

        for (let bullet of my.sprite.bullet) {
            bullet.y -= this.bulletSpeed * dt;
        }

        my.sprite.bullet = my.sprite.bullet.filter(
            (bullet) => bullet.y > -(bullet.displayHeight / 2)
        );

        for (let bullet of my.sprite.bullet) {
            for (let enemy of this.enemies) {
                if (enemy.visible && !enemy.reachedBottom && this.collides(enemy, bullet)) {
                    this.hit.play();
                    this.add.sprite(enemy.x, enemy.y, "whitePuff03")
                        .setScale(0.25).play("puff");

                    enemy.visible = false;
                    enemy.stopFollow();
                    bullet.y = -100;

                    this.myScore += enemy.scorePoints;
                    my.text.score.setText("Score " + this.myScore);

                    this.checkWave();
                }
            }
        }

        for (let enemy of this.enemies) {
            if (enemy.visible && !enemy.reachedBottom && enemy.y > this.playerY + 20) {
                enemy.reachedBottom = true;
                enemy.visible = false;
                enemy.stopFollow();

                this.currentHealth--;
                my.text.health.setText(this.getHealthString());

                if (this.currentHealth <= 0) {
                    this.gameOver();
                }
            }
        }

        this.enemies = this.enemies.filter(e => e.visible);
    }

    gameOver() {
        this.gameIsOver = true;
        this.music.stop();

        for (let enemy of this.enemies) {
            if (enemy.visible) {
                enemy.visible = false;
                enemy.stopFollow();
            }
        }

        this.add.rectangle(
            game.config.width / 2,
            game.config.height / 2,
            520, 260,
            0x000000, 0.8
        ).setDepth(20);

        this.add.text(game.config.width / 2, game.config.height / 2 - 60, "GAME OVER", {
            fontFamily: 'Times, serif',
            fontSize: 48,
            color: '#ff4444'
        }).setOrigin(0.5).setDepth(21);

        this.add.text(game.config.width / 2, game.config.height / 2, "Final Score: " + this.myScore, {
            fontFamily: 'Times, serif',
            fontSize: 28,
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(21);

        this.add.text(game.config.width / 2, game.config.height / 2 + 60, "Press R to Restart", {
            fontFamily: 'Times, serif',
            fontSize: 22,
            color: '#aaaaaa'
        }).setOrigin(0.5).setDepth(21);
    }

    you_win() {
        this.gameIsOver = true
        this.music.stop();

        for (let enemy of this.enemies) {
            if (enemy.visible) {
                enemy.visible = false;
                enemy.stopFollow();
            }
        }

        this.add.rectangle(
            game.config.width / 2,
            game.config.height / 2,
            520, 260,
            0x000000, 0.8
        ).setDepth(20);

        this.add.text(game.config.width / 2, game.config.height / 2 - 60, "You Win!!!", {
            fontFamily: 'Times, serif',
            fontSize: 48,
            color: '#09f357'
        }).setOrigin(0.5).setDepth(21);

        this.add.text(game.config.width / 2, game.config.height / 2, "Final Score: " + this.myScore, {
            fontFamily: 'Times, serif',
            fontSize: 28,
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(21);

        this.add.text(game.config.width / 2, game.config.height / 2 + 60, "Press R to Restart", {
            fontFamily: 'Times, serif',
            fontSize: 22,
            color: '#aaaaaa'
        }).setOrigin(0.5).setDepth(21);
    }

    collides(a, b) {
        return Math.abs(a.x - b.x) < (a.displayWidth / 2 + b.displayWidth / 2) &&
               Math.abs(a.y - b.y) < (a.displayHeight / 2 + b.displayHeight / 2);
    }
}
         