
For the official docs on Handlebars syntax, see http://handlebarsjs.com/.  Meteor supports Handlebars syntax with some extensions and clarifications.

## Expressions

Here's a template containing the expression `{{foo}}`:

```
<template name="myTemplate">
  {{foo}}
</template>
```

We invoke the template on an object `data`:

```
var html = Template.myTemplate(data);
```

Then `{{foo}}` will insert the value of `data.foo`, suitably HTML-escaped.  We say that `data` is the current context object inside the template.

### Helpers

Helpers take precendence over properties, and if there is a helper named `foo` active in the template, it will shadow the property `foo`.

Helpers are attached to templates by assigning them as follows:

```
Template.myTemplate.foo = function() {
  return "blah"; // (calculate value here)
};
```

The value of `this` inside the helper is the current context where the helper was called.

This helper is only visible from `myTemplate`, and not other templates invoked inside it.  The only way to make a helper visible to multiple templates is to assign the same function to each one, or to declare a global helper.

Global helpers are lower precedence than template-bound helpers, and are declared as follows:

```
Handlebars.registerHelper("foo", function() {
  return "blah"; // (calculate value here)
});
```

### Reserved Helper Names

Unfortunately, since `Template.myTemplate` is a function object as well as a place to bind helpers, some helper names are illegal.  For example, the name `name` is problematic because in many browsers, functions have a built-in `name` property that you can't change (it's whatever name the function was given in the source code).  When you try to assign `Template.myTemplate.name` to a function, nothing happens!

Avoid naming a helper `name`, `length`, `arity`, `arguments`, `caller`, `call`, or `apply` (to name a few).  Only helpers have this problem; you can call the properties of your data context object whatever you want.

### Expressions with Dots

Handlebars allows expressions of the form `{{foo.bar}}`, which in the basic case means `data.foo.bar`.  With function/value coercion (see next section), it can also mean `data.foo.bar()`, `data.foo().bar`, or `data.foo().bar()`.  If there exists a helper `foo`, the helper is called instead to evalute the first segment of the expression.  Multi-segment expressions can take arguments, as in `{{foo.bar baz}}`, where `baz` will be passed as an argument to `bar` (though only if `bar` is a function).

The expression `{{this}}` evaluates to the current data context.  Paths starting with `this` always refer to properties of the current data context and not to helpers.

You can access properties of *parent* data contexts by beginning an expression with `../`, as in `{{../foo}}` or `{{../../foo.bar}}`.  Expressions having a `..` never invoke template-bound or global helpers.

### Function/Value Coercion

Template-bound helpers can be constant values instead of functions:

```
Template.myTemplate.colors = ['red', 'green', 'blue'];
```

Also, properties of the context object can be functions, in which case they are called for their values:

```
data.foo = function() { return "blah"; };
```

In a multi-segment expression, each segment is called if it is a function, and used for its value otherwise.  Take `{{foo.bar.baz}}` as an example.  The identifier `foo` refers either to a helper function, a constant template property, or to a property or getter function of the current data context.  If it's a helper or a getter, the function is called with no arguments and the current data context as `this`.  We expect the result to be an object with a `bar` property.  If the `bar` property is a function (a getter function), it is called with no arguments *on the object it came from*.  That is, whenever we call a function `bar` that isn't a helper but was a property of some object `foo` or `foo()`, we set `this` to that object.  In the expression `{{../foo}}`, `this` will be set to the parent context `..`.

This is a Meteor extension to Handlebars to support getters.

### Nonexistent Identifiers

Handlebars paths that name nonexistent properties silently evaluate to the empty string, even if they are nested.  `{{abc.def.ghi}}` evaluates to `""` and doesn't fail even if there is no property or helper called `abc`.

### Expression Arguments

Handlebars expressions can have arguments separated by spaces, which will be passed to the helper (or function property) given by the initial identifier.  Handlebars also support keyword arguments (name=value) which are passed to the helper in a dictionary.

An argument can be a literal string, number, or boolean, or any identifier or dotted path that would make sense on its own as a no-argument expression, including a property of the data context object, a getter on the data context object, or a helper (which receives no arguments).  (This is a Meteor extension.)

On the receiving end, a helper function takes one parameter per argument, plus an additional parameter containing options, principally `options.hash`, a dictionary of any keyword arguments that were present in the invocation expression.  This dictionary is always present even if it would be empty.

```
Template.myTemplate.helper = function(foo, bar, options) {
  // invoking {{helper "abc" "def" x=3 y=4}} will cause:
  //   * foo = "abc"
  //   * bar = "def"
  //   * options.hash = {x:3, y:4}
};
```

### Block Helpers

Handlebars block helpers are written as follows:

```
{{#myblock}}
  Some {{adjective}} contents here.
{{/myblock}}
```

The block helper `myblock` might be defined as follows:

```
Template.myTemplate.myblock = function(options) {
  var contents = options.fn(this);
  // boring block helper that unconditionally returns the content
  return contents;
};
```

Calling `options.fn` executes the block.  It's a function that takes a data object to use as the data context inside the block, which you should provide; pass `this` if you want to keep the same data context.  It returns the HTML that resulted from evaluating the block.  In Meteor, the HTML may also contain HTML comments around, or instead of, some content.  Because they operate at the level of fully-processed HTML, block helpers are not intended for post-processing the HTML but rather for control flow constructs (like ifs and loops).

Blocks also may take arguments and else cases:

```
{{#myIf something}}
  Some {{adjective}} contents here.
{{else}}
  Nothing.
{{/myIf}}
```

You can define your own `if` as follows:

```
Template.myTemplate.myIf =
  function (data, options) {
    if (!data || (data instanceof Array && !data.length))
      return options.inverse(this);
    else
      return options.fn(this);
  };
```

As seen here, `options.fn` and `options.inverse` provide access to the normal and else cases.

In Meteor, block helpers do *not* take arbtirary positional and keyword arguments like non-block helpers.  Instead, the arguments are treated together as a nested Handlebars helper invocation expression.

This allows statements like `{{#if equal a b}}` and `{{#if is_accessible doc}}`, which evaluate expressions equivalent to `{{equal a b}}` and `{{is_accessible doc}}` to calculate the truth condition.  In practice, the usefulness of this construct seems worth sacrificing the flexibility of multi-argument block helpers.  That is, `{{#helper equal a b}}...{{/helper}}` always (conceptually) calls `helper(equal(a,b), options)`, and `{{#helper foo bar baz x=1 y=2}}` always calls `helper(foo(bar, baz, {hash: {x:1, y:2}}))`.  If `foo` evaluates to a non-function, its value is used and the other positional and keyword arguments are ignored.

The exact rule is that a block helper is always invoked with either no arguments; one positional argument (and no keyword arguments); or only keyword arguments.  The presence of any non-keyword argument, like `foo` in the previous example, causes all following positional and keyword arguments to be passed to `foo` (if it is a function, or else swallowed).  Otherwise, if there are only keyword arguments, they are passed to the helper, so you can define a block helper that takes any number of arguments by giving them names: `{{#helper x=1 y=2 z=3}}...{{/helper}}`.
