module("Internal mechanics");

test("Expose private functions test", function() 
{		

	var undefined;
	
	var testFunction = function()
	{
		function internal()
		{
			return 1001;
		}
	}
	
	equals(testFunction.internal, undefined, "Internal functions are not exposed");
	
	var testInstance = _bmvc.getExposedInstance(testFunction);
	
	ok(testInstance._privates != null, "_privates namespace created");
	ok(testInstance._privates.internal != null, "_privates exposed with correct function");
	ok(testInstance._initPrivates == null, "_initPrivates doesnt exist");

});

