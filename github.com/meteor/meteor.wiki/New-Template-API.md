# New Template API

### This API was released in Meteor 0.4.0.

The latest versions of these APIs can be found in the [official docs](http://docs.meteor.com/#templates_api) and the [Spark wiki page](https://github.com/meteor/meteor/wiki/Spark).

## Introduction

This release adds the following features:

* __Easy embedding of non-Meteor widgets.__ Just wrap a part of your template in `{{#constant}}..{{/constant}}` and Meteor will leave it alone. No matter how much other parts of the page change, constant regions won't be rerendered. This answers https://github.com/tmeasday/unofficial-meteor-faq#how-do-i-stop-meteor-from-reactively-overwriting-dom-changes-from-outside-meteor

* __Template callbacks.__ You can get callbacks throughout the lifecycle of a template. You can get a callback when a template is rendered for the first time; when the template has been rendered and placed on the screen (meaning it can be manipulated by other libraries like jQuery); and even when the template has been taken off the screen (so you can tear down any resources associated with it, like timers.) This answers https://github.com/tmeasday/unofficial-meteor-faq#how-do-i-get-a-callback-that-runs-after-my-template-is-attached-to-the-dom

* __Keeping per-template state.__ You can associate some information with each instance of a template that's on the screen. For example, if you have an "edit address" template that could appear multiple times, you can keep track of the validation state separately for each instance.

* __Node preservation.__ Sometimes you need certain nodes of a template to not be disturbed by the rerendering process. You want the node's attributes and childen to be updated, but you want the node itself to be left in place. This comes up often with `<input>` elements (preserving cursor position and focus) or with CSS animations (recreating the node would restart the animation.) Now, just specify the nodes you want preserved with CSS selectors, and it will be done. This answers https://github.com/tmeasday/unofficial-meteor-faq#how-do-i-animate-when-meteor-changes-things-under-me

* __Finding nodes in a template.__ From an event handler, you can now easily find the nodes in a template by selector so you can manipulate them. It's as easy as `template.find('.mybutton')`. This works in template rendered callbacks too.

## About Spark

This release is based on a new package called Spark. Spark is a "live page update engine." It's machinery to track the reactive regions of a page and rerender them as necessary. It's a complete rewrite of the old liveui package. Spark weighs in at 8k gzipped and minified, including all of its dependencies, and is intended to be able to be used separately from the rest of Meteor. It's MIT licensed like the rest of our work, so you're welcome to do just that :)

You could think of Spark as a declarative version of jQuery. jQuery is imperative. To get work done in jQuery, you tell it to carry out a series of actions: "Find these nodes. Add this class to them. Replace this thing with that." Spark is declarative. You tell it what you want to have happen: "Make that region of the page look like this, keeping it updated as its data dependencies change." Spark figures out how to make it happen.

Spark is intended to be a low-level building block. New Meteor developers should never need to know about it or call it. You'd use Spark if you're writing your own templating system (eg, packaging a Handlebars alternative), or if you're doing something fancy and low-level. Spark replaces the old Meteor.ui calls (Meteor.ui.render, Meteor.ui.chunk, Meteor.ui.listChunk) with a more powerful and orthogonal set of primitives.

## Breaking changes

You'll need to update the following things in your code.

* Previously, Meteor would use a heuristic to preserve certain elements in the DOM across updates, based on 'id' and 'name' attributes. This heuristic has been removed. If you need your `<input>` elements preserved, you'll need to ask for it explicitly with Template.foo.preserve.

* In the past, you attached to a template with Template.foo.events = { ... }. For consistency with the new API, this is now a function: Template.foo.events({ ... }). However, we've kept backward compatibility with the old way for now.

* If you had template helpers named 'created', 'rendered', 'destroyed', or 'preserve', they'll conflict with the new API. Either rename them, or use the new Template.foo.helpers({ ... }) notation to add them without fear of conflicts.

* The Meteor.ui.render, Meteor.ui.chunk, and Meteor.ui.listChunk functions are gone. If any of your code uses these functions, you'll need to port it to Spark. If you need help please contact David or Geoff.

## Usage Overview

### If you have a template named 'foo':

#### Template.foo.created = function () { ... }

Function to call when the template is created. You can set whatever properties you like on `this` and they will be passed through to the `rendered` and `destroyed` callbacks. Also, `this.data` has the data that was passed into the template.

#### Template.foo.rendered = function () { ... }

Function to call whenever the template is turned into DOM nodes and put on the screen, and again whenever any part of the template is rerendered. `this` will have whatever properties you set up in `created`, and also firstNode and lastNode (the beginning and end of the template in the DOM), find and findAll (find nodes in the template by selector), and data (as before.)

#### Template.foo.destroyed = function () { ... }

Function to call whenever the template is taken off the screen and disposed of. `this` is as before.

#### Template.foo.preserve(['.thing1', '.thing2'])

Find the node in the template that matches the provided selectors. Make sure that they are preserved in-place whenever the template is rerendered, so that CSS animations continue and so that JavaScript points to the node remain valid. There must be only one node in the template that matches each selector.

#### Template.foo.events({ ... event map ... })

Attach events to a template. Just like the old Template.foo.events = {...} syntax, but can be called multiple times.

#### Template.foo.helpers({ thing: function () { ... } })
Register helper functions that can be called from a template. An alternative to Template.foo.thing = function () { ... }, but you can use it if you want to add a helper named something like 'events' or 'helpers' or 'created'.

### Inside a Handlebars template:

#### {{#constant}} ... {{/constant}}

Mark a region as constant. Meteor will leave it alone and never redraw it. In the current release, Meteor events are not supported within constant regions.

#### {{#isolate}} ... {{/isolate}}

Most people will never have a reason to use this. It puts part of a template in its own dependency context, so that changes there will only cause that area to be redrawn, not the whole template. But if you're depending on redraw behavior, you're probably doing something wrong. Instead you should use constant regions, and preserve so that you don't care when your template is redrawn.

### From an event handler:

Event handlers now take two parameters, `event` and `template`. `event` is the normalized event, as before. `template` is the template information -- it's got any data you set up in `created` and `rendered`, plus firstNode, lastNode, find, findAll, and data. `this` is still the data context at the point where the event occurred (not necessarily the same as template.data, which is what the data context was at the top of the template.)

## Out of scope for this release

(1) Accessing template data (eg, set up in 'created') from inside a helper.

(2) Preserving template data across hot code pushes.

(3) Animation support beyond CSS animations. We need a low-level Spark hook to delay the DOM processing of items leaving collections so that animations can run (https://github.com/tmeasday/unofficial-meteor-faq#how-do-i-animate-things-addingbeing-removed-from-collections). And we need a high-level API that makes it easy to define reusable animation schemes and attach them to components.

(1) and (2) will have to be tackled soon as part of the form controller work. (3) definitely needs to happen but isn't on our calendar. If you have an opinion as to whether (3) should block Meteor 1.0, please share it on meteor-core.

## API Reference

#### Template.myTemplate.rendered = function () {...}

This callback is called when an instance of Template.myTemplate is rendered and put on the page for the first time, and again each time any part of the template is re-rendered.

Note: There's currently no way to tell which part of the template changed to cause the callback.  The first rendered() received after created() is by far the most useful.

In the body of the callback, `this` is a template instance object with the following methods and fields:

* __nodes = this.findAll(selector)__ - Finds all elements matching `selector` inside this template instance.  The selector is scoped to the contents of the template, so all elements returned, as well as all elements named in the selector, are within this template.

* __node = this.find(selector)__ - Finds one element matching `selector` inside this template instance, or returns null.

* __this.firstNode, this.lastNode__ - These two nodes indicate the extent of the rendered template in the DOM.  `firstNode` and `lastNode` are siblings, with `lastNode` coming after `firstNode` (or they may be the same node).  The rendered template includes these nodes, their intervening siblings, and their descendents.

* __this.data__ - The Handlebars data context of the template invocation.

The template instance object is unique per occurrence of the template and persists across re-renderings.  You can add whatever additional properties you want to the object.  Property names starting with "_" are guaranteed to be available for your use.  Use the `created` and `destroyed` callbacks to perform initialization or clean-up on the object.

#### Template.myTemplate.created = function () {...}

This callback is called when Template.myTemplate is invoked as a new occurrence of the template and not as a re-rendering.  Inside the callback, `this` is a new template instance object.  Properties you set on this object will be visible from callbacks like rendered() and destroyed(), and also from event handlers.

Each time Template.myTemplate is called, Meteor determines if this call corresponds to some previous rendering of the template on the page.  If it does, no created() callback is called; the rendered() callback will be called with the template instance object taken from the previous rendering.  If the call to Template.myTemplate does not correspond to any previous occurrence of the template, the created() callback is called with a fresh template instance object as `this`.  The result is that even if a template and its surroundings are recalculated and rerendered, corresponding calls will be matched and the data associated with each template instance will persist.

You cannot access the DOM from a created() callback, but you can access `this.data` and get and set your own properties on `this` (see rendered).

Every created() has a corresponding destroyed(); that is, if you get a created() callback with a certain template instance object in `this`, you will eventually get a destroyed() callback for the same object.

#### Template.myTemplate.destroyed = function () {...}

This callback is called when an occurrence of a template is taken off the page for any reason and not replaced with a re-rendering.  The template instance object in `this` is the same object passed to other callbacks on this occurrence of the template.

You cannot access the DOM from a destroyed() callback, but you can access `this.data` and get and set your own properties on `this` (see rendered).

This callback is most useful for cleaning up or undoing any external effects of created().

#### Template.myTemplate.preserve([selector1, selector2, ...])
#### Template.myTemplate.preserve({selector1: function (node) { /* return label */ }, ...});

The `preserve` directive tells Meteor to ensure certain elements remain the same (`===`) when the template is redrawn.  Meteor will *patch around* the elements rather than replacing them, so that they remain the same DOM nodes.  Moreover, the nodes are guaranteed to be left in the DOM (not removed and reinserted).

Preservation is useful in a variety of cases where replacing a DOM element with an identical or modified element would not have the same effect as retaining the original element.  With the right `preserve` calls, you can change a template's HTML and:

* CSS animations will run without interruption
* iframes won't reset or reload
* cursor position and selection in active `<input>` elements will be preserved
* form control interaction (with buttons, checkboxes, etc.) won't be interrupted
* external pointers to nodes will remain valid

You provide a list of selectors, each of which is guaranteed to match at most one element in the template at any given time.  When the template is re-rendered, the selector is run on the old DOM and the new DOM, and Meteor will reuse the old element in place while working in any HTML changes around it.

The second form of `preserve` takes a labeling function for each selector, and allows the selectors to match multiple nodes.  For example, if you want to preserve all iframes in the template, you could supply the selector "iframe" and then a function that produces a unique string for each one, for example based on the iframe's "id" attribute.  The node-labeling function takes a node and returns a label string or false, to exclude the node from preservation.

Selectors are interpreted as rooted at the top level of the template.  Each occurrence of the template operates independently, so the selectors do not have to be unique on the entire page, only within one occurrence of the template.  Selectors may refer to nodes in sub-templates of the template having the `preserve` directive.

Preserving a node does *not* preserve its attributes or contents, which will reflect whatever the re-rendered template's HTML says they should be.  As a special case, form fields that have focus retain their entered text, cursor position, and all relevant input state (e.g. for international text input).  Iframes retain their navigation state and animations continue to run as long as their parameters haven't changed.  To protect a node along with its children and attributes from updates, see the {{#constant}} block helper.

Preservation of a given node will be skipped if it isn't possible because of constraints inherent in the DOM API.  For example, an element's tag name can't be changed, and moving a node to a different parent is equivalent to removing and re-inserting it, which is typically just as disruptive as recreating it from scratch.  For this reason, nodes that are re-ordered or re-parented by an update will not be preserved.

Note:  Previous versions of Meteor had an implicit page-wide `preserve` directive that labeled nodes by their "id" and "name" attributes, which has been removed in favor of this explicit, opt-in mechanism.

For example, to preserve all `<input>` elements with ids in template 'foo', use:

    Template.foo.preserve({
      'input[id]': function (node) { return node.id; }
    });

#### Template.myTemplate.helpers({foo: function (...) {...}, ...})

Specifies Handlebars helpers available to `myTemplate`.  This is alternative syntax to `Template.myTemplate.foo = ...` with the same effect, except there is less likelihood of collision with Meteor API functions like `rendered` and built-in JavaScript properties of functions.

#### Template.myTemplate.events({event1: function (event, template) { ... }, ... });

Register for event handling on nodes in this template.  An event takes the form "click", "click div" or "mousedown .foo > .bar, mouseup .foo > .bar" -- that is, a comma-separated list of types or type-selector clauses.  Selectors are scoped to the contents of the template and may apply to nodes in sub-templates.  Elements matching the selector at any given time are considered to have DOM event handlers bound and will receive both direct and bubbled events (for events that bubble).  If the selector is omitted, the handler is only called on the target element of the event.

Inside the handler, `this` is the data context of the element that matched the selector (`event.currentTarget`), and `event` is the browser event object (polyfilled for current web standards in old browsers).  `template` is the same template instance object passed to the `rendered` callback and provides access to the DOM (through `template.find(selector)`, etc.), the template's top-level data context (`template.data`), and any other properties set by the `created`, `rendered`, and `destroyed` callbacks.

Note: This syntax is intended to replace the previous syntax where you would assign an event map to `Template.myTemplate.events`.  For now, the old syntax will still work.

#### {{#constant}}...{{/constant}}

Content inside the {{#constant}} block helper is preserved exactly as-is when the template is re-rendered.  Changes to other parts of the template are patched in around the constant region, in the same manner as `preserve`.  Unlike individual node preservation, a preserved region retains not just the identities of its nodes but their attributes and contents.  The contents of block will only be evaluated once per occurrence of the enclosing template.

Constant regions allow non-Meteor content to be embedded in a Meteor template.  Many third-party widgets create and manage their own DOM nodes programmatically, so the {{#constant}} block helper is needed to protect these node from reactive updates.

Note:  In the current implementation, events may not be delivered for nodes in constant regions, or the data context may not be correct.

#### {{#isolate}}...{{/isolate}}

Creates an independently reactive region of a template.  This an advanced facility that is mainly useful for performance optimization.

Data dependencies established in the content of {{#isolate}}, such as calls to `Session.get` or database queries, are localized to the block and will not in themselves cause the parent template to be re-rendered.  This block helper essentially conveys the reactivity benefits you would get by pulling the content out into a new sub-template.





## Low-level Spark API

This is the API for Spark, the page update engine behind the new template API. You should only need this if you're building new templating systems, or using Spark outside of Meteor.

This is not the final version of the documentation, but it should be plenty to get started.


### Spark's dependencies

* `deps`, Meteor's 75-line dependency tracking system. Provides the concepts of "current context", "invalidation", and "flushing".

* `liverange`, a specialized data structure that lets you mark regions in the DOM, track the regions as they move around, walk the region hierarchy, and replace the contents of a region.

* `universal-events`, a cross-browser library for listening to events anywhere in the DOM.

* `domutils`, a toolbox of cross-brower DOM manipulation functions


### Spark.render, the main Spark entry point

    Spark.render(function () { return "<div>my document</div>"; }) => DocumentFragment

Takes a function that returns some HTML as a string. Calls that function parses the HTML into DOM nodes, and returns the nodes as a DocumentFragment. You can then insert the DocumentFragment whenever you like in the DOM.

Inside the function, you can call any of the following Spark "annotation functions" to attach special behaviors to particular regions in your HTML. Spark saves the annotation instruction to a list and drops a temporary marker into the HTML to indicate where it goes. Later, in a process called materialization, Spark strips out the markers, creates the DOM nodes, and attaches each of the requested behaviors.

When the annotation functions are not called from inside Spark.render, they are harmless no-ops. This makes it easy to create "dual use" templates that can be rendered either to strings (when called directly) or to DOM nodes (when called inside Spark.render.)

The DocumentFragment returned by Spark.render should be inserted into the DOM document immediately. If, at flush time (see 'deps' documentation), the rendered nodes aren't in the document, then Spark will clean up the nodes, tearing down the annotations and calling any `destroyed` functions that you have set up.


### Spark annotation types

_Events._ Event handlers can be attached to any range of elements in the HTML, filtered further by event type and CSS selector.

_Data context._ Each point in the HTML has a "current data context", which is an arbitrary object that you provide. You can use Spark.getDataContext(node) to retrieve the data context at any given node. In the Handlebars package, this is used to store the current Handlebars data so that it can be retrieved from inside an event handler.

_Isolate._ An "isolate" is a region of the HTML that is reactive, that is, defined by a function rather than a constant string. When the output of the function changes (as signaled with the 'deps' system), the function is re-run and the new output is swapped in.

_List._ A region of the HTML that is defined by a HTML generation function that is called once for each item in a collection. The collection is reactive -- it is defined not by an array but rather by a stream of 'added', 'changed', 'moved', and 'removed' events. As the contents of the collection changes, the page is updated.

_Landmark._ Landmarks are used to preserve information across automatic redraws of the HTML (eg, triggered by Isolates.) A landmark identifies a "logical place" in the HTML. Once you've set up a landmark, you can set attributes on the landmark that are preserved across redraws; get callbacks when the landmark is created or destroyed, or when any part of its contents is rerendered; mark certain node in the landmark as "preserved" so that they will not be disturbed in the rerendering process; or mark the whole landmark as "constant" so that the redraw process won't disturb it.

_Branch label._ A branch label is a marker that is used to match up landmarks. For example, if you have a "person" template that twice invokes an "address" template, you might use labels to mark one address as Home and the other address as Work. This makes it possible for Spark's update engine to disambiguate landmarks inside the address template, so that it can preserve landmark data even if the addresses get reordered during a redraw. In the Handlebars package, branch labels are automatically generated based on line numbers in the template source code.


### Spark annotation functions

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

The contract for 'cursor' is simple. It must have a function 'observe(callbacks)' where callbacks is the following:

* added(item, beforeIndex): Called when a new item has been added to the collection at index beforeIndex (a number somewhere between 0 and the previous length of the collection.)

* removed(item, atIndex): Called when the item at index atIndex has been removed from the collection. 'item' should be the old value of the item.

* moved(item, oldIndex, newIndex): Called when the item that was at index oldIndex has been moved so that it now has position newIndex. 'item' should be the value of the item.

* changed(newItem, atIndex, oldItem): Called when the item at index atIndex has changed. Its old value was oldItem and its new value is newItem.

When observe() is called, it must immediately call added() once for each item in the collection, before returning. And it must arrange for the other functions to be called as appropriate as the contents of the collection changes.

'observe' must return an "observe handle", an object with the following method:

* stop(): Stop delivering added/removed/moved/changed callbacks, and free up any resources associated with the observe call.

```
    html = Spark.labelBranch(label, function () { return "<div>some html</div>"; })
```

Drop a branch label. 'label' must be a string (or pass null to not drop a label after all.)

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


### Simplified Spark API

Meteor also provides this simplified wrapper around Spark as a convenience to high-level Meteor users.

    Meteor.render("<div>html</div>") => DocumentFragment
    Meteor.render(function () { return "<div>html</div>"; })) => DocumentFragment

Turn a HTML string into a document fragment. Alternatively, you can pass in a function that returns a HTML string. In that case, create a reactive DocumentFragment that updates automatically as the return value of the function changes.

(This is a thin wrapper around Spark.render and Spark.isolate.)

    Meteor.renderList(cursor, function (item) { return "html"; }, function () { return "html"; }) => DocumentFragment

Create a reactive DocumentFragment based on the contents of a collection. As the contents of the collection changes, so will the nodes in the fragment. 'cursor' is a reactive collection as documented elsewhere. The first function will be called with each item in the collection to get the HTML for that item. Alternatively, the second function will be called to the HTML to show when there are no items in the collection. Both functions are reactive -- as their return value changes, the document will automatically update.

The second function is optional and defaults to function () { return '';}.

(This is a thin wrapper around Spark.render, Spark.list, Spark.labelBranch, and Spark.isolate.)
