(function(_bmvc){
	
	_bmvc.controls.todo = function()
	{
		
		var self = this;
		
		this.eventListeners = function()
		{
			return [
				{event: _bmvc.READY, handler: init}
			];
		}

		function init()
		{
			$("button").click(clickedOnButton);
			$("#list input").live("click", clickedOnItem);
		}
	
		function clickedOnButton()
		{
			var newData = $("#theData").val();
			self.model.add(newData);
		}
		
		function clickedOnItem()
		{
			var parent = $(this).parent();
			var id = parent.attr("rel");
			var done = parent.find("input:checked").length > 0;
			self.model.update(id, done);
		}
		
	}

})(_bmvc);
