/* ============================================================
   FEEDNOW — AUTH BACKGROUND ANIMATION
   Floating particles canvas for login/signup pages
   ============================================================ */

(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'authBgCanvas';
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;';

  // Insert as first child of auth-layout
  const layout = document.querySelector('.auth-layout');
  if (!layout) return;
  layout.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let w, h, particles;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.radius = Math.random() * 4 + 1.5;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = (Math.random() - 0.5) * 0.4;
      this.opacity = Math.random() * 0.35 + 0.08;
      // Use brand greens with variety
      const hue = 142 + Math.random() * 30 - 15; // 127-157
      const sat = 50 + Math.random() * 30;
      const lgt = 40 + Math.random() * 25;
      this.color = `hsla(${hue}, ${sat}%, ${lgt}%, ${this.opacity})`;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      // Wrap around
      if (this.x < -10) this.x = w + 10;
      if (this.x > w + 10) this.x = -10;
      if (this.y < -10) this.y = h + 10;
      if (this.y > h + 10) this.y = -10;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  function init() {
    resize();
    const count = Math.min(Math.floor((w * h) / 12000), 80);
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function connectParticles() {
    const maxDist = 140;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.12;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach((p) => {
      p.update();
      p.draw();
    });
    connectParticles();
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => {
    resize();
  });

  init();
  animate();
})();
