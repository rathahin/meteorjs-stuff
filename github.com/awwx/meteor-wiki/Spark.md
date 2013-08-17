# Spark

Spark is a "live page update engine." It's machinery to track the reactive regions of a page and rerender them as necessary. Spark has very few dependencies and is intended to be usable separately from the rest of Meteor.  It's MIT licensed like the rest of our work.

You could think of Spark as a declarative version of jQuery. jQuery is imperative. To get work done in jQuery, you tell it to carry out a series of actions: "Find these nodes. Add this class to them. Replace this thing with that." Spark is declarative. You tell it what you want to have happen: "Make that region of the page look like this, keeping it updated as its data dependencies change." Spark figures out how to make it happen.

Spark is intended to be a low-level building block. It's the basis for Meteor's templating support, and Meteor developers should never need to know about it or call it. You'd use Spark from a Meteor project if you're writing your own templating system (eg, packaging a Handlebars alternative), or if you're doing something fancy and low-level.

Spark is tested in modern browsers and IE 7+.

## Dependencies

The following Meteor packages are used by Spark:

* `deps`, Meteor's tiny dependency tracking kernel. Provides the concepts of "current context", "invalidation", and "flushing".

* `liverange`, a specialized data structure that lets you mark regions in the DOM, track the regions as they move around, walk the region hierarchy, and replace the contents of a region.

* `universal-events`, a cross-browser library for listening to events anywhere in the DOM.

* `domutils`, a toolbox of cross-brower DOM manipulation functions

You can generate a standalone `spark.js` by running the shell script `admin/spark-standalone.sh` in the Meteor repository.

If jQuery or Sizzle is present in the browser, Spark will use Sizzle for selector matching.  Otherwise it will use the browser's `querySelectorAll` function, which requires a modern browser or IE 8+.

## Spark.render, the main Spark entry point

    Spark.render(function () { return "<div>my document</div>"; }) => DocumentFragment

Takes a function that returns some HTML as a string. Calls that function parses the HTML into DOM nodes, and returns the nodes as a DocumentFragment. You can then insert the DocumentFragment whenever you like in the DOM.

Inside the function, you can call any of the following Spark "annotation functions" to attach special behaviors to particular regions in your HTML. Spark saves the annotation instruction to a list and drops a temporary marker into the HTML to indicate where it goes. Later, in a process called materialization, Spark strips out the markers, creates the DOM nodes, and attaches each of the requested behaviors.

When the annotation functions are not called from inside Spark.render, they are harmless no-ops. This makes it easy to create "dual use" templates that can be rendered either to strings (when called directly) or to DOM nodes (when called inside Spark.render.)

The DocumentFragment returned by Spark.render should be inserted into the DOM document immediately. If, at flush time (see 'deps' documentation), the rendered nodes aren't in the document, then Spark will clean up the nodes, tearing down the annotations and calling any `destroyed` functions that you have set up.


## Spark annotation types

_Events._ Event handlers can be attached to any range of elements in the HTML, filtered further by event type and CSS selector.

_Data context._ Each point in the HTML has a "current data context", which is an arbitrary object that you provide. You can use Spark.getDataContext(node) to retrieve the data context at any given node. In the Handlebars package, this is used to store the current Handlebars data so that it can be retrieved from inside an event handler.

_Isolate._ An "isolate" is a region of the HTML that is reactive, that is, defined by a function rather than a constant string. When the output of the function changes (as signaled with the 'deps' system), the function is re-run and the new output is swapped in.

_List._ A region of the HTML that is defined by a HTML generation function that is called once for each item in a collection. The collection is reactive -- it is defined not by an array but rather by a stream of 'added', 'changed', 'moved', and 'removed' events. As the contents of the collection changes, the page is updated.

_Landmark._ Landmarks are used to preserve information across automatic redraws of the HTML (eg, triggered by Isolates.) A landmark identifies a "logical place" in the HTML. Once you've set up a landmark, you can set attributes on the landmark that are preserved across redraws; get callbacks when the landmark is created or destroyed, or when any part of its contents is rerendered; mark certain node in the landmark as "preserved" so that they will not be disturbed in the rerendering process; or mark the whole landmark as "constant" so that the redraw process won't disturb it.

_Branch label._ A branch label is a marker that is used to match up landmarks. For example, if you have a "person" template that twice invokes an "address" template, you might use labels to mark one address as Home and the other address as Work. This makes it possible for Spark's update engine to disambiguate landmarks inside the address template, so that it can preserve landmark data even if the addresses get reordered during a redraw. In the Handlebars package, branch labels are automatically generated based on line numbers in the template source code.


## Spark annotation functions

    html = Spark.attachEvents({ ... event map ...}, html)

Attach some events to a region of HTML. The format of the event map is similar to that used elsewhere in Meteor: {'click .item1, click .item2': function (event, landmark) { ... } }. The arguments to the event handler are:

event: a cross-browser-normalized description of the event. The event is normalized roughly to the HTML5 spec.
landmark: the nearest landmark enclosing the event annotation (not the nearest landmark enclosing the node where the event occurred.)
this: the nearest data annotation enclosing the node where the event occurred.)

    html = Spark.setDataContext(dataObject, html)

Attach some data to a region of HTML. You can retrieve it later with Spark.getDataContext.

    html = Spark.isolate(function () { return "<div>some html</div>"; })

Create an area of the document that changes reactively. The function is called once to get the initial HTML for the area. Then, the function is automatically called again when its output could have changed, according to the registrations made with the 'deps' system when the function was initially called. The document is then patched up automatically with the new contents.

__This is the only function in the Spark API that creates reactivity based on the deps system.__ Spark.render and Spark.list do not do it automatically. If you want the contents of those areas to update automatically, put a call to isolate immediately inside of them.

    html = Spark.list(cursor, function (item) { return "html"; }, function () { return "html"; })

Create an area of the document that tracks the contents of a reactive collection. 'cursor' describes the collection (see below). The first function will be called once for each item in the collection, and the results concatentated together. If there are no items in the collection, the second function will be called instead. (It is optional and defaults to a function that returns the empty string.) As the contents of the collection changes, the functions are rerun as necessary and the document is updated in place. An efficient sequence of DOM operations is used. For example, if a node is moved in the collection order without changing, the DOM nodes that represent it will be moved rather than rerendered.

The contract for 'cursor' is simple. It must have a function 'observeChanges(callbacks)' where callbacks is the following:

* addedBefore(id, fields, before): Called when a new item has been added to the collection before item `before`

* removed(id): Called when the item with id `id` is removed

* movedBefore(id, before): Called when the item with id `id` moved before the item with id `before`

* changed(id, fields): Called when the item with id `id` has changed.  The new fields are specified; the removed fields are bound to `undefined`

When observeChanges() is called, it must immediately call addedBefore() once for each item in the collection, before returning. And it must arrange for the other functions to be called as appropriate as the contents of the collection changes.

'observeChanges' must return an "observe handle", an object with the following method:

* stop(): Stop delivering addedBefore/removed/movedBefore/changed callbacks, and free up any resources associated with the observeChanges call.

```
    html = Spark.labelBranch(label, function () { return "<div>some html</div>"; })
```

Drop a branch label. 'label' must be a string, or `null` to not drop a label after all.  The special value `Spark.UNIQUE_LABEL` can also be used to drop a label that will be different on each rendering and therefore never match.

Branch labels are hints that are used to match landmarks when the template is redrawn. The rule is this: each landmark must have a unique branch path. A landmark's "branch path" is the sequence of labels that you encounter if you start at a landmark and walk up to the root of the document.

Note that function does not take an HTML string -- instead it takes a function that returns an HTML string. Spark needs this so that it can perform lazy landmark matching as the template is rendered. This is what makes it possible to retrieve landmark data during rendering.

Passing the value Spark.UNIQUE_LABEL instead of a label will cause Spark to generate a unique unmatchable label.

    html = Spark.createLandmark(options, function (landmark) { return "<div>html</div>"; })

Declare a landmark at this point in the document. If this is the first rendering of this (instance of) this template, creates a new landmark according to 'options'.  Otherwise, if this is a template that is getting rerendered, finds the already existing landmark from the previous incarnation of this template and carries it forward, replacing its configuration with 'options'.

Landmarks are instances of Spark.Landmark and have these attributes:

* id: a unique numeric id for this landmark. It remains constant as the landmark is rerendered. In combination with the 'created' and 'destroyed' callbacks (below), you can use this as a key to store additional information about the landmark in your own module.

* firstNode(), lastNode(): return the first and last DOM nodes in the current rendering of this landmark. These can change over time as the template is rerendered. Do not call these functions before the first rendering of the landmark.

* find(selector): find the first node in the landmark that matches the given CSS selector, or return null if there is none.

* findAll(selector): as find, but returns a (possibly) empty array of nodes matching the selector.

options may contain the following:

* created: function to call when the landmark is first created. Receives the landmark in 'this'.

* rendered: function to call when any part of the contents of the landmark is rerendered. Receives the landmark in 'this'.

* destroyed: function to call when the landmark is destroyed. This happens when the landmark is not part of the DOM document at flush time, but Spark may not always detect this condition immediately (eg, if you manually remove elements from the DOM without telling Spark, it will not be detected until the next time the region containing the landmark is redrawn.) Receives the landmark in 'this'.

* preserve: nodes to preserve when the landmark or its contents are redrawn. Either a list of selector, or a map from selectors to element labeling functions. Preserving a node means that it will not change (in the sense of === equality) during a redraw, even if its siblings, children, or attributes change. Moreover, it will be left in place in the DOM (it will not be removed and then reinserted.) Preserving a node necessarily preserves all of its parents. See complete documentation in the Meteor templating API under Template.myTemplate.preserve.

* constant: if set to true, this is a constant region. Its entire contents will preserved unchanged during redraws. Please note an implementation limitation: event annotations do not work reliably inside constant regions.

Each landmark must have a unique branch path. That means that if you want to create more than one landmark, you must make an appropriate set of calls to Spark.labelBranch.


### Other core Spark functions

    Spark.getDataContext(node)

Find the nearest setDataContext call enclosing the given DOM node, and return the dataObject that was passed to it.


### Meteor Convenience Functions

Meteor provides a simplified wrapper around Spark as a convenience to high-level Meteor users.  These functions are documented [in the meteor docs](http://docs.meteor.com/#meteor_render):

    Meteor.render("<div>html</div>") => DocumentFragment
    Meteor.render(function () { return "<div>html</div>"; })) => DocumentFragment

This is a thin wrapper around Spark.render and Spark.isolate.  Where as Spark.render does not itself create a reactive context, Meteor.render does.

    Meteor.renderList(cursor, function (item) { return "html"; }, function () { return "html"; }) => DocumentFragment

This is a thin wrapper around Spark.render, Spark.list, Spark.labelBranch, and Spark.isolate.  Spark.list does not itself create reactive contexts or branch labels.  The branch labels created by Meteor.renderList are based on the `_id` property of the documents provided by the cursor.
