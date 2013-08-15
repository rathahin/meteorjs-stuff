/*------------------------------------------------------------
Reactive Data, stores a chunk's location, id
------------------------------------------------------------*/
Beautiful.ChunkAddress = function() {
	this.dep = new Deps.Dependency;
  this._private = this.NULL_ADDRESS;
};

/*------------------------------------------------------------
------------------------------------------------------------*/
Beautiful.ChunkAddress.prototype = {
  get: function() {
    this.dep.depend();
    return this._private;
  },

  getId: function() {
    this.dep.depend();
    return this._private._id;
  }, 

  set: function(selector) {
    // if the chunk doesn't exist assume we have a good 
    // selector, and we are just waiting for the chunk to 
    // change. In that case, the selector may not have _id 
    var chunk = Chunks.findOne(selector) || selector;

    if (!chunk._id || !this._private._id || chunk._id !== this._private._id) {
      this.dep.changed();
      this._private = {
        xCoord: chunk.xCoord,
        yCoord: chunk.yCoord,
        mapName: chunk.mapName,
      };
    if (chunk._id) this._private._id = chunk._id;
    }
  },

  NULL_ADDRESS: {
    xCoord: null,
    yCoord: null,
    mapName: null, 
    _id: null
  }

};