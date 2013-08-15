/*------------------------------------------------------------
Game wraps instances of all the major building blocks of 
our game engine. 
Many objects expect there to be a single instance of Game in 
the global namepsace with the name 'self'. 

self.world
self.simulation
self.input
self.map
self.tileset
self.view

Some of the members above require gGame to exist before they 
can initialize. For that reason, First allow us to create the 
gGame object, THEN run the init method on it to actually 
create the members. 
------------------------------------------------------------*/
Beautiful.Game = function() {
};


/*------------------------------------------------------------
------------------------------------------------------------*/
Beautiful.Game.prototype = {

init: function() {
  var self = this;
  console.log()
  self.map = Beautiful.Maps.main;
  self.tileset = new Beautiful.Tileset(
    images['elements9x3.png'],
    9, 3,
    28, 35,
    30, 37 );

  self.view = new Beautiful.View(); // wraps our DOM canvas
  self.view.size.set(896, 560);
  self.world = new Beautiful.World(); // Wraps chunkRenderers 
  self.simulation = new Beautiful.Simulation(); // simulate game time
  self.simulation.step();
  self.input = new Beautiful.Input(); // input depends on Simulation

  // WARNING: if will call init twice, this will create two autoruns
  Deps.autorun(function() {
    var range = self.world.grid.getRange();
    var map = self.world.getMap();
    Meteor.subscribe('map',
      range.xMin - 1,
      range.xMax + 1,
      range.yMin - 1,
      range.yMax + 1,
      map.name);
  });
}
  //setTileset
};
