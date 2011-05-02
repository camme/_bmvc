(function(_bmvc){
	
	_bmvc.views.todo = function()
	{
		
		var self = this;

		this.eventListeners = function()
		{
			return [
				{event: todo.events.DATA_UPDATED, handler: dataHasBeenUpdated}
			];
		}
		
		function dataHasBeenUpdated(event)
		{
			var listRef = $("#list").empty();
			for(var i = 0, ii = event.data.length; i < ii; i++)
			{
				var item = event.data[i];
				var newLi = $("<li><input type='checkbox'/><span>" + event.data[i].name + "</span></li>");
				
				newLi.attr("rel", item.id);
				
				if (item.done)
				{
					newLi.find("input").attr("checked", "true");
				}
				
				listRef.append(newLi);
			}
		}	
		
	}

})(_bmvc);







