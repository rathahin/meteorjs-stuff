/*------------------------------------------------------------
Unredictable behavior if the same actionName is bound to two 
different input keys
------------------------------------------------------------*/

Beautiful.Input = function() {

  // ascii key codes to strings representing input gestures? or Actions?
  this.bindings = {};

  // actionName strings mapped to input state
  // keys: actionName strings 
  // values: actions - JS objects with the format: {
  //      downTime 
  //      downFrameCount 
  //      upTime
  //      upFrameCountCount
  // }
  this.actions = {};

  // always keep track of mouse movement, even if no action is bound
  this.mouse = {
    simPos:           {x:0, y:0},
    deltaPos:         {x:0, y:0},
    moveTime:         new Date(),
    moveFrameCount:   0,
  };
};


/*------------------------------------------------------------
bind
drag
hold
isDown
tap

_keyDown
_keyUp
_mouseDown
_mouseMove
_mouseUp

TAP_THRESH
KEY
------------------------------------------------------------*/
Beautiful.Input.prototype = {

bind: function(keyCode, actionString) {
  var sim = gGame.simulation;
  this.bindings[keyCode] = actionString;
  this.actions[actionString] = {
    downTime: new Date(0),
    downFrameCount: -2,
    upTime: new Date(1),
    upFrameCount: -1,
  };
},

drag: function(actionName) {
  var action = this.actions[actionName];
  if (!action) return null;

  if (this.hold(actionName) && // the action is holding
    this.mouse.moveFrameCount === gGame.simulation.frameCount) // mouse moved this frame
    return true;

  return false;
},

hold: function(actionName) {
  var action = this.actions[actionName];
  if (!action) return null;

  var sim = gGame.simulation;
  var downDuration = sim.frameTime - action.downTime;

  if (action.downFrameCount > action.upFrameCount && // action is down
    downDuration > this.TAP_THRESH) // and has been down for a while
    return true;

  return false;
},

isDown: function(actionName) {
  var action = this.actions[actionName];
  if (!action) return null;

  if (action.downFrameCount > action.upFrameCount) 
    return true;

  return false;
},

tap: function(actionName) {
  var action = this.actions[actionName];
  if (!action) return null; 

  var sim = gGame.simulation;
  var downDuration = action.upTime - action.downTime; // accurate when upTime happened in this frame
 
  if (downDuration > 0 &&
    action.upFrameCount === sim.frameCount && // keyUp happened in this Frame
    downDuration <= this.TAP_THRESH) {
    return true; 
  }

  return false
},

up: function(actionName) {
  var action = this.actions[actionName];
  if (!action) return null; 

  if (action.upFrameCount === gGame.simulation.frameCount)
    return true;

  return false;
},

_keyDown: function(keyCode, event) {
  // if there is no action associated with this key, ignore
  var actionName = this.bindings[keyCode];
  if (!actionName) return;

  var action = this.actions[actionName];

  // don't let the browser handle this key
  if (keyCode >= 0 && event.cancelable) event.preventDefault();

  // if the last event was a key down don't re-trigger!
  if (action.downFrameCount > action.upFrameCount) return;

  var sim = gGame.simulation;
  action.downTime = sim.frameTime;
  action.downFrameCount = sim.frameCount;
},

_keyUp: function(keyCode, event) {
  var actionName = this.bindings[keyCode];
  if (!actionName) return;

  // if the action is up, don't do keyUp again
  if (!this.isDown(actionName)) return;
  var action = this.actions[actionName];
  var sim = gGame.simulation;
  action.upTime = sim.frameTime;
  action.upFrameCount = sim.frameCount;
},

_mouseDown: function(event) {
  var keyCode = (event.button === 0) ? this.KEY.MOUSE1 : this.KEY.MOUSE2;
  this._keyDown(keyCode, event);
},

_mouseMove: function(position, event) {
  this.mouse.deltaPos.x = position.x - this.mouse.simPos.x;
  this.mouse.deltaPos.y = position.y - this.mouse.simPos.y;
  this.mouse.simPos.x = position.x;
  this.mouse.simPos.y = position.y;
  this.mouse.moveTime = gGame.simulation.frameTime;
  this.mouse.moveFrameCount = gGame.simulation.frameCount;
  //console.log(this.mouse.deltaPos);
},

_mouseUp: function(event) {
  var keyCode= (event.button === 0) ? this.KEY.MOUSE1 : this.KEY.MOUSE2;
  this._keyUp(keyCode, event);
},

TAP_THRESH: 200, // in milisec

KEY: {
  'MOUSE1': -1,
  'MOUSE2': -3,
  //'MWHEEL_UP': -4,
  //'MWHEEL_DOWN': -5,

  'BACKSPACE': 8,
  'TAB': 9,
  'ENTER': 13,
  'PAUSE': 19,
  'CAPS': 20,
  'ESC': 27,
  'SPACE': 32,
  'PAGE_UP': 33,
  'PAGE_DOWN': 34,
  'END': 35,
  'HOME': 36,
  'LEFT_ARROW': 37,
  'UP_ARROW': 38,
  'RIGHT_ARROW': 39,
  'DOWN_ARROW': 40,
  'INSERT': 45,
  'DELETE': 46,
  '0': 48,
  '1': 49,
  '2': 50,
  '3': 51,
  '4': 52,
  '5': 53,
  '6': 54,
  '7': 55,
  '8': 56,
  '9': 57,
  'A': 65,
  'B': 66,
  'C': 67,
  'D': 68,
  'E': 69,
  'F': 70,
  'G': 71,
  'H': 72,
  'I': 73,
  'J': 74,
  'K': 75,
  'L': 76,
  'M': 77,
  'N': 78,
  'O': 79,
  'P': 80,
  'Q': 81,
  'R': 82,
  'S': 83,
  'T': 84,
  'U': 85,
  'V': 86,
  'W': 87,
  'X': 88,
  'Y': 89,
  'Z': 90,
  'NUMPAD_0': 96,
  'NUMPAD_1': 97,
  'NUMPAD_2': 98,
  'NUMPAD_3': 99,
  'NUMPAD_4': 100,
  'NUMPAD_5': 101,
  'NUMPAD_6': 102,
  'NUMPAD_7': 103,
  'NUMPAD_8': 104,
  'NUMPAD_9': 105,
  'MULTIPLY': 106,
  'ADD': 107,
  'SUBSTRACT': 109,
  'DECIMAL': 110,
  'DIVIDE': 111,
  'F1': 112,
  'F2': 113,
  'F3': 114,
  'F4': 115,
  'F5': 116,
  'F6': 117,
  'F7': 118,
  'F8': 119,
  'F9': 120,
  'F10': 121,
  'F11': 122,
  'F12': 123,
  'SHIFT': 16,
  'CTRL': 17,
  'ALT': 18,
  'PLUS': 187,
  'COMMA': 188,
  'MINUS': 189,
  'PERIOD': 190
}

}; // Beautiful.Input.prototype
