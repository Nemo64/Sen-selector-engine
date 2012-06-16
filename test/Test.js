//(function(window) {
	
	// some functions used
	function ObjOutput (obj) {
		switch (typeof obj) {
			case "string": return '"'+obj+'"';
			case "undefined": return "undefined";
			case "object":
				if (obj == null) return "NULL";
				switch (obj.constructor) {
					case Object:
						var result = [];
						for (var name in obj) if (obj.hasOwnProperty(name)) {
							result.push('"'+name+'": '+ObjOutput(obj[name]));
						}
						return "{ "+result.join(", ")+" }";
					case Array:
						var result = [];
						for (var i = 0, len = obj.length; i < len; ++i) {
							result.push( ObjOutput(obj[i]) );
						}
						return "[ "+result.join(", ")+" ]";
				}
		}
		// if still nothing return use toString
		return obj.toString();
	}
	function pad (string, num, padOn) {
		var toPadOn = "";
		padOn = (padOn || " ").toString();
		string = string.toString() || "";
		
		for (var i = 0, add = num - string.length; i < add; ++i) {
			toPadOn += padOn;
		}
		
		return toPadOn + string;
	}
	
	window.Testsuit = function Testsuit () {
		var parent = this;
		this.iniHelper = function (testObj) {
			return [ document.createElement("div"), document.createElement("pre") ];
		};
		
		this.Test = function Test (testIn) {
			if (typeof testIn !== "object" || testIn.nodeType !== 1) throw "Tester has to have an Element to Log In!";
			var testObj = parent.iniHelper(testIn);
			this.testIn = testObj[0];
			this.logIn  = testObj[1];
			this.logIn.className += " LogArea";
			
			this.passed = 0;
			this.done   = 0;
			this.parent = parent;
		};
		this.Test.prototype = testPrototype;
		
		this.passed = 0;
		this.done   = 0;
		
		this.toDo   = []; // array of functions to execute 
		this.isRunning = false;
	};
	
	Testsuit.prototype = {
		toString: function () {
			var prefix = "<strong>" + ((this.passed === this.done) ? "Everything is fine" : "Some errors accured") + "</strong>";
			return prefix+" Passed "+this.passed+" of "+this.done+" Tests ("+(this.passed / this.done * 100).toFixed(1)+"%)";
		},
		
		run: function () {
			if (!this.isRunnning) {
				var toDos = this.toDo;
				function doOne () {
					var toDo = toDos.shift();
					if (typeof toDo === "function") {
						toDo();
						setTimeout(doOne, 10);
					}
				}
				doOne();
			}
		}
	};
	
	var testPrototype = {
		testHead: function (type) {
			++this.parent.done;
			return (++this.done)+". `"+type+"` - ";
		},
		createMsg: function (msg, cls, func) {
			msg = msg.replace(/\`([^`]*)\`/g, "<strong>$1</strong>");
		
			var line = document.createElement("p");
			line.className = "logmsg "+cls;
			line.innerHTML = msg;
			
			// define showcode
			if (func) {
				var codeLink = document.createElement("a"),
					codeEle  = document.createElement("code"),
					codeText = document.createTextNode(func.toString());
				codeEle.appendChild(codeText);
				codeEle.style.display = "none";
				line.appendChild(codeEle);
				
				codeLink.innerHtml = "[Show Code]";
				codeLink.href = "#";
				codeLink.onclick = function () { codeEle.style.display = codeEle.style.display ? "" : "none" };
				codeLink.style.float = "right";
				codeLink.style.display = "block";
				line.insertBefore(codeLink, line.firstChild);
			}
			
			// append that mess
			this.logIn.appendChild(line);
		},
		
		log: function (msg, cls) {
			this.createMsg(msg, "log "+cls);
		},
		pass: function (msg, func) {
			++this.passed; ++this.parent.passed;
			this.createMsg(this.testHead("PASS")+msg, "pass", func);
		},
		fail: function (msg, func) {
			this.createMsg(this.testHead("FAIL")+msg, "fail", func);
		},
		
		exec: function (msg, func, expect, prepare) {
			var rVal = false, per100MSec = "Int32Array" in window ? new Int32Array(10) : [0,0,0,0,0,0,0,0,0,0],
				start = (new Date()).getTime(), now = 0, exe = 0, failed = false;
			try { while ((now = (new Date()).getTime()) - 100 < start) {
				
				if (prepare) prepare.call(this.testIn);
				
				var got;
				if ((got = func.call(this.testIn)) !== expect) throw { after:exe, got:got };
				
				++exe; ++per100MSec[Math.floor( (now - start) * 0.1 )];
				
			} } catch (e) {
				
				failed = true;
				if (e.constructor === Object) {
					this.fail(
						msg+"<br />got: "+ObjOutput(e.got)+"<br />expected: "+ObjOutput(expect), func
					);
				} else {
					this.fail(
						msg+"<br />threw Error: "+e.name, func
					);
				}
			}
			
			if (!failed) {
				var fastest = 0,
					slowest = per100MSec[0];
				
				for (var i = 0, len = per100MSec.length; i < len; ++i) {
					var c = per100MSec[i];
					
					if (c < slowest) slowest = c;
					if (c > fastest) fastest = c;
				}
				this.pass(msg+"<span class=\"time\">executions:`"+pad(exe*10, 8)+"`/sec, fastest:`"+pad(fastest*100, 8)+"`/sec, slowest:`"+pad(slowest*100, 8)+"`/sec</span>");
			}
		},
		
		addTest: function (msg, func, expect, prepare) {
			var self = this;
			this.parent.toDo.push(function () {
				self.exec( msg, func, expect, prepare );
			});
		},
		
		finish: function () {
			var self = this;
			this.parent.toDo.push(function () {
				self.log(self.toString(), "conclusion");
			});
		},
		
		toString: Testsuit.prototype.toString
	}

//})(window);
