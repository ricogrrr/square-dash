export default class Boost {
    constructor(canvas, player) {
        this.canvas = canvas;
        this.player = player; // Reference to the player object
        this.width = 20;
        this.height = 20;
        this.color = "gold";
        this.active = true;
        this.respawn();
    }

    respawn() {
        this.x = Math.random() * (this.canvas.width - this.width);
        this.y = Math.random() * (this.canvas.height - this.height);
        this.active = true;
        console.log(`Boost respawned at (${this.x.toFixed(2)}, ${this.y.toFixed(2)})`);
    }

    draw(ctx) {
        if (this.active) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    checkCollision(player) {
        if (
            this.active &&
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y
        ) {
            this.activateBoost(player);
            this.active = false;
            setTimeout(() => this.respawn(), 7000); // Respawn after 7 seconds
        }
    }

    activateBoost(player) {
        if (!player.isBoosted) {
            player.isBoosted = true;
            player.multiplier = 2;
            console.log("Boost activated! Multiplier set to 2x");
            setTimeout(() => {
                player.isBoosted = false;
                player.multiplier = 1;
                console.log("Boost expired! Multiplier reset to 1x");
            }, 20000); // Boost lasts for 20 seconds
        }
    }
}
