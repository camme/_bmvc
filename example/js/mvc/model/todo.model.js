(function(_bmvc){
	
	_bmvc.models.todo = function()
	{
		
		var self = this;
		var myData = [];
		
		this.eventListeners = function()
		{
			return [];
		}
		
		this.add = function(newData)
		{
			myData.push(
				{
					name: newData,
					done: false,
					id: Math.random().toString()
				}
			);
			var event = new todo.events.DATA_UPDATED(myData);	
			_bmvc.sendEvent(event);
		}
		
		this.update = function(id, done)
		{
		
			for(var i = 0, ii = myData.length; i < ii; i++)
			{
				var item = myData[i];
				if (item.id == id)
				{
					item.done = done;
				}
			}
			
		}
		
		
	}

})(_bmvc);
