// Populate with unique data
Meteor.startup(function() {
  console.log('The server is starting up!');
  // Create a chunk if there isn't one already
  for (var y = -5; y < 5; y++) {
    for (var x = -5; x < 5; x++) {
      console.log(
        'Creating chunk if it doesn\'t exist:', x, y,
        Chunk.create({xCoord:x, yCoord:y})
      );
    }
  }

  //
  Meteor.publish("map", function(xMin, xMax, yMin, yMax, mapName) {
    xMin = xMin || -1;
    xMax = xMax || 1;
    yMin = yMin || -1;
    yMax = yMax || 1;
    mapName = mapName || 'main'

    var cursor = Chunks.find({
      xCoord:{$gte:xMin, $lte:xMax},
      yCoord:{$gte:yMin, $lte:yMax},
      mapName: mapName
    });

    // Create the requested chunks if necessary
    var size =  (xMax - xMin + 1) * (yMax - yMin + 1)
    if (cursor.count() != size) {
      for (var x = xMin; x <= xMax; x++) {
        for (var y = yMin; y <= yMax; y++) {
          var selector = {xCoord:x, yCoord:y, mapName: mapName};
          if (!Chunks.findOne(selector)) {
            console.log('Create New Chunk:', selector);
            Chunk.create(selector);
          }
        }
      }
    }

    return cursor;
  });

});

  