Beautiful.View = function() {
  var self = this;
  self.canvas = document.createElement('canvas');
  preventContextMenu(self.canvas);
  self.context = self.canvas.getContext('2d');
  self.size = new Beautiful.Size2D(null, null, self.canvas);

  // the most recent mouse position
  self.mouse = {
      x: 0, 
      y: 0
  };

  // wrap input event listeners
  window.addEventListener('mousedown', function(event) {self.mousedown(event)});
  window.addEventListener('mouseup', function(event) {self.mouseup(event)});
  window.addEventListener('mousemove', function(event) {self.mousemove(event)});
  window.addEventListener('keydown', function(event) {self.keydown(event)});
  window.addEventListener('keyup', function(event) {self.keyup(event)});
};


/*------------------------------------------------------------
canvasToSimulation
canvasToWorld
clear
drawRenderer
keydown
keyup
mousedown
mousemove
mouseup
setSize
------------------------------------------------------------*/
Beautiful.View.prototype = {

canvasToSimulation: function(coords) {
  var center = this.size.getCenter();
  return {
  x:  coords.x - center.x,
  y: (coords.y - center.y) * -1
 };
},

canvasToWorld: function(coords) {

},

clear: function() {
  this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
},

drawRenderer: function(renderer, x, y) {
  // x, y are simulation style coords to place the bottom left 
  // corner of the renderer canvas
  var center = this.size.getCenter();

  // window style coordinates to draw the canvas at
  var drawX = center.x + x;
  var drawY = center.y - y - renderer.canvas.height;
  drawY++; // fix the fencpost error
  if (renderer.center) {
    drawX -= renderer.center.x;
    drawY += renderer.center.y;
  }

  this.context.drawImage(renderer.canvas, drawX, drawY);

},

keydown: function(event) {
  gGame.input._keyDown(event.keyCode, event);
},

keyup: function(event) {
  gGame.input._keyUp(event.keyCode, event);
},

mousedown: function(event) {
  gGame.input._mouseDown(event);
},

mousemove: function(event) {
  var totalOffsetX = 0;
  var totalOffsetY = 0;
  var currentElement = this.canvas;

  while (currentElement != null) {
    totalOffsetX += currentElement.offsetLeft;
    totalOffsetY += currentElement.offsetTop;
    currentElement = currentElement.offsetParent;
  }

  var canvasX = event.pageX - totalOffsetX;
  var canvasY = event.pageY - totalOffsetY;

  this.mouse = this.canvasToSimulation({
    x: canvasX,
    y: canvasY
  });

  // pass simulation position to the Input Manager
  gGame.input._mouseMove(this.mouse, event);
},

mouseup: function(event) {
  gGame.input._mouseUp(event);
},

}; // Beautiful.View.prototype
