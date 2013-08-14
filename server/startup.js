// Server-side startup code

Meteor.startup(function () {
  // code to run on server at startup
});

// only one collection to publish
Meteor.publish("testData", getTestData);

// and the users collection
Meteor.publish("users", function() {
  return Meteor.users.find();
});

