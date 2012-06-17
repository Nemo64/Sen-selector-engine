# Sen - Selector Engine
## What is Sen?
This here is a JavaScript CSS selector engine that was build with the querySelector API in mind. That means that as much work as possible will be put onto the browsers selector engine and only the missing features will be emulated (if any).

## Which browsers are supported?
- Internet Explorer **6+**
- Firefox **3+** (Firefox 1.5+ only fails on the :focus pseudo)
- Chrome/Chromium **1+**
- Opera **9.5+** (haven't found a working version of opera 9)

# How do I get started?
## compile the source
The best way is to run `compile.bat` on windows or `compile.sh` everywhere else. This will create a ~10 KB JavaScript file (4 KB later with GZip) named *Sen.min.js* . Just include it into the head of your document and you can start.

## basic selection
Just use `selector( "div#withId" )`. This will return an Array (not a NodeList) with all elements that match the selector.

If you want to select all elements within an element use `selector( "div.with.classes", DOMElement )`. Note that if the given element isn't document or a DOMElement it will cause Errors.

## matching and filtering
If you already have a collection of elements (any enumerable object will do like NodeList etc.) and just want to reduce them with a selector use `selector.filter( "a:any-link", [ DOMElement, ... ] )`. This will return all link elements that are actual links as Array.

If you just want to test if an element matches an selector use `selector.test( "ul > li", DOMElement )`. This will return true if the element is an *li* that is a child of an *ul* or false if not.

# Supported Selectors
## basic selectors
Of course it supports tag-name, id and class selection. Look in the specs for detailed informations. This is how a full basic selector would look like: `div#main.bordered.green` and `div.bordered.green#main` which are basically the same just written in  a different order but the tag-name has to be at the beginning or else you get a parsing error.

If you need to select an item that has an invalid id or class you can escape those chars like `div#my\\ id`. (the second backslash is for JavaScript)

## relation selectors
These are selectors that contain multiple selectors. Selectors like: `li a` will select all anchors that are in list items. It is called a descendant relation. But there are more like: `ul > li` which is a child selector. It will get you all list items that direct children of an unordered list. The more rare used relations like `h1 + p` and `hr ~ p` are also supported, look in the specs for them.

## attribute selectors
Sometimes you want to select elements after an attribute for example if you look for inputs. Such a selector would look like this `input[type="text"]`. You should always try to add a tag name so that the emulation in IE 6 and 7 won't have to check the every single element in the document.

The attribute selector follows the specs. This means you can use those attribute selectors:

- `[attr?"foobar"]` matches **foobar** and only *foobar*
- `[attr*="oba"]` would match fo**oba**r because it contains *oba*
- `[attr^="foo"]` would also match **foo**bar because it begins with *foo*
- `[attr$="bar"]` would also match foo**bar** because it ends with *bar*
- `[attr]` would match any element that has the attribute *attr*

This is still not all. Also the CSS 4 insensitive modifier is supported. `img[alt*="blue" i]` would match any image that has an alternative text that contains *blue*, *Blue* or *bLuE*.

The values can also be wrapped in single quotes and can also be ignored if the value only contains only word-chars (a-z, A-Z, 0-9, underscore and minus). If you need to check for quotes in your attribute value you can escape the value with a backslash: `[attr*="\\"quotes in attributes?\\""]`. The second backslash is because JavaScript strips one away (it also uses backslashes for escaping).

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
- `:nth-last-child` same as above except it counts from the bottom

### typed children selectors
- `:first-of-type` like *:first-child* but only counts elements with the same tag name.
- `:last-of-type` same as above except last.
- `:only-of-type` same as *:only-child* except with the same limitation as *first-of-type*
- `:nth-of-type` like *:nth-child* but only counts elements with the same tag name
- `:nth-last-of-type` same as above excepts it counts from the bottom.

### matching children selectors
- `:first-match` like *:first-child* but only counts elements that match the selector part.
- `:last-match` like *:first-match* except last
- `:only-match` only matches if there are no other siblings that would match the selector part.
- `:nth-match` same as *:nth-child* except it only counts elements that match the selector part.
- `:nth-last-match` same as above except it counts from the bottom.

### input selectors
- `:disabled` matches inputs that aren't disabled.
- `:enabled` matches disabled inputs.
- `:indeterminate` matches checkboxes that are indeterminate.
- `:checked` matches checkboxes that are checked and options that are selected.
- `:focus` matches elements that have the focus.

### other selectors
- `:empty` matches elements that have nothing inside them. that you can give multiple selectors like *:matches(.foo, .bar)*.
- `:target` matches elements that are the target of the current location hash.
- `:root` matches only the documentElement which in the case of html is always the *html* element.
- `:lang(en)` matches elements after there language defined by the lang="en" attribute.
- `:dir(ltr)` matches elements that have text that has the direction *ltr* or *rtl*

### selectors depending on selectors
- `:not(selector)` matches all elements that don't match the selector inside the brackets.
- `:matches(selector)` matches all elements that match the selector. You could do this for example: `:enabled:matches(input:matches([type=text], [type=password]), textarea)` to get all textinputs that are enabled
