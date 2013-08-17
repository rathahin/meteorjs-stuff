### How To Get Help

First, look through these resources to see if your question has been answered already:
* [Official Meteor Docs](http://docs.meteor.com)
* [Questions tagged 'meteor' on StackOverflow](http://stackoverflow.com/questions/tagged/meteor)
* [Unofficial Meteor FAQ](http://github.com/oortcloud/unofficial-meteor-faq)
* [meteor-talk mailing list](https://groups.google.com/forum/?fromgroups#!forum/meteor-talk) - public discussion list
* [meteor-core mailing list](https://groups.google.com/forum/?fromgroups#!forum/meteor-core) - for discussing Meteor internals and proposed changes to Meteor itself

Make a good first effort to find an answer before asking your question. If you can't find an existing answer to your question, try one of the following, in this order:
* Ask it on StackOverflow
* Ask it in IRC #meteor channel on irc.freenode.net
* Ask it on meteor-talk

### Other Resources

* The [Meteor Roadmap](http://roadmap.meteor.com) shows the core team's current development priorities
* Follow the [Meteor Style Guide](https://github.com/meteor/meteor/wiki/Meteor-Style-Guide)
* What those [GitHub Issue Labels](https://github.com/meteor/meteor/wiki/GitHub-Issue-Labels) in our issue queue mean

### <a name="bugs"></a>Filing Bug Reports

If you've found a bug in Meteor, file a bug report in [our issue tracker](https://github.com/meteor/meteor/issues). However, a Meteor app has many moving parts, and it's often difficult to reproduce a bug based on just a few lines of code. If you want somebody to be able to fix a bug (or verify a fix that you've contributed), the best way is:

* Create a new Meteor app that displays the bug with as little code as possible. Try to delete any code that is unrelated to the precise bug you're reporting.
* Create a new GitHub repository with a name like `meteor-reactivity-bug` (or if you're adding a new reproduction recipe to an existing issue, `meteor-issue-321`) and push your code to it. (Make sure to include the `.meteor/packages` file!)
* Reproduce the bug from scratch, starting with a `git clone` command. Copy and paste the entire command-line input and output, starting with the `git clone` command, into the issue description of a new GitHub issue. Also describe any web browser interaction you need to do.
* Specify what version of Meteor (`$ meteor --version`) and what web browser you used.

By making it as easy as possible for others to reproduce your bug, you make it easier for your bug to be fixed. **Issues opened without a reproduction recipe are likely to be immediately closed with a pointer to this wiki section and a request for more information.**

### How To Contribute

Contributing doesn't necessarily mean working on Meteor internals.  See the [Get Involved page on meteor.com](http://www.meteor.com/get-involved) for a starter list of ways to contribute. You might also want to check out the [Meteor Roadmap](http://roadmap.meteor.com).

To contribute code to Meteor core, submit a pull request.  Follow the [Contributor Guidelines](https://github.com/meteor/meteor/wiki/Contributor-Guidelines), please!

### Works In Progress

Here are drafts of docs that haven't made it into http://docs.meteor.com yet.  You may find these useful.  We appreciate suggestions and improvements: file issues or submit pull requests.

* [Advanced Template Demo](http://advanced-template-demo.meteor.com/) / [source for the demo](https://github.com/meteor/meteor/tree/devel/examples/other/template-demo)
* [Spark](https://github.com/meteor/meteor/wiki/Spark)
* [Handlebars](https://github.com/meteor/meteor/wiki/Handlebars)
* [Supported Platforms](https://github.com/meteor/meteor/wiki/Supported-Platforms)

### Community Packages

There is a small but growing list of community-created packages on [Atmosphere](https://atmosphere.meteor.com/).  These are packages that have been created with [Meteorite](https://github.com/possibilities/meteorite).

### Meteor Blogs

Do you blog about Meteor regularly? File an issue with a link to your blog's "Posts tagged 'meteor'" page, and we'll add it here.

* [Tom Coleman's blog](http://bindle.me/blog)
* A particularly nice [tutorial by Andrew Scala](http://andrewscala.com/meteor) on his blog