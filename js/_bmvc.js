/**
 *
 * _bmvc 3.1
 * 
 * A new version of basic mvc. 
 *  
 */
 
(function(){

var undefined;

// check if the container is the browser or node
var isBrowser = (typeof global == "undefined") && (typeof require == "undefined"); // not the best test but ok now. global and require exists in node so we use it
var container = isBrowser ? window : global;
 
var _bmvc = 
	
	(function(){
		
		// create a local reference;
		var _bmvc = new (function(){ this.name = "_bmvc"; })();
		
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
		
		// show log if the location exists we check for the querystring 'log'
		if (container["location"])
		{
			_bmvc.showLog = location.search.indexOf("log") != -1;
		}
		
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
		// we can register a string or an event class
		_bmvc.addListener = function(event, handler, listeningObject)
		{
			var name = typeof event == 'string' ? event: getInstanceName(event);
			if (!referenceToEventListeners[name])
			{
				referenceToEventListeners[name] = [];
			}
			
			referenceToEventListeners[name].push({handler: handler, listeningObject: listeningObject});
			
			return referenceToEventListeners;
		}
		
		// add global listeners
		_bmvc.addGlobalListeners = function(listener)
		{
			globalListeners.push(listener);
		}
		
		_bmvc.removeListener = function(event, handler, listeningObject)
		{
			
			var name = typeof event == 'string' ? event: getInstanceName(event);
				
			if (!referenceToEventListeners[name])
			{
				referenceToEventListeners[name] = [];
			}
			
			var listeners = referenceToEventListeners[name];
			
			var newListeners = []; //listeners.slice(0);
			for(var i = 0, ii = listeners.length; i < ii; i++)
			{
				if (listeningObject != listeners[i].listeningObject)
				{
					newListeners.push(listeners[i]);
				}
			}
			referenceToEventListeners[name] = newListeners;
			
			return referenceToEventListeners[name];
		}
		
		
		
		
		
		function getInternalName(name, type)
		{
			var createdName = "";
			
			// if the instance doesnt have a name, we need it to register a name
			if (!name)
			{
				createdName = "_internal_name_" + Math.random().toString().replace(".", "") + "." + type;
			}
			else
			{
				createdName = name;
			}
			
			return createdName;
		}
		
	
		_bmvc.getExposedInstance = function(classRef)
		{
			
			// begin to change the class
			var classAsString = classRef.toString();
			
			// to expose the private functions, we create a new function that goes trough the functions string
			// we could have done all string parsing in this class and only assosiate the functions directly with string manipulation here and not inside the new class,
			// but then we would have to expose the functions as strign in the code, which could lead to problems in the eval since string muight have semikolons, linebreaks etc
			var funcString = "";
			funcString += "new (" + classAsString.substring(0, classAsString.length - 1);
			funcString += ";";
			funcString += "this._privates = {};\n";
			funcString += "this._initPrivates = function(f)";
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
			funcString += "\n\n})()";
			
			var instance = eval(funcString);
			instance._initPrivates(classAsString);
			
			// delete the initiation functions
			delete instance._initPrivates;

			return instance;
		}
		
		
		// method for registring new functions
		_bmvc.register = function(classRef, name, type)
		{
	
			// add a new method to create singletons		
			classRef.getInstance = getInstance;

			var instance = null;
	
			// this is done to expose private functions
			// we create a new function inside the class trough some string manipulation, the we replace the original class with our new class with eval
			if (_bmvc.unitTestMode)
			{
				// get an instance that exposes the provate funcions
				instance = _bmvc.getExposedInstance(classRef);
				
				//make sure it has the same functions as the rest
				instance.sendEvent = sendEventForObjects;
			}
			else
			{
				// add the send event method		
				classRef.prototype.sendEvent = sendEventForObjects;
				
				// create a new instance
				instance = classRef.getInstance();
			}
			
			
			
			// get the internal name
			instance.name = getInternalName(name, type);
			
			
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
				var eventName = typeof event == 'string' ? event : event.name;	
				if(_bmvc.showLog)
				{
					sender = sender ? sender : {name: "_root"};
					console.info("BasicMVC EVENT (sent from '" + sender.name + "'): " + eventName + " - ", event);
				}
				
				// get all listeners
				var listeners =  referenceToEventListeners[eventName];
				
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
					console.log("Nr of listeners for event '" + eventName + "'", listeners.length)
					for(var i = 0, ii = listeners.length; i < ii; i++)
					{
						var listeningObject = listeners[i].listeningObject;
						if(typeof event == 'string'){
							 listeners[i].handler.apply(this, Array.prototype.slice.call(arguments, 1));
							//listeners[i].handler.call(listeningObject, arguments.slice(1));
						}
						else{
							listeners[i].handler.call(listeningObject, event);
						}
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
		
		// creates events easely
		_bmvc.defineEvent = function(eventName, args, properties)
		{
			var nsName = eventName.substring(0, eventName.lastIndexOf("."));
			var eventLastName = eventName.replace(nsName, "").replace(".", "")

			var ns = _bmvc.addNamespace(nsName);
			
			ns[eventLastName] = function()
			{
				this.name = eventName;
				for(var i = 0, ii = args.length; i < ii; i++)
				{
					if (arguments[i])
					{
						this[args[i]] = arguments[i];					
					}
					else
					{
						this[args[i]] = null;
					}
				}
			}

			ns[eventLastName].prototype = properties;
		}
		 
		// method to add namespaces
		_bmvc.addNamespace = function(namespaceString)
		{
			var nameStringParts = namespaceString.split(".");
			var currentNamespace = container;
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
			
			// only init like this if we are in the browser. in node, we just register the objects
			if (isBrowser)
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
			            if (document.documentElement.doScroll && container == container.top)
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
			else
			{
				registerAllObjects();
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
		
		if (isBrowser)
		{
			init();
		}
		else
		{
			_bmvc.init = init;
		}
		
		return _bmvc;
		
	})();

	// make the global connection
	container._bmvc = _bmvc;


})();


