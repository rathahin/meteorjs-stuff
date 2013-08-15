/*------------------------------------------------------------
Atomic Reactive Data Objects
------------------------------------------------------------*/

/*------------------------------------------------------------
------------------------------------------------------------*/
Beautiful.Size2D = function(width, height, object) {
  this._dep = new Deps.Dependency;
  this._hidden = object || {}; // allows us to pass a canvas
  this._centerX = 0;
  this._centerY = 0;
  this.set(
    width  || this._hidden.width  || 2, 
    height || this._hidden.height || 2);
}

Beautiful.Size2D.prototype = {

get: function() {
  this._dep.depend();
  return {width:this._hidden.width, height:this._hidden.height};
},

getCenter: function() {
  this._dep.depend();
  return {x:this._centerX, y:this._centerY};
},

set: function(width, height) {
  if (width !== this._hidden.width || height !== this._hidden.height) {
    if (typeof width === 'number') {
      this._hidden.width = width;
      this._centerX = width * 0.5;
    }
    if (typeof height === 'number') {
      this._hidden.height = height;
      this._centerY = height * 0.5;
    }
    this._dep.changed();
  }
},

}; // Beautiful.Size2D.prototype


/*------------------------------------------------------------
Avoid using with objects that pass by reference - modifying 
the value returned by get will modify the _datum property 
without calling changed()

Consider throwing an error when we call set with a mutable 
datum.
------------------------------------------------------------*/
Beautiful.Datum = function(datum) {
  this._dep = new Deps.Dependency;
  this.set(datum);
}

Beautiful.Datum.prototype = {

dec:function() {
  if (typeof this._datum === 'number') {
    this._datum--;
    this._dep.changed();
    return this._datum;
  }
},

get:function() {
  this._dep.depend();
  return this._datum;
},

inc:function() {
  if (typeof this._datum === 'number') {
    this._datum++;
    this._dep.changed();
    return this._datum;
  }
},

set:function(datum) {
  if (datum !== this._datum) {
    this._datum = datum;
    this._dep.changed();
  }
},

}; // Beautiful.Datum.prototype
