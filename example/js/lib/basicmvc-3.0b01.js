/**
 *
 * BasicMVC 3.0
 * 
 * A new version of basic mvc. sorry to re-write everything again. but its for the better.
 *  
 */
 
(function( window, undefined){
	
var _bmvc = 
	
	(function(){
		
		//_bmvc = this;
		
		// create a local reference;
		var _bmvc = new function(){ this.name = "_bmvc"; }();
		
		// generel function for singletons
		var getInstance = function()
		{
			if (this._instance == null)
		  	{
		  		this._instance = new this();
		  	}
	
		  	return this._instance;
		}
		
		var getInstanceName = function(eventRef)
		{
			var tempRef = new eventRef();
			var tempRefName = tempRef.name;
			delete tempRef;
			return tempRefName;
		}
		
		// expose the get instance name function (for testing?)
		_bmvc.getInstanceName = getInstanceName;
		
		// show log
		_bmvc.showLog = location.search.indexOf("log") != -1;
		
		// this is where we will save all registred objects.
		_bmvc.objects = {};
		_bmvc.models = {};
		_bmvc.controls = {};
		_bmvc.views = {};
		
		var referenceToEventListeners = {};
		var objectsRegistred = false;
		var domReadyBound = false;
		var Types = {MODEL: "model", CONTROL: "control", VIEW: "view"}
		var allObjectsMap = {};
		var globalListeners = [];
		
		// are e in test mode?
		_bmvc.unitTestMode = false;
		
		/*
		 * Some system events
		 */
		_bmvc.READY = function()
		{
			this.name = "_bmvc.READY";
		};
		 
		
		
		var sendEventForObjects = function(event)
		{
			_bmvc.sendEvent(event, this);
		}
		
		// method for adding listeners
		_bmvc.addListener = function(event, handler, listeningObject)
		{
			var name = getInstanceName(event);
			if (!referenceToEventListeners[name])
			{
				referenceToEventListeners[name] = [];
			}
			referenceToEventListeners[name].push({handler: handler, listeningObject: listeningObject});
		}
		
		_bmvc.removeListener = function(event, handler, listeningObject)
		{
			var name = getInstanceName(event);
			if (!referenceToEventListeners[name])
			{
				referenceToEventListeners[name] = [];
			}
			
			var listeners = referenceToEventListeners[name];
			for(var i = 0, ii = listeners.length; i < ii; i++)
			{
				if (listeningObject == listeners[i].listeningObject)
				{
					delete listeners[i];
				}
			}
		}
		
		// method for registring new functions
		_bmvc.register = function(classRef, name, type)
		{
	
			// this is done to expose private functions
			// we create a new function inside the class trough some string manipulation, the we replace the original class with our new class with eval
			if (_bmvc.unitTestMode)
			{
				// we know that this is the naming convention
				var className = "_bmvc." + type + "s." + name;
				
				// and ere we have the actual code in the class
				var funcString = className + " = " + classRef.toString();
				
				// begin to change the class
				funcString = funcString.substring(0, funcString.length - 1);
				funcString += "this._pp = function(f)";
				funcString += "{";
				funcString += "var fs = f.toString();";
				funcString += "var pf = fs.match(/function\\s*?(\\w.*?)\\(/g);";
				funcString += "this._privates = {};";
				funcString += "for (var i = 0, ii = pf.length; i < ii; i++)";
				funcString += "{";
				funcString += "	var fn = pf[i].replace(/(function\\s+)/, '').replace('(', '');";
				funcString += "	this._privates[fn] = eval(fn);";
				funcString += "}";
				funcString += "}";
				funcString += "\n\n}";
				
				// ugly
				classRef = eval(funcString);
			}
			
			
			// add a new method to create singletons		
			classRef.getInstance = getInstance;
		
			// add the send event method		
			classRef.prototype.sendEvent = sendEventForObjects;
	
			// create a new instance
			var instance = classRef.getInstance();
			
			
			// now that we have an instance, and if we are in test mode, run the funcito to get the private functions and then delete it
			if (_bmvc.unitTestMode)
			{
				instance._pp(classRef.toString())
				delete instance._pp;
			} 
			
			
			
			// if the instance doesnt have a name, we need it to register a name
			if (!name)
			{
				instance.name = "_internal_name_" + Math.random().toString().replace(".", "") + "." + type;
			}
			else
			{
				instance.name = name;
			}
			
			if (type)
			{
				instance.typeName = instance.name + "." + type;
				
				if (type == Types.CONTROL)
				{
					instance.model = getObject(instance.name, Types.MODEL);
				}
				
				if (type == Types.VIEW)
				{
					instance.control = getObject(instance.name, Types.CONTROL);
					instance.model = getObject(instance.name, Types.MODEL);
				}
				
			}
			else
			{
				instance.typeName = instance.name
			}
			
			allObjectsMap[instance.typeName] = instance;
	
			if (_bmvc.showLog)
			{
				console.log("BasicMVC: Register ", instance.typeName);
			}
			
			// get the predefined listeners
			var listeners = instance.eventListeners();
			
			// if there is a list of event listeners, use it right now
			// if we are in unit test mode we dont send the events
			if (listeners && !_bmvc.unitTestMode)
			{
				for(var i = 0, ii = listeners.length; i < ii; i++)
				{
					// get the current object...
					var eventListenerObject = listeners[i];
					
					// ...and register it
					 _bmvc.addListener(eventListenerObject.event, eventListenerObject.handler, instance);
				}
			}
	
			
		}
		
		// add global listeners
		_bmvc.addGlobalListener = function(listener)
		{
			globalListeners.push(listener);
		}

		
		// method for sending events
		_bmvc.sendEvent = function(event, sender)
		{
			
			// only send events if we arent in test mode
			if (!_bmvc.unitTestMode)
			{
			
				if(_bmvc.showLog)
				{
					sender = sender ? sender : {name: "_root"};
					console.info("BasicMVC EVENT (sent from '" + sender.name + "'): " + event.name + " - ", event);
				}
				
				// get all listeners
				var listeners = referenceToEventListeners[event.name];
				
				// since some events are sent to the server, this doesnt have a purpose
				/*
				if(!listeners)
				{
					if(_bmvc.showLog && event.name != "_bmvc.READY")
					{
						console.warn("BasicMVC: No listeners registred for event '" + event.name + "'");
					}
				}
				*/


				// if we find listeners, loop trough them and send the event to the listening objects
				if (listeners)
				{
					for(var i = 0, ii = listeners.length; i < ii; i++)
					{
						var listeningObject = listeners[i].listeningObject;
					 	listeners[i].handler.call(listeningObject, event);
					}
				}
				
				// go trough all global listeners if any
				for(var i = 0, ii = globalListeners.length; i < ii; i++)
				{
					var listeningObject = globalListeners[i];
				 	listeningObject.call(listeningObject, event);
				}
			}
			
		}
		 
		// method to add namespaces
		_bmvc.addNamespace = function(namespaceString)
		{
			var nameStringParts = namespaceString.split(".");
			var currentNamespace = window;
			for (var i = 0, ii = nameStringParts.length; i < ii; i++)
			{
				currentNamespace = currentNamespace[nameStringParts[i]] = currentNamespace[nameStringParts[i]] || {};
			}
			return currentNamespace;
		}
		
		function getObject(name, type)
		{
			return allObjectsMap[name + "." + type];
		}
		
		function registerAllObjects()
		{
			for (var obj in _bmvc.objects)
			{
				_bmvc.register(_bmvc.objects[obj], obj);
				//delete _bmvc.objects[obj];
			}
			
			for (var obj in _bmvc.models)
			{
				_bmvc.register(_bmvc.models[obj], obj, Types.MODEL);
				//delete _bmvc.models[obj];
			}
			
			for (var obj in _bmvc.controls)
			{
				_bmvc.register(_bmvc.controls[obj], obj, Types.CONTROL);
				//delete _bmvc.controls[obj];
			}
			
			for (var obj in _bmvc.views)
			{
				_bmvc.register(_bmvc.views[obj], obj, Types.VIEW);
				//delete _bmvc.views[obj];
			}
			
			objectsRegistred = true;
			
			// everything is ready, lets send the signal to the system
			_bmvc.sendEvent(new _bmvc.READY(), _bmvc);
			
		}
		
		function init()
		{
			// make sure we only do this once
			if (domReadyBound)
			{
				return;
			}
			
			domReadyBound = true;
			
			// if we can use addeventlistener
			if (document.addEventListener) 
			{
		        // Use the handy event callback
		        document.addEventListener("DOMContentLoaded", 
		        	function()
		        	{
		        		// remove it again
		            	document.removeEventListener("DOMContentLoaded", arguments.callee, false);
						
						// register
						registerAllObjects();	
	
		        	}, false);
		        
		    }
		    else
		    {
		    	// if ie
		        if (document.attachEvent) 
		        {
		        	
		            // ensure firing before onload,
		            // maybe late but safe also for iframes
		            document.attachEvent("onreadystatechange", 
		            	function()
		            	{
		                	if (document.readyState === "complete") 
		                	{
		                    	document.detachEvent("onreadystatechange", arguments.callee);
		                    	registerAllObjects();	
		                	}
		            	}
		            );	
		            
		            //if ie and not iframe
		            if (document.documentElement.doScroll && window == window.top)
	                (
	                	function()
	                	{
		                    if (objectsRegistred)
		                    {
		                        return;
		                    }
		                    
		                    try {
		                        // If IE is used, use the trick by Diego Perini
		                        // http://javascript.nwbox.com/IEContentLoaded/
		                        document.documentElement.doScroll("left");
		                    }
		                    catch (error) 
		                    {
		                        setTimeout(arguments.callee, 0);
		                        return;
		                    }
		                    
	                    // and execute any waiting functions
	                    registerAllObjects();
	                })();
		        }
			}
		}
		
		/* EXTRA FUNCTIONS */
		_bmvc.map = function(list, fn)
		{
			var result = [];
			for (var i = 0, ii = list.length; i < ii; i++)
			{
				result.push(fn(list[i]));
			}
			return result;
		}

		_bmvc.forEach = function(list, fn)
		{
			var result = [];
			for (var i = 0, ii = list.length; i < ii; i++)
			{
				var itemResult = fn(list[i], i);
				if (itemResult)
				{
					result.push(itemResult);
				}
			}
			return result;
		}

		_bmvc.forEachDelay = function(list, fn, time, orgLength)
		{
			var orgLength = orgLength != null ? orgLength : list.length;
			var self = this;
			var index = orgLength - list.length;
			var item = list.shift();
			fn(item, index);
			if (list.length > 0)
			{
				setTimeout(
					function()
					{
						self.forEachDelay(list, fn, time, orgLength);
					}, time
				);
			}
		}
		
		init();
		
		return _bmvc;
		
	})();

	// make the global connection
	window._bmvc = _bmvc;







//console.log(_bmvc.objects);
	
})(window);


