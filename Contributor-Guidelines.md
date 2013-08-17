### Contributing code to the Meteor project

Before submitting a pull request, make sure that it follows these guidelines:

* Make sure that your branch is based off of the **devel** branch. The **devel** branch is where active development happens.
* Sign the [contributor's agreement](http://contribute.meteor.com/).
* Follow the [Meteor style guide](https://github.com/meteor/meteor/wiki/Meteor-Style-Guide).
* Limit yourself to one feature or bug fix per pull request.
* Name your branch to match the feature/bug fix that you are submitting.
* Write clear, descriptive commit messages.
* Describe your pull request in as much detail as possible: why this pull request is important enough for us to consider, what changes it contains, what you had to do to get it to work, how you tested it, etc.  Be detailed but be clear: use bullets, examples if needed, and simple, straightforward language.

### Package Submission Guidelines

* If you submit a smart package pull request, we want to see strong community interest in the package before we include it in a Meteor release.  Comments on the pull request are great for this.  This helps us keep Meteor core clean and streamlined.

* Your package should have tests. See `packages/coffeescript` or `packages/less` for examples.

* Your package should be documented. See `docs/client/packages`.

* Use a stable version. If it requires an npm module install, make sure to add it to `admin/generate-dev-bundle.sh` with a fixed version number. If the preprocessor is only a few files, you can avoid the dev bundle and simply put the code in the package directory.

* Because the package API is still in flux, and because you can include client-side JS/CSS files directly in your project's `client/lib` directory, the bar is higher for new packages that only include client-side JS/CSS files. 

* Similarly, the bar is higher for new packages that only include JS files with minimal integration. Generally, the test is whether a file can simply be put into your project's `lib` or `server/lib` directory, or if additional effort is needed to make it work.

* Meteor minifies all JS/CSS.  Packages should include only the original JS/CSS files, not the minified versions. 


### Other changes

If you're working on a big ticket item, best to check in first on the #meteor IRC channel or email us at contact@meteor.com.  We'd hate to have to steer you in a different direction after you've already put in a lot of hard work.