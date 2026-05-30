/**
 * Dynamic Neural/Retrieval Network Ambient Background
 * haranadh.com
 */
class NeuralNetwork {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.nodes = [];
    this.mouse = { x: null, y: null, radius: 160 };
    
    this.init();
    this.animate();
    
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener("mouseleave", () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.createNodes();
  }

  init() {
    this.resize();
  }

  createNodes() {
    this.nodes = [];
    // Scale density based on screen size
    const area = this.canvas.width * this.canvas.height;
    const density = Math.min(Math.floor(area / 18000), 100);
    
    for (let i = 0; i < density; i++) {
      this.nodes.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        originX: 0,
        originY: 0,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2.5 + 1.5,
        // Soft primary colors for light mode highlights
        color: Math.random() > 0.85 ? "rgba(79, 70, 229, 0.15)" : "rgba(15, 23, 42, 0.05)"
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw connections
    this.drawLines();
    
    // Draw nodes
    this.nodes.forEach(node => {
      // Gentle physics
      node.x += node.vx;
      node.y += node.vy;
      
      // Boundary collision
      if (node.x < 0 || node.x > this.canvas.width) node.vx *= -1;
      if (node.y < 0 || node.y > this.canvas.height) node.vy *= -1;
      
      // Mouse push effect
      if (this.mouse.x !== null) {
        const dx = node.x - this.mouse.x;
        const dy = node.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          const angle = Math.atan2(dy, dx);
          
          node.x += Math.cos(angle) * force * 1.5;
          node.y += Math.sin(angle) * force * 1.5;
        }
      }
      
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = node.color;
      this.ctx.fill();
    });
    
    requestAnimationFrame(() => this.animate());
  }

  drawLines() {
    const maxDist = 130;
    
    for (let i = 0; i < this.nodes.length; i++) {
      const nodeA = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeB = this.nodes[j];
        
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < maxDist) {
          let alpha = (1 - dist / maxDist) * 0.05;
          
          // Boost opacity if near the mouse to symbolize "activated neural pathway"
          if (this.mouse.x !== null) {
            const mDxA = nodeA.x - this.mouse.x;
            const mDyA = nodeA.y - this.mouse.y;
            const mDistA = Math.sqrt(mDxA * mDxA + mDyA * mDyA);
            
            if (mDistA < this.mouse.radius) {
              const hoverBonus = (1 - mDistA / this.mouse.radius) * 0.08;
              alpha += hoverBonus;
            }
          }
          
          this.ctx.beginPath();
          this.ctx.moveTo(nodeA.x, nodeA.y);
          this.ctx.lineTo(nodeB.x, nodeB.y);
          
          // Highlight connection style (Soft primary gradient look)
          if (alpha > 0.08) {
            this.ctx.strokeStyle = `rgba(79, 70, 229, ${alpha})`;
          } else {
            this.ctx.strokeStyle = `rgba(15, 23, 42, ${alpha})`;
          }
          
          this.ctx.lineWidth = 0.8;
          this.ctx.stroke();
        }
      }
    }
  }
}

// Initialize canvas background when document is loaded
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.createElement("canvas");
  canvas.id = "neural-canvas";
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = "-1";
  canvas.style.pointerEvents = "none";
  document.body.prepend(canvas);
  
  new NeuralNetwork(canvas);
});
