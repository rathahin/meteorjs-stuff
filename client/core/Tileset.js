// Usage:
// var ts = new TileSet( 4, 5, tileWidthInPixels, tileHeightInPixels, ... );
// ts.loadImage('filename', onload function);;

Beautiful.Tileset = function(image, width, height, tileWidth, tileHeight, cellWidth, cellHeight, validIndexes, firstgid)
{
  this.image = image;
  this.width = width; // number tiles wide
  this.height = height; // number tiles tall
  this.tileWidth = tileWidth;
  this.tileHeight = tileHeight;
  this.cellWidth = cellWidth || tileWidth;
  this.cellHeight = cellHeight || tileHeight;
  this.firstgid = firstgid || 1;

  this.validIndexes = validIndexes || new Array(width * height);
  if (!validIndexes) {
    for (var i = 0; i < width * height; i++) {
      this.validIndexes[i] = i;
    };
  };
};


/*------------------------------------------------------------
------------------------------------------------------------*/
Beautiful.Tileset.prototype = {

getUpperLeftX: function(i) {
    return ((i % this.width) * this.cellWidth) + 1;
},

getUpperLeftY: function(i) {
    return (Math.floor(i / this.width) * this.cellHeight) + 1;
},

}; // Beautiful.Tileset.prototype
