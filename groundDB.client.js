"use strict";

/*

GroundDB is a thin layer providing Meteor offline database and methods

Concept, localstorage is simple wide spread but slow

GroundDB saves outstanding methods and minimongo into localstorage at window
unload, but can be configured to save at any changes and at certain interval(ms)

When the app loads GroundDB resumes methods and database changes

Regz. RaiX

*/
///////////////////////////////// TEST SCOPE ///////////////////////////////////

_gDB = {};

// Map connection
_gDB.connection = Meteor.connection || Meteor.default_connection;

// Map parseId function
_gDB.idParse = LocalCollection && LocalCollection._idParse ||
        Meteor.idParse;

// State of all subscriptions in meteor
_gDB.subscriptionsReady = false;
_gDB.subscriptionsReadyDeps = new Deps.Dependency();

// TODO: Remove
window.Meteor = Meteor;
////////////////////////////// LOCALSTORAGE ////////////////////////////////////

// Well, I'm still using console.log
window.console = (window && window.console && window.console.log)?
        window.console: {
  log: function() {}
};

// Status of app reload
_gDB._isReloading = false;

// Returns the localstorage if its found and working
// TODO: check if this works in IE
// could use Meteor._localStorage - just needs a rewrite
_gDB._storage = function() {
  var storage,
      fail,
      uid;
  try {
    uid = Random.id();
    (storage = window.localStorage).setItem(uid, uid);
    fail = (storage.getItem(uid) !== uid);
    storage.removeItem(uid);
    if (fail) {
      storage = false;
    }
  } catch(e) {}

  return storage;
};

// get our storage if found
_gDB.storage = _gDB._storage();

_gDB._prefix = 'groundDB.';

// Add a correct prefix for groundDB
_gDB._getGroundDBPrefix = function(suffix) {
  // Should we support multiple users on multiple tabs namespacing data
  // in localstorage by current userId?
  //return prefix + ((Meteor.userId())?Meteor.userId()+'.':'') + suffix;
  return _gDB._prefix + suffix;
};

// save object into localstorage
_gDB._saveObject = function(name, object) {
  if (_gDB.storage && _gDB._isReloading === false) {
    var cachedDoc = EJSON.minify(object);
    try {
      _gDB.storage.setItem(_gDB._getGroundDBPrefix(name), cachedDoc);
    } catch (e) {
      GroundDB.onQuotaExceeded();
    }
  }
};

// get object from localstorage, retur null if not found
_gDB._loadObject = function(name) {
  // If storage is supported
  if (_gDB.storage) {
    // Then load cached document
    var cachedDoc = _gDB.storage.getItem(_gDB._getGroundDBPrefix(name));
    return EJSON.maxify(cachedDoc);
  }
  return null;
};

////////////////////////// MINIMIZE & MAXIMIZE DOCUMENTS ///////////////////////

_gDB.minify = function(bigDoc) {
  return EJSON.stringify(bigDoc);
};

_gDB.maxify = function(smallDoc) {
  return EJSON.parse(smallDoc);
};


/////////////////////////////// ONE TIME OUT ///////////////////////////////////

// This utillity function allows us to run a function - but if its run before
// time out delay then we stop and start a new timeout - delaying the execution
// of the function - TODO: have an option for n number of allowed delays before
// execution of timeout function limitNumberOfTimes
_gDB.OneTimeout = function() {
  var self = this;
  // Pointer to Meteor.setTimeout
  self._id = null;
  // Save the methods into the localstorage
  self.oneTimeout = function(func, delay) {
    self._count++;
    // If a timeout is in progress
    if (self._id !== null) {
      // then stop the current timeout - we have updates
      Meteor.clearTimeout(self._id);
    }
    // Spawn new timeout
    self._id = Meteor.setTimeout(function() {
      // Ok, we reset reference so we dont get cleared and go to work
      self._id = null;
      // Run function
      func();
      // Delay execution a bit
    }, delay);
  };
};

////////////////////////// GET SERVER TIME DIFFERENCE //////////////////////////

_gDB._serverTimeDiff = 0; // Time difference in ms

if (_gDB.storage) {
  // Initialize the _gDB._serverTimeDiff
  _gDB._serverTimeDiff = (1*_gDB.storage.getItem(_gDB._prefix+'timeDiff')) || 0;
  // At server startup we figure out the time difference between server and
  // client time - this includes lag and timezone
  Meteor.startup(function() {
    // Call the server method an get server time
    Meteor.call('getServerTime', function(error, result) {
      if (!error) {
        // Update our server time diff
        _gDB._serverTimeDiff = result - Date.now();// - lag or/and timezone
        // Update the localstorage
        _gDB.storage.setItem(_gDB._prefix + 'timeDiff', _gDB._serverTimeDiff);
      }
    }); // EO Server call
  });
}

//////////////////////////////// GROUND DATABASE ///////////////////////////////

// Add a pointer register of grounded databases
_gDB._groundDatabases = {};

GroundDB = function(name, options) {

  // Inheritance Meteor Collection can be set by options.collection
  // Accepts smart collections by Arunoda Susiripala
  var self;

  // If name is string or null then assume a normal Meteor.Collection
  if (name === ''+name || name === null || typeof name === 'undefined') {
    // We instanciate a new meteor collection, let it handle undefined
    self = new Meteor.Collection(name, options);
  } else {
    // User set a collection in options
    if (name instanceof Meteor.Collection) {
      self = name;
    } else {
      if (name._localCollection instanceof Meteor.Collection) {
        // We are in a smart collection
        self = name._localCollection;
        self.name = name.name;
      } else {
        // self not set, throw an error
        throw new Error('GroundDB got an invalid name or collection');
      }
    }
  }

  // Is this an offline database?
  self.offlineDatabase = false;

  // Initialize collection name
  self.name = (self.name)? self.name : self._name;

  // We have an client-side only offline database
  if (self.name === null) {
    if (typeof options === 'string' && options !== '') {
      // We have a mapped offline only database
      self.name = options;
    } else {
      // No options set for mapping offline db
      self.name = 'null';
    }
    // This is an offline database
    self.offlineDatabase = true;
  }

  /////// Finally got a name... and rigged

  // Add to pointer register
  _gDB._groundDatabases[ self.name ] = self;

  // prefixed supers container
  self.gdbSuper = {};

  // Overwrite the store update
  if (self._connection && self._connection._stores[ self.name ]) {
    // Set super
    self.gdbSuper.storeUpdate = self._connection._stores[ self.name ].update;
    // Overwrite
    self._connection._stores[ self.name ].update = function (msg) {
      console.log('GOT UPDATE');
      // We check that local loaded docs are removed before remote sync
      // otherwise it would throw an error
      if (msg.msg === 'added') {
        var mongoId = _gDB.idParse(msg.id);
        var doc = self._collection.findOne(mongoId);
        // If the doc allready found then we remove it
        if (doc) {
          // We mark the data as remotely loaded
          delete self._localOnly[mongoId];
          // Solve the conflict - server wins
          // Then remove the client document
          self._collection.remove(doc._id);
        }
      }
      // Call super and let it do its thing
      self.gdbSuper.storeUpdate(msg);
    };
  }

  // Flag true/false depending if database is loaded from local
  self._databaseLoaded = false;

  // Map local-only - this makes sure that localstorage matches remote loaded db
  self._localOnly = {};

  // At some point we can do a remove all local-only data
  self._remoteLocalOnly = function() {
    _.each(self._localOnly, function(isLocalOnly, id) {
      if (isLocalOnly) {
        self._collection.remove({ _id: id });
        delete self._localOnly[id];
      }
    });
  };

  Meteor.autorun(function() {
    if (GroundDB.ready()) {
      // If all subscriptions have updated the system the remove all local only
      // data?
      self._remoteLocalOnly();
    }
  });

  // We dont trust the localstorage so we make sure it doesn't contain
  // duplicated id's - primary a problem i FF
  self._checkDocs = function(a) {
    var c = {};
    // We create c as an object with no duplicate _id's
    for (var i = 0, keys = Object.keys(a); i < keys.length; i++) {
      // Extract key/value
      var key = keys[i];
      var doc = a[key];
      // set value in c
      c[key] = doc;
    }
    return c;
  };

  // Bulk Load database from local to memory
  self._loadDatabase = function() {
    // Then load the docs into minimongo
    GroundDB.onResumeDatabase(self.name);
    // Load object from localstorage
    var docs = _gDB._loadObject('db.' + self.name);
    // Initialize client documents
    _.each(self._checkDocs( (docs) ? docs : {} ), function(doc) {
      // Test if document allready exists, this is a rare case but accounts
      // sometimes adds data to the users database, eg. if "users" are grounded
      var exists = self._collection.findOne({ _id: doc._id });
      // If collection is populated before we get started then the data in
      // memory would be considered latest therefor we dont load from local
      if (!exists) {
        self._localOnly[doc._id] = true;
        self._collection.insert(doc);
      }
    });


    // Setting database loaded, this allows minimongo to be saved into local
    self._databaseLoaded = true;
  };

  // One timeout pointer for database saves
  var saveDatabaseDelay = new _gDB.OneTimeout();

  // Use reactivity to trigger saves
  var _gdbDataChanged = new Deps.Dependency();

  // trigger change
  var _gdbDatabaseChanged = function() {
    _gdbDataChanged.changed();
  };

  // Bulk Save database from memory to local, meant to be as slim, fast and
  // realiable as possible
  self._saveDatabase = function() {
    // If data loaded from localstorage then its ok to save - otherwise we
    // would override with less data
    if (self._databaseLoaded) {
      saveDatabaseDelay.oneTimeout(function() {
        // We delay the operation a bit in case of multiple saves - this creates
        // a minor lag in terms of localstorage updating but it limits the num
        // of saves to the database
        // Make sure our database is loaded
        GroundDB.onCacheDatabase(self.name);
        // Save the collection into localstorage
        _gDB._saveObject('db.' + self.name, self._collection.docs);
      }, 200);
    }
  };

  // Observe all changes and rely on the less agressive observer system for
  // providing a reasonable update frequens
  self.find().observe({
    'added': _gdbDatabaseChanged,
    'changed': _gdbDatabaseChanged,
    'removed': _gdbDatabaseChanged
  });

  // Run save database at data changes
  Meteor.autorun(function() {
    _gdbDataChanged.depend();
    self._saveDatabase();
  });

  // Load the database as soon as possible
  self._loadDatabase();

  return self;
};

// TODO: change when linker is official
window.GroundDB = GroundDB;

///////////////////////////////// EVENTS ///////////////////////////////////////

// This is an overridable method for hooking on to the GroundDB events

GroundDB.onQuotaExceeded = function() {
  throw new Error('Quota exceeded!');
};

GroundDB.onResumeDatabase = function(name) {
  console.log('Resume database: ' + name);
};

GroundDB.onResumeMethods = function() {
  console.log('Resume outstanding methods');
};

GroundDB.onMethodCall = function(methodCall) {
  console.log('Method call ' + methodCall.method);
};

GroundDB.onCacheDatabase = function(name) {
  console.log('Cache database: ' + name);
};

GroundDB.onCacheMethods = function() {
  console.log('Cache methods');
};

GroundDB.onTabSync = function(type, key) {
  console.log('Sync tabs - Cache is updated by: ' + type + ((key)?key:''));
};

GroundDB.ready = function() {
  _gDB.subscriptionsReadyDeps.depend();
  return _gDB.subscriptionsReady;
};

GroundDB.now = function() {
  return Date.now() + _gDB._serverTimeDiff;
};

///////////////////////////// RESUME METHODS ///////////////////////////////////

// Is methods resumed?
_gDB._methodsResumed = false;

// Get a nice array of current methods
_gDB._getMethodsList = function() {
  // Array of outstanding methods
  var methods = [];
  var skipThisMethod = { login: true, getServerTime: true };
  // Convert the data into nice array
  _.each(_gDB.connection._methodInvokers, function(method) {
    if (!skipThisMethod[method._message.method]) {
      // Dont cache login or getServerTime calls - they are spawned pr. default
      methods.push({
        // Format the data
        method: method._message.method,
        args: method._message.params,
        options: { wait: method._wait }
      });
    }
  });
  return methods;
};

// Extract only newly added methods from localstorage
_gDB._getMethodUpdates = function(newMethods) {
  var result = [];
  if (newMethods && newMethods.length > 0) {
    // Get the old methods allready in memory
    // We could have done an optimized slice version or just starting at
    // oldMethods.length, but this tab is not in focus
    var oldMethods = _gDB._getMethodsList();
    // Iterate over the new methods, old ones should be ordered in beginning of
    // newMethods we do a simple test an throw an error if thats not the case
    for (var i=0; i < newMethods.length; i++) {

      if (i < oldMethods.length) {
        // Do a hard slow test to make sure all is in sync
        if (EJSON.stringify(oldMethods[i]) !== EJSON.stringify(newMethods[i])) {
          // The client data is corrupted, throw error or force the client to
          // reload, does not make sense to continue?
          throw new Error('The method database is corrupted or out of sync');
        }
      } else {
        // Ok out of oldMethods this is a new method call
        result.push(newMethods[i]);
        GroundDB.onMethodCall(newMethods[i]);
      }
    } // EO for iteration
  } // EO check newMethods
  // return the result
  return result;
};

///////////////////////////// LOAD & SAVE METHODS //////////////////////////////

// load methods from localstorage and resume the methods
_gDB._loadMethods = function() {
  // Load methods from local
  var methods = _gDB._loadObject('methods');

  // We are only going to submit the diff
  methods = _gDB._getMethodUpdates(methods);

  // If any methods outstanding
  if (methods) {
    // Iterate over array of methods
    //_.each(methods, function(method) {
    while (methods.length > 0) {
      // FIFO buffer
      var method = methods.shift();

      // parse "/collection/command" or "command"
      var params = method.method.split('/');
      var command = (params.length > 2)?params[2]:params[1];
      var collection = (params.length > 2)?params[1]:'';
      // TODO: would have been nicer if SmartCollection used same naming as
      // Meteor
      params = ''+params;
      var paramIndex = 0;
      if (params === '_si_' || params === '_su_' || params === '_sr_') {
        // Get collection from SmartCollection call
        command = params;
        collection = method.args[0];
        paramIndex++;
      }

      // Do work on collection
      if (collection !== '') {
        // we are going to run an simulated insert - this is allready in db
        // since we are running local, so we remove it from the collection first
        if (_gDB._groundDatabases[collection]) {
          // The database is registered as a ground database
          var mongoId = _gDB.idParse((method.args && method.args[paramIndex])?
                  method.args[paramIndex]._id || method.args[paramIndex]:'');

          // Get the document on the client - if found
          var doc = _gDB._groundDatabases[collection]._collection.findOne(mongoId);
          if (doc) {
            // document found
            // This is a problem: insert stub simulation, would fail so we
            // remove the added document from client and let the method call
            // re-insert it in simulation
            if (command === 'insert') {
              // Remove the item from ground database so it can be correctly
              // inserted
              _gDB._groundDatabases[collection]._collection.remove(mongoId);
            } // EO handle insert
            // Add tab support in SmartCollections
            if (command === '_su_') { // TODO: Warn if using $inc or $dec?
              // params 0:id 1:modif
              _gDB._groundDatabases[collection]._collection.update({ _id: mongoId },
                      method.args[paramIndex+1]);
            }
            if (command === '_sr_') {
              // param 0:id
              _gDB._groundDatabases[collection]._collection.remove(
                      method.args[paramIndex]);
            }
          } else { // EO Else no doc found in client database
            // Add tab support in SmartCollections
            // param 0:doc
            if (command === '_si_') {
              _gDB._groundDatabases[collection]._collection.insert(
                      method.args[paramIndex]);
            }
          }
        } // else collection would be a normal database
      } // EO collection work
      // Add method to connection
      _gDB.connection.apply(
              method.method, method.args, method.options);
    } // EO while methods
  } // EO if stored outstanding methods

  // Dispatch methods loaded event
  _gDB._methodsResumed = true;
  GroundDB.onResumeMethods();
}; // EO load methods

// Save the methods into the localstorage
_gDB._saveMethods = function() {
  if (_gDB._methodsResumed) {
    // Ok memory is initialized
    GroundDB.onCacheMethods();

    // Save outstanding methods to localstorage
    _gDB._saveObject('methods', _gDB._getMethodsList());
  }
};

//////////////////////////// ALL SUBSCRIPTIONS READY ///////////////////////////

Meteor.setInterval(function() {
    var allReady = true;
    for (var subId in Meteor.connection._subscriptions) {
      var sub = Meteor.connection._subscriptions[subId];
      if (!sub.ready) {
        allReady = false;
        break;
      }
    }
    // Update dependencies
    if (allReady !== _gDB.subscriptionsReady) {
      _gDB.subscriptionsReady = allReady;
      _gDB.subscriptionsReadyDeps.changed();
    }

  }, 5000);

//////////////////////////// STARTUP METHODS RESUME ////////////////////////////

Meteor.startup(function() {
  // Wait some not to conflict with accouts login
  // TODO: Do we have a better way, instead of depending on time should depend
  // on en event.
  Meteor.setTimeout(function() {
    _gDB._loadMethods();
  }, 500);
});

/////////////////////////// SYNC TABS METHODS DATABSE //////////////////////////

var syncDatabaseDelay = new _gDB.OneTimeout();

// Offline client only databases will sync a bit different than normal
// This function is a bit hard - but it works - optimal solution could be to
// have virtual method calls it would complicate things
_gDB._syncDatabase = function(name) {
  // We set a small delay in case of more updates within the wait
  syncDatabaseDelay.oneTimeout(function() {
    var collection = _gDB._groundDatabases[name];
    if (collection && collection.offlineDatabase === true) {
      // Add event hook
      GroundDB.onTabSync('database', name);
      // Hard reset database?
      var newDocs = _gDB._loadObject('db.' + name);
      collection.find().forEach(function(doc) {
        // Remove document
        collection._collection.remove(doc._id);
        // If found in new documents then hard update
        if (typeof newDocs[doc._id] !== 'undefined') {
          // Update doc
          collection._collection.insert(newDocs[doc._id]);
          delete newDocs[doc._id];
        }
      });
      _.each(newDocs, function (doc) {
        // insert doc
        collection._collection.insert(doc);
      });
    }
  }, 150);
};

var syncMethodsDelay = new _gDB.OneTimeout();

// Syncronize tabs via method calls
_gDB._syncMethods = function() {
  // We are going to into reload, stop all access to localstorage
  _gDB._isReloading = true;
  // We are not master and the user is working on another tab, we are not in
  // a hurry to spam the browser with work, plus there are typically acouple
  // of db access required in most operations, we wait a sec?
  syncMethodsDelay.oneTimeout(function() {
    // Add event hook
    GroundDB.onTabSync('methods');
    // Resume methods
    _gDB._loadMethods();
    // Resume normal writes
    _gDB._isReloading = false;
  }, 150);
};

/////////////////////// ADD TRIGGERS IN LIVEDATACONNECTION /////////////////////

// Modify connection, well just minor
_.extend(_gDB.connection, {
  // Define a new super for the methods
  _gdbSuper: {
    apply: _gDB.connection.apply,
    _outstandingMethodFinished:
    _gDB.connection._outstandingMethodFinished
  },
  // Modify apply
  apply: function(/* arguments */) {
    var self = this;
    // Intercept grounded databases
  //  var args = _interceptGroundedDatabases(arguments);
    // Call super
    self._gdbSuper.apply.apply(self, arguments);
    // Save methods
    _gDB._saveMethods();
  },
  // Modify _outstandingMethodFinished
  _outstandingMethodFinished: function() {
    var self = this;
    // Call super
    self._gdbSuper._outstandingMethodFinished.apply(self);
    // We save current status of methods
    _gDB._saveMethods();
  }
});

/////////////////////// LOAD CHANGES FROM OTHER TABS ///////////////////////////

// Add support for multiple tabs
window.addEventListener('storage', function(e) {
  // Data changed in another tab, it would have updated localstorage, I'm
  // outdated so reload the tab and localstorage - but we test the prefix on the
  // key - since we actually make writes in the localstorage feature test
  var prefixDatabaseRegEx = new RegExp('^' + _gDB._prefix + 'db.');

  // Method calls are delayed a bit for optimization
  if (e.key === _gDB._prefix + 'methods') {
    _gDB._syncMethods('mehods');
  }

  // Sync offline client only databases - These update instantly
  if (prefixDatabaseRegEx.test(e.key)) {
    _gDB._syncDatabase(e.key.replace(prefixDatabaseRegEx, ''));
  }
}, false);
