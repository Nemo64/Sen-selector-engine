/** @license under MIT-License */

////////////////////////
// EXTERNAL FUNCTIONS //
////////////////////////

/**
 * The main selector for selecting elements. (wohoo!)
 * Also this function will be the target for all other external functions.
 * @export
 * @param {string} selectorString			The selector.
 * @param {Node|Array.<Node>=} searchIn		The element(s) to search in. (optional)
 * @return {Array.<Node>} The found Elements.
 */
function selector(selectorString, searchIn) {
	return doSelect( selectorParse(selectorString), searchIn || document );
};
/**
 * Test if an element is in the document
 * @export
 * @param {string} selectorString	The selector.
 * @param {Node} toTest				The element to check.
 * @param {Node|Array.<Node>} origin
 * @return {boolean} True if the element matches
 */
selector["test"] = function (selectorString, toTest, origin) {
	if (toTest == null) throw TypeError();
	return toTest.nodeType === 1
		? selectorMatch(
				selectorParse(selectorString),
				toTest,
				(origin && typeof origin.length !== "number") ? [origin] : origin
			)
		: false;
};
/**
 * Reduces the given elementList by the given selector.
 * @export
 * @param {string} selectorString				The selector.
 * @param {Array.<Node>|NodeList} elementList	The element(s) to filter.
 * @return {Array.<Node>} The matching Elements.
 */
selector["filter"] = function (selectorString, elementList) {
	if (elementList == null) throw TypeError();
	return filterSelector( selectorParse(selectorString), filterElements(elementList) );
};
/**
 * returns an array! with only the elements (nodeType == 1) of the given one.
 * This is the external version.
 * @export
 * @param {Array.<*>|NodeList} elements		The list of Nodes to filter
 * @return {Array.<Node>} The filtered result
 */
selector["filterElements"] = function (elements) {
	if (elements == null) throw TypeError();
	return filterElements( elements );
};


///////////
// UTILS //
///////////

// First define some Selector types
// This won't be in the min version and is just for the compiler
/** @typedef {Object.<string, Array.<RegExp>>} */
selector.Attr;
/** @typedef {{ sn: number, v: * }} */
selector.Pseudo;
/** @typedef {function(*, Node, Node):(Array.<Node>|NodeList)} */
selector.Getter;
/** @typedef {{ relation: string, tagName: string, id: (string|null), cls: Array.<string>, attr: selector.Attr, searchName: (string|null), pseudo: Object.<string, Array.<selector.Pseudo>>, hasToContain: (selector.Selector|null), getElementMethodCount: number, prefereNativeSelector: boolean, nativeFailed: boolean }} */
selector.Part;
/** @typedef {Array.<selector.Part>|{ string: string, fullsupport: boolean, useNative: boolean, getter: selector.Getter, getterValue: * }} */
selector.Selector;
/** @typedef {Array.<selector.Selector>} */
selector.Collection;

/**
 * Checks if an element is in it's document.
 * @param {Node} node	The element to check
 * @return {boolean} True if the element is in his document.
 */
function inDocument(node) {
	if (node.nodeType === 9) return true;
	while ((node = node.parentNode) && node.nodeType !== 9) {}
	return node != null;
}
/**
 * Returns an array! with only the elements (nodeType == 1) of the given one
 * @param {Array.<Node>|NodeList} elements	The list of Nodes to filter
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
	for (var i = 0; i < args.length; ++i) {
		var arg = args[i];
		for (var j = 0; j < arg.length; ++j) {
			var toCompare = arg[j], alreadyIn = false;
			
			for (var g = i+1; !alreadyIn && g < args.length; ++g) {
				var compareArray = args[g];
				for (var k = 0; !alreadyIn && k < compareArray.length; ++k) {
					if (compareArray[k] === toCompare) alreadyIn = true;
				}
			}
			if (!alreadyIn) result.push( toCompare );
		}
	}
	return result;
}
/**
 * a function to warn the developer about something that went wrong
 * @param {*} message		The message to show
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
 * @param {string} nodeVersion		the cross browser node version of the getter
 * @param {string=} elementVersion	the not so cross browser element version
 */
function checkElementVersion (nodeVersion, elementVersion) {
	if (elementVersion == null) elementVersion = nodeVersion.replace(/[A-Z]/, "Element$&");
	return elementVersion in testDiv ? elementVersion : nodeVersion;
}

/**
 * A div for testing
 * @type {Node}
 */
var testDiv = document.createElement( "div" );
// some checks for getters
var children       = checkElementVersion("childNodes", "children");
var nextSibling    = checkElementVersion("nextSibling");
var prevSibling    = checkElementVersion("previousSibling");
var firstChild     = checkElementVersion("firstChild");
var lastChild      = checkElementVersion("lastChild");
// check for some more rare selectors
var classSelector  = !!testDiv.getElementsByClassName; // if the browser supports selecting by class
var nativeSelector = !!testDiv.querySelector; // if the browser supports a native selector
var hasFocus       = !!document.hasFocus; // if we can figure out if the document is focused


//////////////////////
// PSEUDO SELECTORS //
//////////////////////

// some expression for the prePseudos
var RxUnEscape        = /^['"]|\\(.)|['"]$/gm;
var RxRxEscape        = /[.*+?|\\()\[\]{}]/g;
var RxNthV            = /^(\d+n)?([+-]?\d+)?$/m;
var RxMainUrl         = /:\/{2,3}([^?#]*)([?#]|$)/m;
var RxDangerousPseudo = /^(matches|not)$/m;
/**
 * Removes escaped chars and the quotes from a string.
 * @param {string} string	The string to unescape
 * @return {string} The unescaped string
 */
function unescapeUse (string) {
	return string.replace(RxUnEscape, "$1");
}
/**
 * Escapes a string for the use in regular expression.
 * @param {string} string	The string to escape
 * @return {string} The escaped string
 */
function escapeForRx (string) {
	return string.replace(RxRxEscape, "\\$&");
}
/**
 * for parsing odd/even/2n+1 etc.
 * @param {string} value
 * @return {{ v: Array.<number> }}
 */
function nthParse (value) {
	value = value.toLowerCase();
	var p = (value === "odd" ? "2n+1" : (value === "even" ? "2n+0": value) ).match( RxNthV );
	if (!p) throw "invalid nth value: "+value;
	return { "v": [parseInt(p[1],10)||0, parseInt(p[2],10)||0] };
};
/**
 * for checking of an element matches an nth(?)
 * @param {Node} element						The element to check
 * @param {Array.<number>} value				The value array from nthParse
 * @param {boolean} forward						If the loop should go forward or backwards
 * @param {function(Node):boolean=} matches		This function checkes if the element matches
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
				return value[0]
					? (((count - value[1]) % value[0]) === 0) // if this one repeats
					: (count === value[1]); // else check if it is
			}
		}
		// get the next element
		child = child[forward ? nextSibling : prevSibling];
	}
	
	return false;
}
/**
 * preParser for selector based pseudos
 * @param {string} value
 * @return {{ sn: number, v: * }}
 */
function psParse (value) {
	var selectors = selectorParse(value);
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
				if (RxDangerousPseudo.test(pname)) {
					sn = 4; break; // supportneed is 4
				}
			}
		}
	}
	return { "sn":sn , "v":selectors };
};
/**
 * Pseudo selector objects with all informations needed for the pseudo.
 * The each method gets called on every element that has to be checked with the pseudo.
 * The get method only gets called if the pseudo is in the last part of a selector and not supported by the browser. (optional)
 * The pre method gets called while a selector gets parsed. (NOTE: the parsed selectors will be cached) (optional)
 * The vendorNames variable contains an array of alternative names for the pseudo that the browser might support (optional)
 * The testValues variable contains an array of test Values (big shock) that the pseudo will be called with on support test. (optional)
 * The testHTML variable contains html that will be used for the test
 * The testResult variable has to contain a selector string that works directly with the querySelector. Note that the result can only be one element.
 *     If no result is expected pass null
 * @type Object.<string, { each: function( Node, *, string, selector.Part ):boolean, get: selector.Getter, pre: function(string), vendorNames: Array.<string>, testValues: Array.<string>, testHTML: string, testResult: string, support: number, supportedName: string }>
 */
var pseudos = selector["pseudo"] = {
	"any-link": {
		"each": function (element) {
			return element.href;
		},
		vendorNames: ["-moz-any-link", "-webkit-any-link"]
	},
	"local-link": {
		"each": function (element, value) {
			return value && element.href && value.test(element.href);
		},
		"pre": function (value) {
			var p = location.href.match(RxMainUrl)[1].split("/");
			var l = p.length;
			value = value === "" ? l : parseInt(value,10);
			if (l < value) throw false; // if there are more url parts wanted than the url has this selector is dead
			return {"v": RegExp( ":\/{2,3}"+escapeForRx(p.slice(0,value).join("/")) ) };
		}
	},
	
	
	// CHILDREN
	"first-child": {
		"each": function (element) {
			while (element = element[prevSibling]) if (element.nodeType === 1) return false;
			return true;
		}
	},
	"last-child": {
		"each": function (element) {
			while (element = element[nextSibling]) if (element.nodeType === 1) return false;
			return true;
		}
	},
	"only-child": {
		"each": function (element) {
			return filterElements(element.parentNode[children]).length === 1;
		}
	},
	"nth-child": {
		"each": function (element, value) {
			return nthCheck(element, value, true);
		},
		"pre": nthParse,
		testValues: ["2n+1"]
	},
	"nth-last-child": {
		"each": function (element, value) {
			return nthCheck(element, value, false);
		},
		"pre": nthParse,
		testValues: ["2n+1"]
	},
	
	
	// TYPE CHILDREN
	"first-of-type": {
		"each": function (element) {
			var name = element.nodeName;
			while (element = element[prevSibling]) if (element.nodeName === name) return false;
			return true;
		}
	},
	"last-of-type": {
		"each": function (element) {
			var name = element.nodeName;
			while (element = element[nextSibling]) if (element.nodeName === name) return false;
			return true;
		}
	},	
	"only-of-type": {
		"each": function (element) {
			var children = element.parentNode[children];
			var name = element.nodeName;
			for (var i = 0; i < children.length; ++i) {
				var child = children[i];
				if (child.nodeName === name) return false;
			}
			return true;
		}
	},
	"nth-of-type": {
		"each": function (element, value) {
			var name = element.nodeName;
			return nthCheck(element, value, true, function (child) { return child.nodeName === name });
		},
		"pre": nthParse,
		testValues: ["2n+1"]
	},
	"nth-last-of-type": {
		"each": function (element, value) {
			var name = element.nodeName;
			return nthCheck(element, value, false, function (child) { return child.nodeName === name });
		},
		"pre": nthParse,
		testValues: ["2n+1"]
	},
	
	
	// MATCH CHILDREN
	"first-match": {
		"each": function (element, value, token, part) {
			if (token.indexOf("n") >= 0) return true; // if we are already in an selection for the first match
			while (element = element[prevSibling]) if (element.nodeType === 1 && selectorTest( element, part, false, token+"n" )) return false;
			return true;
		}
	},
	"last-match": {
		"each": function (element, value, token, part) {
			if (token.indexOf("n") >= 0) return true; // if we are already in an selection for the last match
			while (element = element[nextSibling]) if (element.nodeType === 1 && selectorTest( element, part, false, token+"n" )) return false;
			return true;
		}
	},
	"only-match": {
		"each": function (element, value, token, part) {
			if (token.indexOf("n") >= 0) return true;
			return filterSelector( [[part]], filterElements(element.parentNode[children]), null, false, token+"n" ).length === 1;
		}
	},
	"nth-match": {
		"each": function (element, value, token, part) {
			if (token.indexOf("n") >= 0) return true;
			return nthCheck(element, value, true, function (child) { return selectorTest( child, part, false, token+"n" ) });
		},
		"pre": nthParse,
		testValues: ["2n+1"]
	},
	"nth-last-match": {
		"each": function (element, value, token, part) {
			if (token.indexOf("n") >= 0) return true;
			return nthCheck(element, value, false, function (child) { return selectorTest( child, part, false, token+"n" ) });
		},
		"pre": nthParse,
		testValues: ["2n+1"]
	},
	
	
	// FORM STATUS
	"disabled": {
		"each": function (element) {
			return element.disabled;
		},
		// FF 3.5 reports that hidden inputs are disabled
		testHTML: "<input type='hidden'>",
		testResult: null
	},
	"enabled": {
		"each": function (element) {
			return !element.disabled;
		},
		// FF 3.5 reports that hidden inputs are disabled
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
			return element === element.ownerDocument.activeElement && (!hasFocus || element.ownerDocument.hasFocus()) && (element.type || element.href);
		},
		"get": function (value, ownerDocument) {
			var node = ownerDocument.activeElement;
			return (node && (!hasFocus || ownerDocument.hasFocus()) && (node.type || node.href)) ? [node] : [];
		}
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
			return !selectorMatch(value, element);
		},
		"pre": psParse,
		testValues: ["a","a,a","a a",":not(a)"]
	},
	"matches": {
		"each": function (element, value) {
			return selectorMatch(value, element);
		},
		"get": function (value, ownerDocument, searchOn) {
			return doSelect( value, searchOn );
		},
		"pre": psParse,
		testValues: ["a","a,a","a a",":not(a)"],
		vendorNames: ["-webkit-any", "-moz-any"]
	},
	
	
	// OTHER
	"target": {
		"each": function (element) {
			var hash = location.hash.substr(1);
			return hash && element.id === hash;
		},
		"get": function (value, ownerDocument) {
			var node = ownerDocument.getElementById(location.hash.substr(1));
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
var tagNameReturnsComments = true; // getElementsByTagName("*") returns comments in ie
var attrFullSupported = false; // insensitive attribute selections
var targetSupported = false; // selector target support
	
/**
 * Tests if an selector works or not.
 * @param {string} selector		The selector to test
 * @param {Node=} localTestDiv	An Element to use for the tests
 * @return {Node|null|boolean} One result of the selection, null if nothing was found and false on error
 */
function testSelect (selector, localTestDiv) {
	try { return (localTestDiv || testDiv).querySelector( selector ); }
	catch(e) { return false; }
}

function getPseudo (pname) {
	// if the pseudo isn't known
	if (!(pname in pseudos)) return null;
	
	// get the pseudo
	var pseudo = pseudos[pname];
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
			for (var i = 0; i < testValues.length && testSelect( ":"+name+"("+testValues[i]+")", testDiv ) === testResult; ++i) {
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
	if (!testDiv.getElementsByClassName || testDiv.getElementsByClassName("b").length < 1) {
		classSelector = false;
	} else {
		// else check if the element will still be found if we take the class away (cache bug in Safari 3.1)
		testDiv.firstChild.className = "";
		classSelector = testDiv.getElementsByClassName("b").length < 1;
	}
}

// check if getElementsByTagName returns comments
tagNameReturnsComments = testDiv.getElementsByTagName("*").length > 1;

// destroy testDiv to release memory
testDiv = null;


//////////////////////
// SELECTOR PARSING //
//////////////////////

// A bunch of regular expression for the parsing of an selector
var RxRelate   = /^\s*([>+~]?)\s*/m;
var RxName     = /^\*|^([\w-]|\\.)*/m;
var RxId       = /^#(([\w-]|\\.)*)/m;
var RxClass    = /^\.(([\w-]|\\.)*)/m;
var RxPseudo   = /^:([\w-]*)\s*(\(([^()]*(\([^()]*(\([^()]*\))?\))?)\))?/m;
var RxAttr     = /^\[(([\w-]|\\.)*)(([\^*$|]?)=(['"]([^\\'"]|\\.)*['"]|[\w-]*)(\s*i)?)?\]/m;
var RxPreMod   = /^\$/m;
var RxNextOne  = /^\s*,\s*/m;
var RxSSplit   = /\s+/g;
var RxIsQuote  = /^['"].*['"]$/m;
var RxBorderMod= /^[\^*$]/m;
var RxSkipOne  = /^\s*((\(([^()]*(\([^()]*(\([^()]*\))?\))?)\)|['"]([^\\'"]|\\.)*['"]|\\,|[^,])*)\s*/m;
var RxATList   = { '':["^","$"], '*':["",""], '^':["^",""], '$':["","$"], '~':["(^| )","( |$)"], '|':["^","(-|$)"] };
/**
 * Cached selectors
 * @type {Object.<string, selector.Collection>}
 */
var selectorCache = {};

/**
 * A bunch of function that get called to parse the selector.
 * The key has to identify when they are called. The key won't be removed from the string
 * @type Object.<string, function(selector.Part, Function, selector.Selector)>
 */
var parseFuncs = {
	/**
	 * This is the parser function for id's
	 * @param {selector.Part} part
	 * @param {Function} getSegment
	 * @param {selector.Selector} selector
	 */
	"#": function (part, getSegment, selector) {
		// multible id's result into an impossible selector
		if (part.id != null) throw false;
		
		// get the id out of the selector
		var segment = getSegment( RxId, true );
		if (!segment[1]) throw "invalid id";
		
		part.id = unescapeUse( segment[1] ); // unescape the id and return it
		selector.idPart = selector.length - 1; // tell that this part has the last id in the selector
		++part.getElementMethodCount; // this is a getElementMethod
	},
	/**
	 * This is the parser function for classes
	 * @param {selector.Part} part
	 * @param {Function} getSegment
	 * @param {selector.Selector} selector
	 */
	".": function (part, getSegment, selector) {
		// get the class out of the selector
		var segment = getSegment( RxClass, true);
		if (!segment[1]) throw "invalid class";
		
		// add the class to the class list
		part.cls.push( unescapeUse(segment[1]) );
		// getElementMethodCount will be set later
	},
	/**
	 * This is the parser function for attributes
	 * @param {selector.Part} part
	 * @param {Function} getSegment
	 * @param {selector.Selector} selector
	 */
	"[": function (part, getSegment, selector) {
		var segment = getSegment( RxAttr );
		
		var attrName = unescapeUse( segment[1] );
		var mod = segment[7];
		var type = segment[4] || "";
		var value = segment[5];
		var hasValue = typeof value === "string";
		var isInQuotes = hasValue ? RxIsQuote.test( value ) : false;
		
		if (!segment[0]) throw "invalid attribute";
		
		// add this attribute the search list if it doesn't exist yet
		if (!(attrName in part.attr)) part.attr[attrName] = [];
		
		// if this attribute selector is supported rebuild it and add it to full
		if (nativeSelector && (!mod || attrFullSupported)) {
			selector.string += "["+segment[1]+(hasValue ? (type+'='+(isInQuotes ? value : '"'+value+'"')+(mod||"")) : "")+"]";
		// else this selector can't be done fully natively
		} else selector.fullsupport = false;
		
		// if the attribute is supposed to have a value
		if (hasValue) {
			// if the value is empty and the mod is a border mod
			if (value === "" && RxBorderMod.test( mod )) {
				throw false; // skip this selector
			}
			// unescape if surrounded by quoted
			if (isInQuotes) value = unescapeUse( value );
			
			// if this is a possible candidate for getElementByName
			if (attrName === "name" && !mod && type === "") {
				part.searchName = value;
				++part.getElementMethodCount;
			// if not prefere the native selector
			} else part.prefereNativeSelector = true;
			
			// create an expression that can simply be used on the attribute
			part.attr[attrName].push( RegExp(RxATList[type][0] + escapeForRx(value) + RxATList[type][1], mod ? 'im' : 'm') );
		
		// if this is just a "has attribute" selector prefere to do it natively
		} else part.prefereNativeSelector = true;
	},
	/**
	 * This is the parser function for pseudo selectors
	 * @param {selector.Part} part
	 * @param {Function} getSegment
	 * @param {selector.Selector} selector
	 */
	":": function (part, getSegment, selector) {
		// get the pseudo
		var segment = getSegment( RxPseudo );
		if (!segment[0]) throw "invalid pseudo";
		
		var name = segment[1];
		var value = segment[3]||"";
		var pseudo = getPseudo( name );
		
		// use the pseudo parse function if there is any or just crate a pseudo object with basic infos
		var pseudoObj = pseudo["pre"] ? pseudo["pre"]( value ) : { "sn":1, "v":value };
		
		// if pseudo used the first time create an array for values
		if (!part.pseudo[name]) part.pseudo[name] = [];
		
		// if the native selector could do this selection
		if (pseudo.support >= (pseudoObj["sn"] || 1)) {
			// create a selector string and add it
			selector.string += ":" + pseudo.supportedName + (value ? "("+value+")" : "");
			part.prefereNativeSelector = true;
		
		// selector isn't natively supported
		} else {
			selector.fullsupport = false;
			// if there is a getter in the pseudo
			if (pseudo["get"]) {
				selector.getter = pseudo["get"];
				selector.getterValue = pseudoObj["v"];
			}
		}
		
		// add the pseudo object to the selector
		part.pseudo[name].push( pseudoObj );
	}
};

/**
 * Parses a selector to an abstract object.
 * @param {string} selectString		The selector-string
 * @return {selector.Collection} A selector
 */
function selectorParse (selectString) {
	var string = selectString;
	/** @type {selector.Collection} */
	var selectors = [];
	if (typeof selectString !== "string") return selectors; // if no string given return empty selector collection
	if (selectorCache[selectString]) return selectorCache[selectString]; // if already parsed just return
	
	// loop all selectors (comma seperated)
	while (string) {
		/**
		 * create the selector
		 * @type {selector.Selector}
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
				 * @type {selector.Part}
				 */
				var part = {
					relation: "", tagName: "*", id: null, cls: [], attr: {}, searchName: null, pseudo: {}, hasToContain: null,
					getElementMethodCount: 0, prefereNativeSelector: false, nativeFailed: false
				};
				// variables for later
				var isTarget, tagName;
				// push it into the selector
				selector.push( part );
		
				/**
				 * Unshifts a part of the selector string, adds it to the selector strign (if needed) and returns the match
				 * @param {RegExp} Rx		The expression to use
				 * @param {boolean} addfull	If true result will be addded to the selector string
				 * @return {Array.<string>} The result of the matching
				 */
				function getSegment (Rx, addfull) {
					var result = string.match(Rx) || [""]; // execute the regular expression
					var full   = result[0];
					if (full) {
						string = string.substr( full.length ); // remove the parsed part from the string
						if (addfull && nativeSelector) selector.string += full;
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
				tagName = getSegment( RxName, false )[0].toUpperCase() || "*";
				if (tagName && tagName !== "*") {
					if (nativeSelector) selector.string += tagName;
					part.tagName = unescapeUse( tagName ); // if there is a tag name unescape it and save it
					++part.getElementMethodCount; // this is a getElementMethod
				} else selector.string += "*";
		
		
				// now, depending on the next char, call parser functions
				while (parseFuncs[string.charAt(0)]) {
					parseFuncs[string.charAt(0)](part, getSegment, selector);
				}
		
		
				// handle target
				// TODO: this shouldn't be seperated from the main query (mayor performance loose)
				if (isTarget) {
					part.hasToContain = selectorParse( getSegment(RxSkipOne, targetSupported)[1] || "" )[0];
					if (targetSupported) selector.string += part.hasToContain.string;
					else selector.fullsupport = false;
				}
		
				// throw error if the parser hasn't done anything yet
				if (!somethingAdded) throw "couldn't parse";
		
				// if there were classes in the selector
				if (part.cls.length) {
					// if class selector is supported this is a getElementMethod
					if (classSelector) ++part.getElementMethodCount; 
					else part.prefereNativeSelector = true;
				}
		
		
			} while (string && !RxNextOne.test(string)); // as long as there is no comma but more string
		
		// if this selector threw an error skip it
		} catch (e) {
			// if the thrown object is false we have an dead selector. Just skip it
			if (e === false) {
				var toSkip = string.match( RxSkipOne ); // get everything until the next selector
				string = toSkip ? string.substr( toSkip[0].length ) : ""; // cut the selector off
				selectors.pop(); // remove everything the loop has created for the defect selector
			// if the thrown object is a string extend it and throw real error
			} else if (typeof e === "string") {
				throw SyntaxError(e + " selector: "+selectString); // throw SyntaxError
			// else this isn't our error so just throw it further
			} else throw e;
		}
		
		// check if the native selector shouldn't be prefered
		if ((selector.length === 1 && !selector[0].prefereNativeSelector && selector[0].getElementMethodCount < 2) || selector.getter) {
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
 * @param {selector.Collection} selectors		The parsed selector to use.
 * @param {Array.<Node>|Node} searchOn			The element(s) to search on.
 * @param {string=} token						This string will be passed rekulsive.
 * @return {Array.<Node>} A list of matching elements
 */
function doSelect (selectors, searchOn, token) {
	
	/**
	 * this is an array of array results
	 * later there has to be taken care that it is unique
	 * @type {Array.<Array.<Node>>}
	 */
	var results = [];
	/**
	 * this is an array which tells the filter at the end which element has to come before the selector
	 * @type {Array.<Node>}
	 */
	var origins = null;
	
	// we need to decide on which element the selectors should be cast
	// if it is an array we search use the document node of the first
	// TODO: support array of elements from multible documents
	if (typeof searchOn.length === "number") {
		// use all given elements as origin
		origins = filterElements( /** @type {Array.<Node>} */ (searchOn) );
		// if the origin array is empty there also can't be any results
		if (origins.length === 0) return [];
		// if the origin array has one entry we might as well search from it
		if (origins.length === 1) searchOn = origins[0];
		// else we search from the document so we don't have to selecto multible times
		else searchOn = origins[0].ownerDocument;
	// else we search from our... searchOn
	} else if (searchOn.nodeType === 1 || searchOn.nodeType === 9) {
		origins = [searchOn];
	} else return [];
	
	/** @type {Node} */
	searchOn;
	
	/**
	 * the document of the element
	 * @type {Node}
	 */
	var ownerDocument = (searchOn.nodeType === 9 ? searchOn : searchOn.ownerDocument);
	
	for (var i = 0; i < selectors.length; ++i) {
		var selector = selectors[i];
		var useNative = (nativeSelector && selector.useNative && !selector.nativeFailed);
		/**
		 * the results of the selector
		 * @type {Array.<Node>|NodeList}
		 */
		var tmpResult = [];
		
		// if the native selector should be prefered try it
		if (useNative) try {
			tmpResult = searchOn.querySelectorAll( selector.string );
		} catch (e) {
			err("querySelector error on: '"+selector.string+"'\n"+e);
			useNative = false;
			selector.nativeFailed = true;
		}
		
		// if this selector has to be done simple
		if (!useNative) {
			var part = selector[selector.length - 1];
			
			// the id selector should always be used if searched for an id
			// if in our selector is a id and our searchOn is in the document
			if (selector.idPart != null && inDocument( /** @type {Node} */ (searchOn) )) {
				/** @type {selector.Part} */
				var idPart = selector[selector.idPart];
				/** @type {Node} */
				var ele = ownerDocument.getElementById( idPart.id );
				
				// if there was an element found and if it matches the id exactly (case insensitive bug in some browsers)
				if (ele && ele.id === idPart.id) {
					// check if it matches the selector until the idPart
					if (selectorMatch( selector.slice(0, selector.idPart+1), ele, origins )) {
						// this is our result if the idPart is the last part
						if (idPart === part) tmpResult = [ele];
						// else it is our new searchOn for the next selectors
						else searchOn = ele;
					// if it doesn't match
					} else searchOn = null;
				}
			}
			
			// if there are no results yet (the resulting item has no id or the id was invalid)
			if (!tmpResult.length && searchOn) {
				// if this selector should use a getter
				if (selector.getter) {
					tmpResult = selector.getter( selector.getterValue, ownerDocument, searchOn );
				// check if class selector is available and if there are classes in our selector part use it
				} else if (classSelector && part.cls.length) {
					tmpResult = searchOn.getElementsByClassName( part.cls.join(" ") );
				// check if the selector part searches for a name attribute and use that selector
				} else if (part.searchName != null) {
					tmpResult = ownerDocument.getElementsByName( part.searchName );
				// else use the tagName selector (tagName is * star if there wasn't a tag name selected)
				} else {
					tmpResult = searchOn.getElementsByTagName( part.tagName );
					// if searched for a "*", ie returns comments
					if (tagNameReturnsComments && part.tagName === "*") {
						tmpResult = filterElements( tmpResult );
					}
				}
			}
		}
		
		// use the native selector if ...
		if (tmpResult.length // ... we have results AND ...
		 && (origins.length > 1 || !selector.fullsupport // ... more than one origin was used, lack of support, ...
		 || (!nativeSelector && selector.useNative) || selector.nativeFailed // ... native selector wasn't used but should have been ...
		)) {
			tmpResult = filterSelector( [selector], tmpResult, origins, useNative, token );
		}
		
		// if there are still elements in the array add them
		if (tmpResult.length) results.push( tmpResult );
	}
	
	return makeFlatAndUnique( results );
}

/**
 * Tests if an element matches an selector part.
 * @param {Node} element		The element to test on.
 * @param {selector.Part} part	The selector part for the compareson.
 * @param {boolean=} queried	If true basics like tag-name etc. won't be checked.
 * @param {string=} token		This string will be passed to all pseudo funcs.
 * @return {boolean} True if matches.
 */
function selectorTest (element, part, queried, token) {
	if (!queried) {
		if (part.id != null && element.id !== part.id) return false; // check id
		if (part.tagName != null && part.tagName !== "*" && element.nodeName.toUpperCase() !== part.tagName) return false; // check tag name
		
		// get a list of classes
		var classList = element.className ? element.className.split( RxSSplit ) : [];
		// check every class for existence
		for (var i = 0; i < part.cls.length; i++) {
			var found = false;
			var searchClass = part.cls[i];
			// search for the class on the element
			for (var c = 0; c < classList.length && !found; ++c) {
				if (classList[c] === searchClass) {
					found = true;
				}
			}
			if (!found) return false; // if this class wasn't found return
		}
	}
	// check attributes
	for (var attrName in part.attr) {
		var attr = element.getAttribute( attrName );
		var attrRx = part.attr[attrName];
		
		// check if attribute exists
		if (typeof attr !== "string") return false;
		
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
		
		// loop the values this pseudo was called with
		for (var i = 0; i < values.length; ++i) {
			var value = values[i];
			if (queried && browserSupport >= value["sn"]) continue; // skip if the browser is able and has already done it
			if (!pseudoFunc( element, value["v"], token||"", part )) return false; // check if pseudo matches
		}
	}
	if (part.hasToContain && !doSelect( [part.hasToContain], element ).length) return false; // if some elements have to be in the element
	return true;
}

/**
 * Tests if an element matches an selector collection.
 * @param {selector.Collection} selectors	a parsed selector
 * @param {Node|null} sourceElement			the element to match
 * @param {Array|Node=} origins				the element that is before the selector (optional)
 * @param {boolean=} queried				if query selector was used some checks can be skipped (optional)
 * @param {string=} token					This string will be passed to all pseudo funcs.
 * @return {boolean} True if selector matches.
 */
function selectorMatch (selectors, sourceElement, origins, queried, token) {
	for (var i = 0; i < selectors.length; ++i) {
		var selector = selectors[i];
		var s = selector.length;
		var matches = true;
		var lastRel = null;
		var element = sourceElement;
		var checkUntil = origins != null && origins.length ? -1 : 0;
		// loop the selector parts backwards
		while (s-- > checkUntil && matches) {
			var part = selector[s];
			matches = false;
			
			/**
			 * This function checks if an element matches
			 * @return {boolean}	If it does.
			 */
			function test () {
				// if we now check the virtual selector part -1 (the element the selector was used on)
				if (!part) {
					for (var o = 0; !matches && o < origins.length; ++o) {
						if (element === origins[o]) matches = true;
					}
				// else just test if the selectorPart matches the current element
				} else if (element.nodeType === 1) {
					matches = selectorTest( element, part, queried, token );
				}
				return matches;
			}
			
			// normal selector, loops the dom up until match
			if (lastRel === "") {
				while (element = element.parentNode) if (test()) break;
			// basic children selector, goes one up
			} else if (lastRel === ">") {
				element = element.parentNode;
				test();
			// sibling selectors (will never select document so just nodeType === 1)
			} else if (lastRel === "+") {
				while (element = element[prevSibling]) if (element.nodeType === 1) {
					test();
					break;
				}
			} else if (lastRel === "~") {
				while (element = element[prevSibling]) if (element.nodeType === 1 && test()) {
					break;
				}
			// fake selector relation for the first part to check if the given element matches the given element
			} else if (!lastRel) test();
			if (part) lastRel = part.relation;
		}
		if (matches) return matches;
	}
	return false;
}
/**
 * Reduces an array by a selector collection.
 * @param {selector.Collection} selectors	a parsed selector
 * @param {Array.<Node>} elementList		the array that has to be reduced
 * @param {Array|Node=} origins				the element that is before the selector (optional)
 * @param {boolean=} queried				if query selector was used some checks can be skipped (optional)
 * @param {string=} token					This string will be passed to all pseudo funcs.
 * @return {Array.<Node>} The list of matching elements.
 */
function filterSelector (selectors, elementList, origins, queried, token) {
	var newList = [];
	for (var i = 0; i < elementList.length; ++i) {
		if (selectorMatch( selectors, elementList[i], origins, queried, token )) newList.push( elementList[i] );
	}
	return newList;
}


// expose to window
window["selector"] = selector;
