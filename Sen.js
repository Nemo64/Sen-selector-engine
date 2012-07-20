/** @license under MIT-License, see: https://raw.github.com/Nemo64/Sen-selector-engine/master/LICENSE */

////////////////////////
// EXTERNAL FUNCTIONS //
////////////////////////

/**
 * The main selector for selecting elements. (wohoo!)
 * Also this function will be the target for all other external functions.
 * @export
 * @param {string} selectorString                 The selector.
 * @param {Node|Array.<Node>|NodeList=} searchIn  The element(s) to search in. (optional)
 * @return {Array.<Node>} The found Elements.
 */
function select(selectorString, searchIn) {
	return /** @type {Array.<Node>} */ selectByString( selectorString, searchIn, false );
};
/**
 * Same as above but only selects one element.
 * @export
 * @param {string} selectorString                 The selector.
 * @param {Node|Array.<Node>|NodeList=} searchIn  The element(s) to search in. (optional)
 * @return {Node} The found Element or null.
 */
select["one"] = function (selectorString, searchIn) {
	return /** @type {Node} */ selectByString( selectorString, searchIn, true );
}
/**
 * Tests if an element matches the selector.
 * @export
 * @param {string} selectorString  The selector.
 * @param {Node} toTest            The element to check.
 * @param {Node|Array.<Node>|NodeList} origin
 * @return {boolean} True if the element matches
 */
select["test"] = function (selectorString, toTest, origin) {
	return toTest != null && toTest.nodeType === 1
		? selectorMatch(
					selectorParse(selectorString), toTest,
					/** @type {Array.<Node>|NodeList} */
					((origin && typeof origin.length !== "number") ? [origin] : origin)
			)
		: false;
};
/**
 * Reduces the given elementList by the given selector.
 * @export
 * @param {string} selectorString              The selector.
 * @param {Array.<Node>|NodeList} elementList  The element(s) to filter.
 * @return {Array.<Node>} The matching Elements.
 */
select["filter"] = function (selectorString, elementList) {
	return elementList == null ? []
		: filterSelector( selectorParse(selectorString), filterElements(elementList) );
};
/**
 * returns an array! which contains all elemnets from the given one. (nodeType === 1)
 * This is the external version that checks the type.
 * @export
 * @param {Array.<*>|NodeList} elements  The list of Nodes to filter
 * @return {Array.<Node>} The filtered result
 */
select["filterElements"] = function (elements) {
	return elements == null ? []
		: filterElements( elements );
};

///////////
// UTILS //
///////////

// First define some Selector types
// This won't be in the min version and is just for the compiler
/** @typedef {Object.<string, Array.<RegExp>>} */
select.Attr;
/** @typedef {{ each: function( Node, *, string ):boolean, get: select.Getter, pre: function( string, select.Part, select.Selector ), vendorNames: Array.<string>, testValues: Array.<string>, testHTML: string, testResult: string, support: number, supportedName: string }} */
select.Pseudo;
/** @typedef {function(*, Node, Node):(Array.<Node>|NodeList)} */
select.Getter;
/** @typedef {{ relation: string, elementName: string, id: (string|null), cls: Array.<string>, attr: select.Attr, pseudo: Object.<string, Array.<*>>, hasToContain: (select.Selector|null), getElementMethodCount: number, prefereNativeSelector: boolean, nativeFailed: boolean }} */
select.Part;
/** @typedef {Array.<select.Part>|{ string: string, fullsupport: boolean, useNative: boolean, getter: select.Getter, getterValue: * }} */
select.Selector;
/** @typedef {Array.<select.Selector>} */
select.Collection;

/**
 * This function is like doSelect but needs a string instead of a selector
 * @param {string} selectorString                          The selector.
 * @param {Node|Array.<Node>|NodeList|undefined} searchIn  The element(s) to search in. (optional)
 * @param {boolean} oneResult                              If only one result should be returned
 * @return {Array.<Node>|Node} The found Elements.
 */
function selectByString (selectorString, searchIn, oneResult) {
	return doSelect( selectorParse(selectorString), searchIn == null ? document : searchIn, oneResult );
}
/**
 * Checks if an element is in it's document.
 * @param {Node} node  The element to check
 * @return {boolean} True if the element is in his document.
 */
function inDocument(node) {
	while (node.nodeType !== 9 && (node = node.parentNode)) {}
	return node != null;
}
/**
 * Returns an array! with only the elements (nodeType == 1) of the given one
 * @param {Array.<*>|NodeList} elements  The list of Nodes to filter
 * @return {Array.<Node>} The filtered result
 */
function filterElements(elements) {
	var result = [];
	for (var i = 0; i < elements.length; ++i) {
		var element = elements[i];
		if (element && element.nodeType === 1) {
			result.push( element );
		}
	}
	return result;
}
/**
 * Joins multible array results together. Used for combining getElementResults.
 * The given arrays will be checked against each other for dublicates but not against themselfes.
 * @param {Array.<*>} args	An Array of Arrays,NodeLists,etc. to be flaten to one Array
 * @return {Array} A flat and unique array
 */
function makeFlatAndUnique (args) {
	var result = [];
	// loop through the value arrays
	for (var i = 0; i < args.length; ++i) {
		var arg = args[i];
		// now loop through the values
		for (var j = 0; j < arg.length; ++j) {
			var toCompare = arg[j];
			var alreadyIn = false;

			// loop through the arrays before to check that this value is unique
			for (var g = i; !alreadyIn && g--; ) {
				var compareArray = args[g];
				for (var k = 0; !alreadyIn && k < compareArray.length; ++k) {
					if (compareArray[k] === toCompare) {
						alreadyIn = true;
					}
				}
			}
			if (!alreadyIn) result.push( toCompare );
		}
	}
	return result;
}
/**
 * a function to warn the developer about something that went wrong
 * @param {*} message  The message to show
 * @suppress {undefinedVars}
 */
function err (message) {
	if (window.console) console.error( message );
}

///////////////////////
// SOME PREPARATIONS //
///////////////////////

/**
 * looks if the elementVersion of a getter is available
 * @param {string} nodeVersion      the cross browser node version of the getter
 * @param {string=} elementVersion  the not so cross browser element version
 */
function checkElementVersion (nodeVersion, elementVersion) {
	if (elementVersion == null) elementVersion = nodeVersion.replace( /[A-Z]/, "Element$&" );
	return elementVersion in testDiv ? elementVersion : nodeVersion;
}

/**
 * A div for testing
 * @type {Node}
 */
var testDiv = document.createElement( "div" );
// some checks for getters
var children       = checkElementVersion( "childNodes", "children" );
var nextSibling    = checkElementVersion( "nextSibling" );
var prevSibling    = checkElementVersion( "previousSibling" );
var firstChild     = checkElementVersion( "firstChild" );
var lastChild      = checkElementVersion( "lastChild" );
// check for some more rare selectors
var classSelector  = !!testDiv.getElementsByClassName; // if the browser supports selecting by class
var nativeSelector = !!testDiv.querySelector; // if the browser supports a native selector
var focusCheckable = !!document.hasFocus; // if we can figure out if the document is focused

//////////////////////
// PSEUDO SELECTORS //
//////////////////////

// some expression for the prePseudos
var RxUnEscape        = /^['"]|\\(.)|['"]$/gm;
var RxRxEscape        = /[.*+?|\\()\[\]{}]/g;
var RxNthV            = /^(\d+n)?([+-]?\d+)?$/m;
var RxMainUrl         = /:\/{2,3}([^?#]*)([?#]|$)/m;
var RxDangerousPseudo = /^(matches|not)$/m;
// some vals for tests
var nthTestValues = ["2n+1"];
var selectorTestValues = ["a","a,a","a a",":not(a)"];
/**
 * Removes escaped chars and the quotes from a string.
 * @param {string} string  The string to unescape
 * @return {string} The unescaped string
 */
function unescapeUse (string) {
	return string.replace( RxUnEscape, "$1" );
}
/**
 * Escapes a string for the use in regular expression.
 * @param {string} string	The string to escape
 * @return {string} The escaped string
 */
function escapeForRx (string) {
	return string.replace( RxRxEscape, "\\$&" );
}
/**
 * for parsing odd/even/2n+1 etc.
 * @param {string} value
 * @return {{ nt: number, begin: number }}
 */
function nthParse (value) {
	value = value.toLowerCase();
	// first look for the case of odd and even
	var p = value === "odd" ? [,2,1]
		: value === "even" ? [,2,0]
	// else parse normal values
		: value.match( RxNthV );
	
	if (!p) throw "invalid nth '" + value + "'";
	return {
		nt: parseInt( p[1], 10 )||0,
		begin: parseInt( p[2], 10 )||0
	};
};
/**
 * for checking if an element matches an nth(?)
 * @param {Node} element                         The element to check
 * @param {{ nt: number, begin: number }} value  The value array from nthParse
 * @param {boolean} forward                      If the loop should go forward or backwards
 * @param {function(Node):boolean=} matches      This function checkes if the element matches
 * @return {boolean} True if matches.
 */
function nthCheck (element, value, forward, matches) {
	var child = element.parentNode[forward ? firstChild : lastChild];
	var count = 0;

	while (child) {
		// if the child is what we want count it
		if (child.nodeType === 1 && (!matches || matches( child ))) {
			++count;
			// if the element is the element we want to match
			if (child === element) {
				return value.nt
					? (((count - value.begin) % value.nt) === 0) // if this one repeats
					: (count === value.begin); // else check if it is
			}
		}
		// get the next element
		child = child[forward ? nextSibling : prevSibling];
	}

	// it should be impossible to get here
	return false;
}
/**
 * preParser for selector based pseudos
 * @param {string} value
 * @return {{ sn: number, selectors: select.Collection }}
 */
function psParse (value) {
	var selectors = selectorParse( value );
	var sn = selectors.length > 1 ? 2:1;

	// loop selectors for support check (for the selector we are doing this for)
	for (var i = 0; i < selectors.length && sn < 5; ++i) {
		var selector = selectors[i];
		if (selector.length > 1 && sn < 3) sn = 3; // check for deep selectors
		if (!selector.fullsupport) sn = 5; // selector is impossible to do native
		// loop the selector parts for dangerous pseudos
		for (var j = 0; j < selector.length && sn < 4; ++j) {
			// loop pseudos
			for (var pname in selector[j].pseudo) {
				// if a dangerous pseudo was used
				if (RxDangerousPseudo.test( pname )) {
					sn = 4;
					break;
				}
			}
		}
	}
	return { "sn":sn , selectors: selectors };
};
/**
 * clones a selector part for the match pseudos
 * @param {string} value      just because we need the secound param
 * @param {select.Part} part  the selector part
 * @return {select.Part}
 */
function clonePart (value, part) {
	var newPart = {};
	// clone everything except pseudos, attributes and classes
	for (var name in part) {
		var prop = part[name];
		if (typeof prop !== "object" || prop == null) {
			newPart[name] = prop;
		}
	}
	// now clone classes and attributes
	newPart.cls  = part.cls.concat();
	newPart.attr = part.attr.concat();
	// now clone pseudos
	newPart.pseudo = {};
	for (var name in part.pseudo) {
		newPart.pseudo[name] = part.pseudo[name].concat();
	}
	return /** @type {select.Part} */ newPart;
}
/**
 * same as the function above except + the nthParse function.
 * @param {string} value      the value for the nthParse
 * @param {select.Part} part  the selector part
 * @return {{ nt: number, begin: number, part: select.Part }}
 */
function nthWithPart (value, part) {
	var result = nthParse( value );
	result.part = clonePart( value, part );
	return /** @type {{ nt: number, begin: number, part: select.Part }} */ result;
}
/**
 * check if the element is focused.
 * @param {Node} element  the node to check
 * @return {boolean}
 */
function hasFocus (element) {
	var ownerDocument = element.ownerDocument;
	return ownerDocument && ownerDocument.activeElement === element // the element has to be active
		&& (!focusCheckable || ownerDocument.hasFocus()) // the document needs to have focus
		&& (element.type || element.href); // only use form elements
}
/**
 * Pseudo selector objects with all informations needed for the pseudo.
 * The each method gets called on every element that has to be checked with the pseudo.
 * The get method only gets called if the pseudo is in the last part of a selector and not supported by the browser. (optional)
 * The pre method gets called while a selector gets parsed. (NOTE: the parsed selectors will be cached) (optional)
 * The vendorNames variable contains an array of alternative names for the pseudo that the browser might support (optional)
 * The testValues variable contains an array of test Values (big shock) that the pseudo will be called with on support test. (optional)
 * The testHTML variable contains html that will be used for the test (optional)
 * The testResult variable has to contain a selector string that works directly with the querySelector. Note that the result can only be one element. (optional)
 *     If no result is expected pass null
 * @type Object.<string, select.Pseudo>
 */
var pseudos = select["pseudo"] = {
	"any-link": {
		"each": function (element) {
			return element.href;
		},
		// event though modern browsers return :any-link by using :link it isn't safe to do so.
		// some browser might select :link correct. (FF 3.5 and opera 10 do so)
		vendorNames: ["-moz-any-link", "-webkit-any-link"]
	},
	"local-link": {
		"each": function (element, value) {
			return element.href && value.Rx.test( element.href );
		},
		"pre": function (value) {
			var parts = location.href.match( RxMainUrl )[1].split("/");
			value = value === "" ? parts.length : parseInt( value, 10 );
			if (parts.length < value) throw false; // if there are more url parts wanted than the url has this selector is dead
			return { Rx: RegExp( ":\/{2,3}" + escapeForRx(parts.slice(0, value).join("/")) ) };
		}
	},

	// CHILDREN
	"first-child": {
		"each": function (element) {
			while ((element = element[prevSibling]) && element.nodeType !== 1) {} // if (element.nodeType === 1) return false;
			return element == null;
		}
	},
	"last-child": {
		"each": function (element) {
			while ((element = element[nextSibling]) && element.nodeType !== 1) {}
			return element == null;
		}
	},
	"only-child": {
		"each": function (element) {
			return filterElements( element.parentNode[children] ).length === 1;
		}
	},
	"nth-child": {
		"each": function (element, value) {
			return nthCheck( element, value, true );
		},
		"pre": nthParse,
		testValues: nthTestValues
	},
	"nth-last-child": {
		"each": function (element, value) {
			return nthCheck( element, value, false );
		},
		"pre": nthParse,
		testValues: nthTestValues
	},

	// TYPE CHILDREN
	"first-of-type": {
		"each": function (element) {
			var name = element.nodeName;
			// there is no need to check for nodeType because the nodeName wouldn't match
			while ((element = element[prevSibling]) && element.nodeName !== name) {}
			return element == null;
		}
	},
	"last-of-type": {
		"each": function (element) {
			var name = element.nodeName;
			while ((element = element[nextSibling]) && element.nodeName !== name) {}
			return element == null;
		}
	},	
	"only-of-type": {
		"each": function (element) {
			return pseudos["first-of-type"]["each"]( element ) && pseudos["last-of-type"]["each"]( element );
		}
	},
	"nth-of-type": {
		"each": function (element, value) {
			var name = element.nodeName;
			return nthCheck( element, value, true, function (child) { return child.nodeName === name } );
		},
		"pre": nthParse,
		testValues: nthTestValues
	},
	"nth-last-of-type": {
		"each": function (element, value) {
			var name = element.nodeName;
			return nthCheck( element, value, false, function (child) { return child.nodeName === name } );
		},
		"pre": nthParse,
		testValues: nthTestValues
	},

	// MATCH CHILDREN
	"first-match": {
		"each": function (element, value) {
			// here we have to check the nodeType because selectorTest doesn't and always returns true on universal selectors
			while ((element = element[prevSibling]) && (element.nodeType !== 1 || !selectorTest( element, value ))) {}
			return element == null;
		},
		"pre": clonePart
	},
	"last-match": {
		"each": function (element, value) {
			while ((element = element[nextSibling]) && (element.nodeType !== 1 || !selectorTest( element, value ))) {}
			return element == null;
		},
		"pre": clonePart
	},
	"only-match": {
		"each": function (element, value) {
			return filterSelector( [[value]], filterElements(element.parentNode[children]) ).length === 1;
		},
		"pre": clonePart
	},
	"nth-match": {
		"each": function (element, value) {
			return nthCheck( element, value, true, function (child) { return selectorTest( child, value.part ) } );
		},
		"pre": nthWithPart,
		testValues: nthTestValues
	},
	"nth-last-match": {
		"each": function (element, value) {
			return nthCheck( element, value, false, function (child) { return selectorTest( child, value.part ) } );
		},
		"pre": nthWithPart,
		testValues: nthTestValues
	},

	// FORM STATUS
	"disabled": {
		"each": function (element) {
			return element.disabled;
		},
		// FF 3.5 reports that hidden inputs are disabled
		testHTML: "<input type='hidden'>"
		// we don't want any result
	},
	"enabled": {
		"each": function (element) {
			return !element.disabled;
		},
		testHTML: "<input type='hidden'>",
		testResult: "input"
	},
	"indeterminate": {
		"each": function (element) {
			return element.indeterminate;
		}
	},
	"checked": {
		"each": function (element) {
			return element.checked || element.selected;
		},
		// checked should also return selected elements
		testHTML: "<select><option selected></option></select>",
		testResult: "option"
	},
	"focus": {
		"each": function (element) {
			return hasFocus( element );
		},
		"get": function (value, ownerDocument) {
			var element = ownerDocument.activeElement;
			return hasFocus( element ) ? [element] : [];
		}
	},
	// WARNING: read-write and read-only are mostly untested
	"read-write": {
		"each": function (element) {
			var parent = element;
			while (parent.contentEditable === "inherit" && (parent = parent.parentNode)) {}
			return (parent && parent.contentEditable) || !element.readOnly;
			// the specs don't say much but all browsers that support this here see disabled inputs as writeable
		},
		vendorNames: ["-moz-read-write"]
	},
	"read-only": {
		"each": function (element) {
			return !pseudos["read-write"]["each"]( element );
		},
		vendorNames: ["-moz-read-only"]
	},

	// INNER ELEMENTS
	"empty": {
		"each": function (element) {
			element = element.firstChild;
			while (element) {
				if (element.nodeType === 3 || element.nodeName > "@") return false;
				element = element.nextSibling;
				// NOTE:  this shortcut is actually from nwmatcher.
			}
			return true;
		}
	},
	"not": {
		"each": function (element, value) {
			return !selectorMatch( value.selectors, element );
		},
		"pre": psParse,
		testValues: selectorTestValues
	},
	"matches": {
		"each": function (element, value) {
			return selectorMatch( value.selectors, element );
		},
		"get": function (value, ownerDocument, searchOn) {
			return doSelect( value.selectors, searchOn, false );
		},
		"pre": psParse,
		testValues: selectorTestValues,
		vendorNames: ["-webkit-any", "-moz-any"]
	},

	// OTHER
	"target": {
		"each": function (element) {
			var hash = location.hash.substr(1);
			return hash && element.id === hash;
		},
		"get": function (value, ownerDocument) {
			var node = ownerDocument.getElementById( location.hash.substr(1) );
			return node ? [node] : [];
		}
	},
	"root": {
		"each": function (element) {
			return element === element.ownerDocument.documentElement;
		},
		"get": function (value, ownerDocument) {
			return [ownerDocument.documentElement];
		}
	},
	"lang": {
		"each": function (element, value) {
			do if (element.lang) return element.lang === value;
			while (element = element.parentNode);
			return false;
		},
		testValues: ["de"]
	},
	"dir": {
		"each": function (element, value) {
			do if (element.dir) return element.dir === value;
			while (element = element.parentNode);
			return value === "ltr";
		},
		testValues: ["ltr"]
	}
};

///////////////////
// SUPPORT TESTS //
///////////////////

// some browser behaviors
var tagNameReturnsComments = testDiv.getElementsByTagName("*").length > 1; // getElementsByTagName("*") returns comments in ie
var attrFullSupported = false; // insensitive attribute selections
var targetSupported = false; // selector target support

/**
 * Tests if an selector works or not.
 * @param {string} selector     The selector to test
 * @param {Node=} localTestDiv  An Element to use for the tests
 * @return {Node|null|boolean} One result of the selection, null if nothing was found and false on error
 */
function testSelect (selector, localTestDiv) {
	try { return (localTestDiv || testDiv).querySelector( selector ); }
	catch(e) { return false; }
}
/**
 * gets the pseudo object so it is an equivalent to pseudos[pseudoname] except it checks the support first.
 * Also it throws a string error so it is for made for the parsing function.
 * @param {string} pname  the name of the pseudo to search
 * @return {select.Pseudo}
 */
function getPseudo (pname) {
	// get the pseudo
	var pseudo = pseudos[pname];
	// throw error if the pseudo doesn't exist
	if (!pseudo) throw "unknown pseudo '" + pname + "'";
	// if this pseudo was already checked or the native selector is unavailable just return
	if (pseudo.support != null || !nativeSelector) return pseudo;
	// else we have to check the pseudo for support first

	var testDiv = document.createElement( "div" ); // create a div for our local test
	var names   = [pname].concat( pseudo.vendorNames || [] ); // there could be browser specific names for that pseudo
	var sLevel  = 0; // the level of support (only if there are test vals, the last working key + 1, without value 1, if not working 0)
	var sName   = pname; // the supported name

	// if there is a testHTML use it
	if (pseudo.testHTML) testDiv.innerHTML = pseudo.testHTML;
	// get the testResult
	var testResult = pseudo.testResult ? testDiv.querySelector( pseudo.testResult ) : null;

	// loop all names to check
	for (var n = 0; n < names.length; ++n) {
		var name = names[n];

		// if there are testVals check them
		if (pseudo.testValues) {
			var testValues = pseudo.testValues;
			for (var i = 0; i < testValues.length && testSelect( ":" + name + "(" + testValues[i] + ")", testDiv ) === testResult; ++i) {
				// if the support is better with this name change the prefered name
				if (i >= sLevel) {
					sLevel = i+1;
					sName = name;
				}
			}
		// if there are no test vals test the pseudo without any
		} else if (testSelect( ":" + name, testDiv ) !== false) {
			sLevel = 1;
			sName = name;
			break;
		}
	}
	// set the support variables
	pseudo.supportedName = sName;
	pseudo.support = sLevel;

	// after removing the testDiv return
	testDiv = null;
	return pseudo;
}

// if native selector is available do some tests with it
if (nativeSelector) {
	attrFullSupported = testSelect('[a="a" i]') !== false; // tests if the browser supports insensetive attributes
	targetSupported = testSelect("$a") !== false; // test if the browser supports targets (no browser does yet)
}

// we manipulate our testDiv now for the next tests
testDiv.innerHTML = '<a class="a b"></a><!---->';

// if class selector is available do some test and check if we can use it
if (classSelector) {
	// if the first element wasn't found by his secound class name the class selector is defect (Opera 9.6)
	if (testDiv.getElementsByClassName("b").length < 1) {
		classSelector = false;
	} else {
		// else check if the element will still be found if we take the class away (cache bug in Safari 3.1)
		testDiv.firstChild.className = "";
		classSelector = testDiv.getElementsByClassName("b").length < 1;
	}
}

// destroy testDiv to release memory
testDiv = null;

//////////////////////
// SELECTOR PARSING //
//////////////////////

// A bunch of regular expression for the parsing of an selector
var RxRelate   = /^\s*([>+~]?)\s*/m;
var RxName     = /^\*|^([\w-]|\\.)+/m;
var RxId       = /^#(([\w-]|\\.)+)/m;
var RxClass    = /^\.(([\w-]|\\.)+)/m;
var RxPseudo   = /^:([\w-]+)(\((([^()]*|\(([^()]*|\([^()]*\))*\))*)\))*/m;
var RxAttr     = /^\[(([\w-]|\\.)+)(([\^*$|]?)=(['"]([^\\'"]|\\.)*['"]|[\w-]*)(\s*i)?)?\]/m;
var RxPreMod   = /^\$/m;
var RxNextOne  = /^\s*,\s*/m;
var RxSSplit   = /\s+/g;
var RxIsQuote  = /^['"].*['"]$/m;
var RxBorderMod= /^[\^*$]/m;
var RxSkipOne  = /^\s*((\((([^()]*|\(([^()]*|\([^()]*\))*\))*)\)|['"]([^\\'"]|\\.)*['"]|\\,|[^,])*)\s*/m;
var RxATList   = { "":["^","$"], "*":["",""], "^":["^",""], "$":["","$"], "~":["(^| )","( |$)"], "|":["^","(-|$)"] };
/**
 * Cached selectors
 * @type {Object.<string, select.Collection>}
 */
var selectorCache = {};

/**
 * A bunch of function that get called to parse the selector.
 * The key has to identify when they are called. The key won't be removed from the string
 * @type Object.<string, function(select.Part, Function, select.Selector)>
 */
var parseFuncs = {
	/**
	 * This is the parser function for id's
	 * @param {select.Part} part
	 * @param {Function} getSegment
	 * @param {select.Selector} selector
	 */
	"#": function (part, getSegment, selector) {
		// get the id out of the selector
		var segment = getSegment( RxId, true );
		if (!segment[1] || part.id != null) throw "invalid id";

		part.id = unescapeUse( segment[1] ); // unescape the id and return it
		selector.idPart = selector.length - 1; // tell that this part has the last id in the selector
		++part.getElementMethodCount; // this is a getElementMethod
	},
	/**
	 * This is the parser function for classes
	 * @param {select.Part} part
	 * @param {Function} getSegment
	 * @param {select.Selector} selector
	 */
	".": function (part, getSegment, selector) {
		// get the class out of the selector
		var segment = getSegment( RxClass, true);
		if (!segment[1]) throw "invalid class";

		// add the class to the class list
		part.cls.push( unescapeUse(segment[1]) );
		// getElementMethodCount will be set later beacuse we can check multible classes with it
	},
	/**
	 * This is the parser function for attributes
	 * @param {select.Part} part
	 * @param {Function} getSegment
	 * @param {select.Selector} selector
	 */
	"[": function (part, getSegment, selector) {
		var segment = getSegment( RxAttr );
		if (!segment[1]) throw "invalid attribute";

		var attrName = unescapeUse( segment[1] );
		var mod = segment[7];
		var type = segment[4] || "";
		var value = segment[5];
		var hasValue = typeof value === "string";
		var isInQuotes = hasValue ? RxIsQuote.test( value ) : false;

		// add this attribute the search list if it doesn't exist yet
		if (!part.attr[attrName]) part.attr[attrName] = [];

		// if this attribute selector is supported rebuild it and add it to full
		if (nativeSelector && (!mod || attrFullSupported)) {
			selector.string += "[" + segment[1] + (hasValue ? (type + '=' + (isInQuotes ? value : '"' + value + '"') + (mod || "")) : "") + "]";
			// use the native selector
			part.prefereNativeSelector = true;
		// else this selector can't be done fully natively
		} else selector.fullsupport = false;

		// if the attribute is supposed to have a value
		if (hasValue) {
			// if the value is empty and the mod is a border mod
			if (value === "" && RxBorderMod.test( mod )) {
				throw false; // skip this selector
			}
			// create an expression that can simply be used on the attribute
			part.attr[attrName].push(RegExp(
					RxATList[type][0] + escapeForRx( isInQuotes ? unescapeUse(value) : value ) + RxATList[type][1],
					mod ? 'im' : 'm'
			));
			
		}
	},
	/**
	 * This is the parser function for pseudo selectors
	 * @param {select.Part} part
	 * @param {Function} getSegment
	 * @param {select.Selector} selector
	 */
	":": function (part, getSegment, selector) {
		// get the pseudo
		var segment = getSegment( RxPseudo );
		if (!segment[1]) throw "invalid pseudo";

		var name = segment[1].toLowerCase();
		var value = segment[3] || "";
		var pseudo = getPseudo( name );

		// use the pseudo parse function if there is any or just crate a pseudo object with basic infos
		var pseudoObj = pseudo["pre"] ? pseudo["pre"]( value, part, selector ) : value;
		if (pseudoObj == null) throw false; // the value must not be null or undefined 

		// if pseudo used the first time create an array for values
		if (!part.pseudo[name]) part.pseudo[name] = [];

		// if the native selector could do this selection
		if (pseudo.support >= (pseudoObj["sn"] || 1)) {
			// create a selector string and add it
			selector.string += ":" + pseudo.supportedName + (value ? "("+value+")" : "");
			part.prefereNativeSelector = true;

		// selector isn't natively supported
		} else {
			// if there is a getter in the pseudo this part should be get with it
			if (pseudo["get"]) {
				part.getter = pseudo["get"];
				part.getterValue = pseudoObj;
			}
			selector.fullsupport = false;
		}

		// add the pseudo object to the selector
		part.pseudo[name].push( pseudoObj );
	}
};

/**
 * Parses a selector to an abstract object.
 * @param {string} selectString  The selector-string
 * @return {select.Collection} A selector
 */
function selectorParse (selectString) {
	var string = selectString;
	/** @type {select.Collection} */
	var selectors = [];
	if (typeof selectString !== "string") return selectors; // if no string given return empty selector collection
	if (selectorCache[selectString]) return selectorCache[selectString]; // if already parsed just return

	// loop all selectors (comma seperated)
	// we do that by looping as loong as the string has content
	while (string.length) {
		/**
		 * create the selector
		 * @type {select.Selector}
		 */
		var selector = [];

		selectors.push( selector ); // push it on the collection
		// create subvariables
		selector.string = "";
		selector.fullsupport = true;
		selector.useNative = true;

		try {
			do {
				var somethingAdded = false;
				/**
				 * The selector part
				 * @type {select.Part}
				 */
				var part = {
						relation: "", elementName: "*", id: null, cls: [], attr: {}, pseudo: {}, hasToContain: null,
						getElementMethodCount: 0, prefereNativeSelector: false, nativeFailed: false
				};
				// variables for later
				var isTarget, elementName, nextChar;
				// push it into the selector
				selector.push( part );

				/**
				 * Unshifts a part of the selector string, adds it to the selector string (if needed) and returns the match
				 * @param {RegExp} Rx		The expression to use
				 * @param {boolean} addfull	If true result will be addded to the selector string
				 * @return {Array.<string>} The result of the matching
				 */
				function getSegment (Rx, addfull) {
					var result = string.match(Rx) || [""]; // execute the regular expression
					var full   = result[0];
					if (full) {
						string = string.substr( full.length ); // remove the parsed part from the string
						if (addfull) selector.string += full;
						somethingAdded = true;
					}
					return result;
				}

				// relationg to the last selector part
				part.relation = getSegment( RxRelate, selector.length > 1 )[1] || "";
				if (part.relation && selector.length === 1) selector.fullsupport = false; // if the first element has a relation we loose full support
				// selector target
				isTarget = getSegment( RxPreMod, targetSupported )[0]; // check if this selector part is the target of the selection
				// get the tag name
				elementName = getSegment( RxName, false )[0].toLowerCase() || "*";
				if (elementName && elementName !== "*") {
					if (nativeSelector) selector.string += elementName;
					part.elementName = unescapeUse( elementName ); // if there is a tag name unescape it and save it
					++part.getElementMethodCount; // this is a getElementMethod
				} else selector.string += "*";

				// now, depending on the next char, call parser functions
				while ((nextChar = string.charAt(0)) && parseFuncs[nextChar]) {
					parseFuncs[nextChar](part, getSegment, selector);
				}

				// handle target
				// TODO: this shouldn't be seperated from the main query (mayor performance loose)
				// BUT:  it means mayor changes in the core wich is bad and also a lot more code
				if (isTarget) {
					part.hasToContain = selectorParse( getSegment(RxSkipOne, targetSupported)[1] || "" )[0];
					if (targetSupported) selector.string += part.hasToContain.string;
					else selector.fullsupport = false;
				}

				// throw error if the parser hasn't done anything yet
				if (!somethingAdded) throw "couldn't parse '" + string + "'";

				// if there were classes in the selector
				if (part.cls.length) {
					// if class selector is supported this is a getElementMethod
					if (classSelector) ++part.getElementMethodCount; 
					else part.prefereNativeSelector = true;
				}

			} while (string && !RxNextOne.test(string)); // as long as there is no comma but more string

		// if this selector threw an error
		} catch (e) {
			// if the thrown object is false we have an dead selector. Just skip it
			if (e === false) {
				var toSkip = string.match( RxSkipOne ); // get everything until the next selector
				string = toSkip ? string.substr( toSkip[0].length ) : ""; // cut the selector off
				selectors.pop(); // remove everything the loop has created for the defect selector
			// if the thrown object is a string extend it and throw real error
			} else if (typeof e === "string") {
				throw SyntaxError(e + " in selector: '" + selectString + "'"); // throw SyntaxError
			// else this isn't our error so just throw it further
			} else throw e;
		}

		// check if the native selector shouldn't be prefered
		if ((selector.length === 1 && !selector[0].prefereNativeSelector && selector[0].getElementMethodCount < 2) || part.getter) {
			selector.useNative = false;
		}

		// remove the comma which seperates the selectors
		string = string.replace(RxNextOne, "");
	}
	// create the final selector object and return it
	return selectorCache[selectString] = selectors;
}

/////////////////////////
// SELECTION FUNCTIONS //
/////////////////////////

/**
 * Selects elements in the document, on an element or a list of elements
 * @param {select.Collection} selectors                The parsed selector to use.
 * @param {Array.<Node>|Node|NodeList} globalSearchOn  The element(s) to search on.
 * @param {boolean} oneResult                          If true only one result will be returned or null if there are none
 * @return {Array.<Node>|Node} A list of matching elements or, if oneResult is true, a result node or null
 */
function doSelect (selectors, globalSearchOn, oneResult) {

	/**
	 * this is an array of array results
	 * later there has to be taken care that it is unique
	 * @type {Array.<Array.<Node>>}
	 */
	var results = [];
	/**
	 * this is an array which tells the filter at the end which element this selection originaly came from.
	 * @type {Array.<Node>}
	 */
	var origins = null;

	// we need to decide on which element the selectors should be cast
	// if it is an array we search use the document node of the first
	// TODO: support array of elements from multible documents
	if (typeof globalSearchOn.length === "number") {
		// use all given elements as origin
		origins = filterElements( /** @type {Array.<Node>} */ (globalSearchOn) );

		// if the origin array is empty there also can't be any results
		if (origins.length === 0) return [];
		// if the origin array has one entry we might as well search from it
		else if (origins.length === 1) globalSearchOn = origins[0];
		// else we search from the document so we don't have to select multible times
		else globalSearchOn = origins[0].ownerDocument;
	// if the searchOn is an element or a document search from it
	} else if (globalSearchOn.nodeType === 1 || globalSearchOn.nodeType === 9) {
		origins = [globalSearchOn];
	// else this seems to be no valid input so there will be an empty output
	} else return [];

	/**
	 * On this element will all selections take place. It is the element given to the selector, but only if it was one.
	 * If multible elements were given to the selector it will be the document of them.
	 * This way there is no need of selecting the same elements multible times.
	 * @type {Node}
	 */
	globalSearchOn;

	/**
	 * the document of the element
	 * @type {Node}
	 */
	var ownerDocument = globalSearchOn.ownerDocument || globalSearchOn;

	// loop selectors
	for (var i = 0; i < selectors.length; ++i) {
		var selector = selectors[i];
		var useNative = (nativeSelector && selector.useNative && !selector.nativeFailed);
		var searchOn = globalSearchOn;
		/**
		 * the results of the selector
		 * @type {Array.<Node>|NodeList}
		 */
		var tmpResult = [];

		// if the native selector should be prefered try it
		if (useNative) try {
			tmpResult = searchOn.querySelectorAll( selector.string );
		} catch (e) {
			err("querySelector error on: '" + selector.string + "'\n" + e);
			useNative = false; // we won't change selector.useNative because it decides if we filter or not
			selector.nativeFailed = true; // but we do recognize this error
		}

		// if this selector has to be done simple
		if (!useNative) {
			var endPart = selector[selector.length - 1];

			// the id selector should always be used if searched for an id
			// if in our selector is a id and our searchOn is inside the document
			if (selector.idPart != null && inDocument( searchOn )) {
				/** @type {select.Part} */
				var idPart = selector[selector.idPart];
				/** @type {Node|null} */
				var ele = ownerDocument.getElementById( idPart.id );

				// if there are no elements or if the element matches the id exactly (case insensitive bug in some browsers)
				if (!ele || ele.id === idPart.id) {
					// check if it matches the selector until the idPart
					// this also irons out the chance that the node isn't in the document (bug in Blackberry 4.6)
					// AND we remove the chance of selecting an element outside our origins
					if (ele && selectorMatch( [selector.slice(0, selector.idPart+1)], ele, origins )) {
						// this is our result if the idPart is the last part
						if (idPart === endPart) tmpResult = [ele];
						// else it is our new searchOn for the next selectors
						else searchOn = ele;
					// if it doesn't match there can't be any (valid) result
					} else searchOn = null;
				}
				// else the dom has to be traverseled the oldschool way
			}

			// if there are no results through the id selector
			if (!tmpResult.length && searchOn) {
				// if this selector has a getter (pseudos do that if they already know possible results)
				if (endPart.getter) {
					tmpResult = endPart.getter( endPart.getterValue, ownerDocument, searchOn );
				// use class selector if available and if there are classes in our selector part
				} else if (classSelector && endPart.cls.length) {
					tmpResult = searchOn.getElementsByClassName( endPart.cls.join(" ") );
				// else use the elementName selector (elementName is * star if there wasn't a tag name selected)
				} else {
					tmpResult = searchOn.getElementsByTagName( endPart.elementName );
					// if searched for a "*", ie returns comments too
					if (tagNameReturnsComments && endPart.elementName === "*") {
						tmpResult = filterElements( tmpResult );
					}
				}
			}
		}

		// use the filter the elements if ...
		if (
			origins.length > 1 || !selector.fullsupport // ... check is forced, more than one origin was used, lack of support or ...
			 || (!nativeSelector && selector.useNative) || selector.nativeFailed // ... native selector wasn't used but should have been.
		) {
			tmpResult = filterSelector( [selector], tmpResult, origins, oneResult );
		}

		// if there are still elements in the array add them
		if (tmpResult.length) {
			if (oneResult) return tmpResult[0];
			else results.push( tmpResult );
		}
	}

	return oneResult ? null : makeFlatAndUnique( results );
}

/**
 * Tests if an element matches an selector part.
 * @param {Node} element      The element to test on.
 * @param {select.Part} part  The selector part for the compareson.
 * @return {boolean} True if matches.
 */
function selectorTest (element, part) {
	// check if the id of the element is current
	if (part.id != null && element.id !== part.id) {
		return false;
	}
	// check if the tag name is currect
	if (part.elementName !== "*" && element.nodeName.toLowerCase() !== part.elementName) {
		return false;
	}
	// check the classes
	var elementClasses = " " + element.className + " ";
	var searchClasses  = part.cls;
	for (var i = 0; i < searchClasses.length; ++i) {
		if (elementClasses.indexOf( " " + searchClasses[i] + " " ) < 0) {
			return false;
		}
	}
	// check attributes
	for (var attrName in part.attr) {
		var attr = element.getAttribute( attrName );
		var attrRx = part.attr[attrName];

		// check if attribute exists
		// funfact: the specs say that getAttribute should always return a string
		// but all browsers (even ie) return null if an attribute doesn't exist
		// see: http://www.w3.org/TR/DOM-Level-2-Core/core.html#ID-666EE0F9
		if (attr == null) return false;

		// check if attribute value is currect
		for (var i = 0; i < attrRx.length; ++i) {
			if (!attrRx[i].test(attr)) {
				return false;
			}
		}
	}
	// check pseudos
	for (var pseudoName in part.pseudo) {
		var pseudo = pseudos[pseudoName];
		var pseudoFunc = pseudo["each"];
		var values = part.pseudo[pseudoName];
		var browserSupport = pseudo.support||0;

		// loop the values this pseudo was requested with
		for (var i = 0; i < values.length; ++i) {
			var value = values[i];
			// does this element match the pseudo?
			if (!pseudoFunc( element, value )) {
				return false;
			}
		}
	}

	// now if the element does contain what it's supposed to containt it's ok
	return !part.hasToContain || doSelect( [part.hasToContain], element, true ) != null;
}

/**
 * Tests if an element matches an selector collection.
 * @param {select.Collection} selectors  a parsed selector
 * @param {Node|null} sourceElement      the element to match
 * @param {Array|NodeList=} origins      the element that is before the selector (optional)
 * @return {boolean} True if selector matches.
 */
function selectorMatch (selectors, sourceElement, origins) {
	// we have to check the origin if we have one
	var checkUntil = origins != null && origins.length ? -1 : 0;
	// loop the selectors
	for (var i = 0; i < selectors.length; ++i) {
		var selector = selectors[i];
		var s = selector.length;
		var matches = true;
		var lastRel = null;
		var element = sourceElement;
		// loop the selector parts backwards
		while (s-- > checkUntil && matches) {
			var part = selector[s];
			matches = false;

			/**
			 * This function checks if an element matches
			 * @return {boolean|undefined}	If it does.
			 */
			function test () {
				// if we now check the virtual selector part -1 (the element the selector was used on)
				if (!part) {
					for (var o = 0; o < origins.length; ++o) {
						if (element === origins[o]) return matches = true;
					}
				// else just test if the selectorPart matches the current element
				} else if (element.nodeType === 1) {
					return matches = selectorTest( element, part );
				}
			}

			// normal selector, loops the dom up until match
			if (lastRel === "") {
				while ((element = element.parentNode) && !test()) {}
			// basic children selector, goes one up
			} else if (lastRel === ">") {
				element = element.parentNode;
				test();
			// sibling selectors (will never select document so just nodeType === 1)
			} else if (lastRel === "+") {
				while ((element = element[prevSibling]) && element.nodeType !== 1) {}
				test();
			} else if (lastRel === "~") {
				while ((element = element[prevSibling]) && (element.nodeType !== 1 || !test())) {}
			// fake selector relation for the first part to check if the given element matches the given element
			} else test();

			// remember the last relation
			if (part) lastRel = part.relation;
		}
		if (matches) return true;
	}
	return false;
}
/**
 * Reduces an array by a selector collection.
 * @param {select.Collection} selectors  a parsed selector
 * @param {Array.<Node>} elementList     the array that has to be reduced
 * @param {Array|NodeList=} origins      the element that is before the selector (optional)
 * @param {boolean=} oneResult           if true the matcher stops on the first result
 * @return {Array.<Node>} The list of matching elements.
 */
function filterSelector (selectors, elementList, origins, oneResult) {
	var newList = [];
	for (var i = 0; i < elementList.length; ++i) {
		var element = elementList[i];
		if (selectorMatch( selectors, element, origins )) {
			if (oneResult) return [element];
			else newList.push( element );
		}
	}
	return newList;
}

// expose to window
window["select"] = select;
