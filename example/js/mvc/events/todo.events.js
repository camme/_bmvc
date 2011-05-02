(function()
{
	var ns = _bmvc.addNamespace("todo.events");
	
	ns.DATA_UPDATED = function(data)
	{
		this.data = data;
		this.name = "todo.events.DATA_UPDATED";
	}
	
}
)();
