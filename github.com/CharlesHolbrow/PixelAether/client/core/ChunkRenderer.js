/*------------------------------------------------------------
Beautiful.Renderer Wraps a canvas and a chunk
------------------------------------------------------------*/
Beautiful.ChunkRenderer = function () {
  var self = this;
  self.chunk = null;
  self.canvas = document.createElement('canvas');
  self.context = self.canvas.getContext('2d');

  self.center = {};

  self.fill(); // for testing!

  // Reactivity
  self.chunkAddress = new Beautiful.ChunkAddress();
  Deps.autorun(function() {
    self.renderChunk(self.chunkAddress.get());
  });
};


/*------------------------------------------------------------
clear
fill
renderChunk
setChunk
------------------------------------------------------------*/
Beautiful.ChunkRenderer.prototype = {

clear: function() {
  this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
},

fill: function(fillColor, strokeColor) {
  this.context.fillStyle = fillColor || getRandomColor();
  this.context.strokeStyle = strokeColor || getRandomColor();
  this.context.lineWidth = 4;

  this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  this.context.strokeRect(0, 0, this.canvas.width, this.canvas.height);
},

renderChunk: function(chunkSelector) {
  // get the chunk
  this.chunk = Chunks.findOne(chunkSelector);
  if (!this.chunk) {
    this.fill();
    return;
  }
  var chunk = this.chunk;

  // Where are we taking from the image
  var xClip;
  var yClip;

  //Where do we position the tiles on the canvas
  var xCursor = 0;
  var yCursor = 0;

  // for convenience
  var tileset = gGame.world.getTileset();
  var tilesetLength = tileset.tileWidth * tileset.tileHeight;

  // re-size and set center of Canvas only if needed 
  if (this.canvas.width !== chunk.width * tileset.tileWidth) {
    this.canvas.width = chunk.width * tileset.tileWidth;
    this.center.x = Math.floor(this.canvas.width * 0.5);
  }
  if (this.canvas.height !== chunk.height * tileset.tileHeight) {
    this.canvas.height = chunk.height * tileset.tileHeight;
    this.center.y = Math.floor(this.canvas.height * 0.5);
  }
 
  this.clear();

  // iterate over layers
  for (var layerIndex = 0; layerIndex < chunk.layerNames.length; layerIndex++) {
    var layerName = chunk.layerNames[layerIndex];

    // iterate over layer Data
    for (var i=0; i < chunk.width * chunk.height; i++) {
      var tileIndex = chunk.layerData[layerName][i];

      if (!tileIndex) continue;

      // Get the coordinates of the tile in the tileset
      tileIndex = tileIndex - tileset.firstgid;
      xClip = tileset.getUpperLeftX(tileIndex % tilesetLength);
      yClip = tileset.getUpperLeftY(tileIndex % tilesetLength);
      xCursor = tileset.tileWidth * (i % chunk.width);
      // position the first tile in the bottom left
      yCursor = tileset.tileHeight * (chunk.height - (Math.floor(i / chunk.width)) - 1);

      this.context.drawImage(tileset.image,
        xClip, yClip,
        tileset.tileWidth, tileset.tileHeight,
        xCursor, yCursor,
        tileset.tileWidth, tileset.tileHeight);

    } // iterate over layer data
  } // iterate over layers
  this.context.strokeRect(0, 0, this.canvas.width, this.canvas.height); // outline chunk for debugging
},

setChunk: function(chunkSelector) {
  this.chunkAddress.set(chunkSelector);
},

}; // Beautiful.ChunkRenderer.prototype
