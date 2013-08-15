Beautiful.Simulation = function() {
  this.frameTime = new Date();
  this.deltaTime = null;
  this.frameCount = 0;
};


Beautiful.Simulation.prototype = {
  
step: function() {
  this.frameCount++;
  var now = new Date();
  this.deltaTime = now - this.frameTime;
  this.frameTime = now;
}

}; // Beautiful.Simulation.prototype
