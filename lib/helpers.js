isInt = function(n) {
  return typeof n === 'number' && n % 1 == 0;
};

preventContextMenu = function (myElement) {
  myElement.addEventListener('contextmenu', function(event) {
    event.preventDefault();
  });
};

// Like Math.round, but round down on 0.5
roundPreferDown = function(number) {
  if (number - Math.floor(number) <= 0.5)
    return Math.floor(number);
  else
    return Math.ceil(number);
};

getRandomColor = function() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
};

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};