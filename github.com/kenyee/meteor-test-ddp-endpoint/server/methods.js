// Server side methods for Unit test methods for DDP protocol

Meteor.methods({
    clearCollection: function(options) {
      if (! Meteor.userId()) {
        throw new Meteor.Error(403, "You must be logged in");
      }
      TestCollection.remove({ userid: Meteor.userId() });
      return true;
    },

    addDoc: function(options) {
      if (! Meteor.userId()) {
        throw new Meteor.Error(403, "You must be logged in");
      }
      return TestCollection.insert({ userid: Meteor.userId(), testfield: options.value, testarray: { val1: "1", val2: 2, val3: {sub1: "a", sub2: "b"}, docnum: options.docnum }});
    },

    updateDoc: function(options) {
      if (! Meteor.userId()) {
        throw new Meteor.Error(403, "You must be logged in");
      }
      TestCollection.update({ _id: options.id, userid: Meteor.userId() },
		 {$set: {testfield: options.value, 'testarray.val1': options.value}});
    },

    deleteDoc: function(options) {
      if (! Meteor.userId()) {
        throw new Meteor.Error(403, "You must be logged in");
      }
      TestCollection.remove({ _id: options.id, userid: Meteor.userId() });
    },

    deleteUser: function(email) {
      if ((email == null) || (email == "test@test.com"))  {
        throw new Meteor.Error(404, "Invalid user email");
      }
      Meteor.users.remove({'emails.address': email});
    }
});

