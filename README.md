# Sen - Selector Engine
This here is a JavaScript CSS selector engine that was build with the querySelector API in mind. That means that as much work as possible will be put onto the browsers selector engine and only the missing features will be emulated (if any).

# How do I get started
The best way is to run `compile.bat` on windows or `compile.sh` everywhere else. This will create a ~10 KB JavaScript file (4 KB later with GZip) named *Sen.min.js* . Just include it into the head of your document and you can start.

## basic selection
Just use `selector( "div#withId" )`. This will return an Array (not a NodeList) with all elements that match the selector.

If you want to select all elements within an element use `selector( "div.with.classes", DOMElement )`. Note that if the given element isn't document or a DOMElement it will cause Errors.

## matching and filtering
If you already have a collection of elements (any enumerable object will do like NodeList etc.) and just want to reduce them with a selector use `selector.filter( "a:any-link", [ DOMElement, ... ] )`. This will return all link elements that are actual links as Array.

If you just want to test if an element matches an selector use `selector.test( "ul > li", DOMElement )`. This will return true if the element is an *li* that is a child of an *ul* or false if not.

# CSS 3/4
A huge part of Sen are pseudo selectors. Most of the CSS 3 pseudo selectors and even some CSS 4 pseudos are implemented and work even in IE 6+. Here is a list of all supported pseudo selectors:

- `:any-link` matches all links no matter if visited or not
- `:local-link` matches links that lead to the current page but `:local-link(n)` would match all links where *n* url segments are the same. Example: the selector `:local-link(1)` would match */foo* on the page */foo/bar* but `:local-link(2)` would not
- `:first-child` matches if the element is the first child of it's parent.
- `:last-child` same but last child
- `:only-child` only matches if there are no other siblings around it.
- `:nth-child(n)` matches only specific children. The value *3* would match only the 3rd child. Also possible is *2n* which would match every 2nd child. This can even be more defined with *2n+1* which means every 2nd child beginning with 1. Also possible are the values *odd* and *even*.
- `:nth-last-child` same as above except it counts from the bottom
- `:first-of-type` like *:first-child* but only counts elements with the same tag name.
- `:last-of-type` same as above exept last.
- `:only-of-type` same as *:only-child* except with the same limitation as *first-of-type*
- `:nth-of-type` like *:nth-child* but only counts elements with the same tag name
- `:nth-last-of-type` same as above excepts it counts from the bottom.
- `:first-match` like *:first-child* but only counts elements that match the selector part.
- `:last-match` like *:first-match* except last
- `:only-match` only matches if there are no other siblings that would match the selector part.
- `:nth-match` same as *:nth-child* except it only counts elements that match the selector part.
- `:nth-last-match` same as above except it counts from the bottom.
- `:disabled` matches inputs that aren't disabled.
- `:enabled` matches disabled inputs.
- `:indeterminate` matches checkboxes that are indeterminate.
- `:checked` matches checkboxes that are checked and options that are selected.
- `:focus` matches elements that have the focus.
- `:empty` matches elements that have nothing inside them.
- `:not(selector)` matches all elements that don't match the selector inside the brackets.
- `:matches(selector)` matches all elements that match the selector. The point of this is that you can give multible selectors like *:matches(.foo, .bar)*.
- `:target` matches elements that are the target of the current location hash.
- `:root` matches only the documentElement which in the case of html is always the *html* element.
- `:lang(en)` matches elements after there language defined by the lang="en" attribute.
- `:dir(ltr)` matches elements whiches direction is *ltr* or *rtl*.
