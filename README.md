# Sen - Selector Engine
## What is Sen?
This here is a JavaScript CSS selector engine that was build with the querySelector API in mind. That means that as much work as possible will be put onto the browsers selector engine and only the missing features will be emulated (if any).

## Why use it?
**Actually don't!** This here was an experiment to get a feel what it takes to create a simple parser for css selectors. Even though it should mostly work it isn't tested to the core and might fail randomly. Prefere using jQuery ;)

Ever had that problem that a specific selector would make your life simpler but you didn't want to sacrifice the querySelector on older browsers. This is for you than. Take this example:

`a:first-of-type:any-link` isn't supported in any browser yet because `any-link` is planed for css4. What does Sen do? It checks if the pseudos are supported and than create a query matching to your current browser.

Firefox would execute this: `a:first-of-type:-moz-any-link` and no check will be done afterwards which saves time and you get your result faster.

Any other CSS 3 capable browser will execute this: `a:first-of-type` and the `any-link` will be checked later manually but our result is than already limited to real links so the check will be faster.

IE 8 only supports CSS 2.1 so it should execute just `a` but because it wouldn't need the querySelector than, it just executes `getElementsByTagName("a")` and than filter the results. In that way we at least saved the overhead that comes with every call of the querySelector.

Conclusion: Sen always uses the best way to get to the goal. The work of deciding which is the best way will be cached so if a selector has to be used many times you get the fastest result possible.

## Which browsers are supported?
- Internet Explorer **6+**
- Firefox **3+** (Firefox 1.5+ only fails on the :focus pseudo)
- Chrome/Chromium **1+**
- Opera **9.5+** (haven't found a working version of opera 9)

# How do I get started?
## compile the source
The best way is to run `compile.bat` on windows or `compile.sh` everywhere else. This will create a ~10 KB JavaScript file (4 KB later with GZip) named *Sen.min.js* . Just include it into the head of your document and you can start.

## basic selection
Just use `select( "div#withId" )`. This will return an Array (not a NodeList) with all elements that match the selector. Sen will normaly search in the document in which it was included. This can be changed with the second optional parameter.

If you want to select all elements within an element, an array of elements or another document use `select( "div.with.classes", Document|Element|NodeList|Array.<Node> )`. Note that if the second parameter isn't valid the result will always be empty except if the parameter is null or undefined which will result into the same behavior as if the parameter weren't set at all.

Sometimes you just want to select one element just put a point between select and one and you got it. ;) `select.one( "selector", Element... )` will return one element or `null` if there are no matches. This is mostly a lot faster than the alternative.

## matching and filtering
If you already have a collection of elements (any enumerable object will do like NodeList etc.) and just want to reduce them with a selector use `select.filter( "a:any-link", [ Element, ... ] )`. This will return all link elements that are actual links as Array. If the second parameter is not an array of Elements (or a NodeList) the result will always be empty.

If you just want to test if an element matches an selector use `select.test( "ul > li", Element )`. This will return true if the element is an *li* that is a child of an *ul* or false if not. It will also return false if the second parameter is not a Element.

# Supported Selectors
## basic selectors
Of course it supports tag-name, id and class selection. Look in the specs for detailed informations. This is how a full basic selector would look like: `div#main.bordered.green` and `div.bordered.green#main` which are basically the same just written in a different order but the tag-name has to be at the beginning or else you get a parsing error.

If you need to select an item that has an invalid id or class you can escape those chars like `div#my\\ id`. (the second backslash is for JavaScript)

## relation selectors
These are selectors that contain multiple selectors. Selectors like: `li a` will select all anchors that are in list items. It is called a descendant relation. But there are more like: `ul > li` which is a child selector. It will get you all list items that direct children of an unordered list. The more rare used relations like `h1 + p` and `hr ~ p` are also supported, look in the specs for them.

As a bonus css4's subject is supported as well BUT it is a subject to change, look [here](http://www.w3.org/TR/selectors4/#subject) for the specs. However here the short version:
`select( "$ul > li:only-of-type" )` would select all unordered lists that have one list-item as direct child.

## attribute selectors
Sometimes you want to select elements after an attribute for example if you look for inputs. Such a selector would look like this `input[type="text"]`. You should always try to add a tag name so that the emulation in IE 6 and 7 won't have to check the every single element in the document.

The attribute selector follows the specs. This means you can use those attribute selectors:

- `[attr="foobar"]` matches **foobar** and only *foobar*
- `[attr*="oba"]` would match fo**oba**r because it contains *oba*
- `[attr^="foo"]` would also match **foo**bar because it begins with *foo*
- `[attr$="bar"]` would also match foo**bar** because it ends with *bar*
- `[attr]` would match any element that has the attribute *attr*

This is still not all. Also the CSS 4 insensitive modifier is supported. `img[alt*="blue" i]` would match any image that has an alternative text that contains *blue*, *Blue* or *bLuE*.

The values can also be wrapped in single quotes and can also be ignored if the value only contains word-chars (a-z, A-Z, 0-9, underscore and minus). If you need to check for quotes in your attribute value you can escape the value with a backslash: `[attr*="\\"quotes in attributes?\\""]`. The second backslash is because JavaScript strips one away.

## pseudo selectors
A huge part of Sen are pseudo selectors. Most of the CSS 3 pseudo selectors and even some CSS 4 pseudos are implemented and work even in IE 6+. Here is a list of all supported pseudo selectors:

###link pseudos
- `:any-link` matches all links no matter if visited or not
- `:local-link` matches links that lead to the current page but `:local-link(n)` would match all links where *n* url segments are the same. Example: the selector `:local-link(1)` would match */foo* on the page */foo/bar* but `:local-link(2)` would not because the url has no */bar* segment.

### children selectors
- `:first-child` matches if the element is the first child of it's parent.
- `:last-child` same but last child
- `:only-child` only matches if there are no other siblings around it.
- `:nth-child(n)` matches only specific children. The value *3* would match only the 3rd child. Also possible is *2n* which would match every 2nd child. This can even be more defined with *2n+1* which means every 2nd child beginning with 1. Also possible are the values *odd* and *even*.
- `:nth-last-child(n)` same as above except it counts from the bottom

### typed children selectors
- `:first-of-type` like *:first-child* but only counts elements with the same tag name.
- `:last-of-type` same as above except last.
- `:only-of-type` same as *:only-child* except with the same limitation as *first-of-type*
- `:nth-of-type(n)` like *:nth-child* but only counts elements with the same tag name
- `:nth-last-of-type(n)` same as above excepts it counts from the bottom.

### matching children selectors
- `:first-match` like *:first-child* but only counts elements that match the selector part.
- `:last-match` like *:first-match* except last
- `:only-match` only matches if there are no other siblings that would match the selector part.
- `:nth-match(n)` same as *:nth-child* except it only counts elements that match the selector part.
- `:nth-last-match(n)` same as above except it counts from the bottom.

Note that the match references only the selector part **before** the match pseudo. So `input:checked:first-match` would give you the first child input that is checked while `input:first-match:checked` would give you the first child input only if it is checked.

### input selectors
- `:disabled` matches disabled inputs.
- `:enabled` matches inputs that aren't disabled.
- `:indeterminate` matches checkboxes that are indeterminate.
- `:checked` matches checkboxes that are checked and options that are selected.
- `:focus` matches elements that have the focus.
- `:read-write` matches elements that are editable by the user. These are inputs that aren't marked as readOnly and any element which has the contenteditable attribute
- `:read-only` matches all elements that don't match `:read-write`

### other selectors
- `:empty` matches elements that have nothing inside them. that you can give multiple selectors like *:matches(.foo, .bar)*.
- `:target` matches elements that are the target of the current location hash.
- `:root` matches only the documentElement which in the case of html is always the *html* element.
- `:lang(en)` matches elements after there language defined by the lang="en" attribute.
- `:dir(ltr)` matches elements that have text that has the direction *ltr* or *rtl*

### selectors depending on selectors
- `:not(selector)` matches all elements that don't match the selector inside the brackets. This is a powerfull pseudo. You can put anything inside it to negate it. Here an example: `div:not(.notme)` would match any div that hasn't the class *notme*. Multible selectors, seperated by a comma, and even deep selectors are supported. `div:not(div > div, .notme)` would only match div's that aren't a child of a div and don't have the class *notme*. If one of those conditions match a div won't be in the list.
- `:matches(selector)` matches all elements that match the selector. The selector for matches has the same rules as the selector for not: none. You can make any condition you want. You could do this for example: `:enabled:matches(input:matches([type=text], [type=password]), textarea)` to get all textinputs that are enabled.

For those who are used to `:eq`, `:lt`, `:gt` etc. should learn basic JavaScript. Just use `select( "selector" ).slice( startindex, endinex )`. For jQuery itself it's a little harder of course but for arrays this is the fastest way.

### note on pseudos
Emulating pseudos often means to check every element if it is the element you search for. This is slow! If you already know which element type you search ALWAYS include one. `div:first-child` is much faster that just `:first-child` because getElementsByTagName can be used in older browsers. Even `:matches(div, span):first-child` would be faster than the universal version.

###make own pseudos
This is an often overlooked bonus. Let's say you create a Formular and have to look for empty input fields you can of curse do this:
```javascript
var inputs = select( "input, textarea" );
for (var i = 0; i < inputs.length; ++i) {
    input = inputs[i];
    if ("value" in input && input.value.replace(/^\s+|\s+$/, "").length === 0) {
        // do something with the empty input
    }
}
```

But you could also make a pseudo like this:
```javascript
select.pseudo["empty-value"] = {
    each: function (element) {
        return "value" in element && element.value.replace(/^\s+|\s+$/, "".length === 0;
    }
};
```

... and than use it like this:
```javascript
var inputs = select( ":matches(input, textarea):empty-value" )
```

... nice and reusable. There are more properties you can set for a pseudo.

- `each` is the one shown above. It gets called for each element and has to exist for each pseudo you create. Two arguments are given: 
 - The first is the Element to check.
 - The second is a value that may be given in brackets after the pseudo as a string or the value returned from `pre` if defined.

- `get` is only called if the pseudo is in the last part of the selector. It has to return an array (or NodeList) of found elements.
This method is for example very useful on the focus pseudo. We already know which element could have the focus with `document.activeElement` so instead of searching the entire DOM just the activeElement will be checked for focus. The `each` method will still be called aferwards so this doesn't have to return a precise result. The arguments this method gets are:
 - The value this pseudos was called with
 - The document to search on (don't use the global document variable or you use frame compatibility)
 - The element to search on. Can be ignored because it will be checked afterwards. But you could execute getElementsByTagName on it.

- `pre` can be a method that will be executed while the selector is parsed. It should return a value that will be passed to the other function as value. Example: This is used for all the nth pseudos to parse the abstract value into an object. This method only gets one argument:
 - the unparsed value (can also be empty if there is non given)

Note: the `pre` method will be called inside a `try ... catch` statement. If the value isn't what you want just throw a string with the message and the `select` function will throw an SyntaxError with more informations. If the value is valid but will never match any element throw false and the current selector won't be executed.
