module("Extras tests");

test("Test addNamespace", function() 
{		
	var result = _bmvc.addNamespace("Foo.Datamaskin.Test");
	equals(result, Foo.Datamaskin.Test, "addNamespace creates the correct namespace");
});
