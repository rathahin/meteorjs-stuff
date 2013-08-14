meteor-test-ddp-endpoint
========================

This is an endpoint for testing the Meteor.js DDP protocol from DDP client libraries.

It provides the following methods for unit testing the DDP protocol:
* clearCollection - clears test collection
* addDoc(options) - add testfield=options.value and docnum=options.docnum
* deleteDoc(options) - delete options.id
* updateDoc(options) - update options.id doc with testfield=options.value and testarray.val1=options.value
* deleteUser(email) - deletes specified user so you can test adding one; won't delete the user test@test.com

NOTE: you do have to be logged into the application to use these methods.  This allows you to test the login DDP command.  If you are writing JUnit tests, you can also run them in parallel by using different logins.

FYI, I needed this endpoint to rewrite the current Java DDP protocol skeleton which only handled the websockets data but didn't have support for verifying any of the calls were successful via JUnit tests or doing subscriptions.
