TestCollection = new Meteor.Collection("TestCollection");

getTestData = function() {
  return TestCollection.find({ userid: this.userId });
};

