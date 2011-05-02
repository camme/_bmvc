module("Register listener tests");

test("addListener event as string test", function() 
{		
	
	var testHandler = function(){};
	var testStringEventName = "TEST.EVENT.ASSTRING";
	
	var result = _bmvc.addListener(testStringEventName, testHandler, this);
	equals(typeof result[testStringEventName], "object", "An object for the event name has been registred");
	equals(result[testStringEventName][0].handler, testHandler, "The registred object has the correct hanlder");
	equals(result[testStringEventName][0].listeningObject, this, "The registred object has the correct scope");

});

test("removeListener event as string test", function() 
{		
	
	var testHandler = function(){};
	var testStringEventName = "TEST.EVENT.ASSTRING.FOR_REMOVE";
	
	// add a listener
	_bmvc.addListener(testStringEventName, testHandler, this);
	
	var result = _bmvc.removeListener(testStringEventName, testHandler, this);
	equals(result.length, 0, "No more handlers for the event");

});

test("addListener event as class test", function() 
{		
	
	var testStringEventName = "TEST.EVENT.ASCLASS";
	var testHandler = function(){};
	var testEvent = function()
	{
		this.name = testStringEventName;
	};
	
	var result = _bmvc.addListener(testEvent, testHandler, this);
	equals(typeof result[testStringEventName], "object", "An object for the event name has been registred");
	equals(result[testStringEventName][0].handler, testHandler, "The registred object has the correct hanlder");
	equals(result[testStringEventName][0].listeningObject, this, "The registred object has the correct scope");

});

test("removeListener event as string test", function() 
{		
	
	var testStringEventName = "TEST.EVENT.ASCLASS.FOR_REMOVE";
	var testHandler = function(){};
	var testEvent = function()
	{
		this.name = testStringEventName;
	};
	
	// add a listener
	_bmvc.addListener(testEvent, testHandler, this);
	
	var result = _bmvc.removeListener(testEvent, testHandler, this);
	equals(result.length, 0, "No more handlers for the event");

});