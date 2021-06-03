(function () {
  var global = this;
  var iframeCount = 0;

  /**
    Listen to events

    @method MoneyDesktopAddEventListener
    @param {Object} The element to bind the event to
    @param {String} The event name
    @param {Method} The method to call when the event is fired
    @param {Object} The scope to bind to the callback method
  **/
  var MoneyDesktopAddEventListener = function (element, eventName, eventHandler, scope) {
    if (element) {
      var handler = function () {
        eventHandler.apply(scope || global, arguments);
      };
      if (document.addEventListener) {
        element.addEventListener(eventName, handler, false);
      } else {
        element.attachEvent('on' + eventName, handler);
      }
    }
  };

  /**
    Merge two objects

    @method MoneyDesktopObjectMerge
    @param {Object} The base object
    @param {Object} The object to merge in
  **/
  var MoneyDesktopObjectMerge = function (baseObject, mergeObject) {
    for (var name in mergeObject) {
      try {
        if ( mergeObject[name].constructor==Object ) {
          baseObject[name] = MoneyDesktopObjectMerge(baseObject[name], mergeObject[name]);
        } else {
          baseObject[p] = mergeObject[p];
        }
      } catch (e) {
        baseObject[name] = mergeObject[name];
      }
    }
    return baseObject;
  }

  /**
    Used for embedding widgets with dynamically generated iframes.

    @class MoneyDesktopWidgetLoader
    @param {Object} loader options: autoload, className
  **/
  var MoneyDesktopWidgetLoader = function (options) {
    this.setup(options);
    this.attach();
  };

  /**
    Setup the widget loader options

    @class MoneyDesktopWidgetLoader.setup
    @param {Object} options: autoload, className
  **/
  MoneyDesktopWidgetLoader.prototype.setup = function setup (options) {
    var options = options || {};

    this.options = MoneyDesktopObjectMerge({
      autoload: true,
      className: 'md-widget'
    }, options);
  };

  /**
    Setup the event listeners for the widget loader

    @class MoneyDesktopWidgetLoader.attach
  **/
  MoneyDesktopWidgetLoader.prototype.attach = function attach () {
    MoneyDesktopAddEventListener(global, 'load', this.onPageLoad, this);
    MoneyDesktopAddEventListener(global, 'message', this.onPostMessage, this);
  };

  MoneyDesktopWidgetLoader.prototype.onPageLoad = function onPageLoad () {
    if (this.options.autoload) {
      this.load();
    }
  };

  /**
    Kicks off the build and embed of the widget iFrames

    @class MoneyDesktopWidgetLoader.load
  **/
  MoneyDesktopWidgetLoader.prototype.load = function load () {
    var elements = this.getFrameContainers(this.options.className);

    this.setupFramesForElementContainers(elements);
  };

  /**
    Gets all the placeholder elements that we'll use to embed iFrames.

    @class MoneyDesktopWidgetLoader.getFrameContainers
  **/
  MoneyDesktopWidgetLoader.prototype.getFrameContainers = function getFrameContainers () {
    var elements = 'getElementsByClassName' in document ?
        document.getElementsByClassName(this.options.className) :
        document.getElementsByTagName('*');

    return this.cleanseElements(elements);
  };

  /**
    Removes any elements that do not have the specified css class name.
    Removes any elements that do not have a data-url attribute.

    @class MoneyDesktopWidgetLoader.cleanseElements
    @param {Array} DOM elements
    @return {Array} DOM elements
  **/
  MoneyDesktopWidgetLoader.prototype.cleanseElements = function cleanseElements (elements) {
    var foundElements = [];

    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];

      if ((el.className || '').indexOf(this.options.className) >= 0 && el.getAttribute('data-url')) {
        foundElements.push(el);
      }
    }

    return foundElements;
  }

  /**
    Creates the data associated with each iFrame, then stores it in this.createdFramesDetails.

    @class MoneyDesktopWidgetLoader.setupFramesForElementContainers
    @param {Array} An array of DOM elements
  **/
  MoneyDesktopWidgetLoader.prototype.setupFramesForElementContainers = function setupFramesForElementContainers (elements) {
    this.createdFramesDetails = {};

    for (var i = 0; i < elements.length; i++) {
      var element = elements[i],
          frame = this.createFrameFromFrameContainer(element);
          options = element.getAttribute('data-options') ? JSON.parse(element.getAttribute('data-options')) : {},
          url = element.getAttribute('data-url'),
          id = this.getNextUniqueId();

      this.createdFramesDetails[id] = {
        frame: frame,
        loaded: false,
        options: options,
        container: element,
        url: url
      };
    }
  };

  /**
    Creates and appends the iFrame DOM element to the passed in placeholder element.
    Clears out the placeholder element's innerHTML, which acts as a loading screen.
    Adds "load" event listener to the iFrame element.

    @class MoneyDesktopWidgetLoader.createFrameFromFrameContainer
    @param {Object} placeholder DOM element
    @return {Object} iFrame DOM element
  **/
  MoneyDesktopWidgetLoader.prototype.createFrameFromFrameContainer = function createFrameFromFrameContainer (element) {
    var url = element.getAttribute('data-url'),
        width = element.getAttribute('data-width') || '100%',
        height = element.getAttribute('data-height') || '600',
        iframe = document.createElement('iframe');

    iframe.setAttribute('width', width);
    iframe.setAttribute('height', height);
    iframe.setAttribute('border', '0');
    iframe.setAttribute('frame', '0');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowTransparency', 'true');
    iframe.setAttribute('src', url);
    iframe.setAttribute('marginheight' , '0');
    iframe.setAttribute('marginwidth' , '0');
    iframe.setAttribute('data-moneydesktop-id', this.getNextUniqueId());

    element.innerHTML = '';
    element.appendChild(iframe);

    MoneyDesktopAddEventListener(iframe, 'load', function () {
      element.className += ' md-widget-loaded';
      element.setAttribute('data-loaded', 'true');
    }, this);

    return iframe;
  };

  /**
    Builds the iFrame id based on the iframeCount variable, then increments the counter.

    @class MoneyDesktopWidgetLoader.getNextUniqueId
    @return {String} iFrame id
  **/
  MoneyDesktopWidgetLoader.prototype.getNextUniqueId = function getNextUniqueId () {
    var uid = "MoneyDesktop-" + iframeCount.toFixed(0);
    iframeCount++;

    return uid;
  };

  /**
    Callback for any postMessages on the global element.

    @class MoneyDesktopWidgetLoader.onPostMessage
    @return {Object} Event data
  **/
  MoneyDesktopWidgetLoader.prototype.onPostMessage = function (evt) {
    if (global.JSON) {
      var data = JSON.parse(evt.data),
          frameDetails = this.getFrameDetailsForWindow(evt.source);

      if (data && data.moneyDesktop && data.type == 'load' && frameDetails && frameDetails.frame) {
        frameDetails.loaded = true;
        this.postMessageToFrame(frameDetails, {type: 'configure', options: frameDetails.options});
      }
    }
  };

  /**
    Gets the iFrame details for a specified window.

    @class MoneyDesktopWidgetLoader.getFrameDetailsForWindow
    @param {Object} DOM Window object
    @return {Object} iFrame details
  **/
  MoneyDesktopWidgetLoader.prototype.getFrameDetailsForWindow = function getFrameDetailsForWindow (aWindow) {
    var key,
        details;

    for (key in this.createdFramesDetails) if (this.createdFramesDetails.hasOwnProperty(key)) {
      if (this.createdFramesDetails[key].frame && this.createdFramesDetails[key].frame.contentWindow == aWindow) {
        return this.createdFramesDetails[key];
      }
    }

    return false;
  };

  /**
    Sends a postMessage to a specified iFrame.

    @class MoneyDesktopWidgetLoader.postMessageToFrame
    @param {Object} iFrame details
    @param {Object} Data to send with postMessage
  **/
  MoneyDesktopWidgetLoader.prototype.postMessageToFrame = function postMessageToFrame (frameDetails, data) {
    if (global.JSON) {
      var iframe = frameDetails.frame,
          url = frameDetails.url;

      if (!url || url.substr(0, 4).toLowerCase() != 'http') {
        url = '*';
      }

      if (iframe && iframe.contentWindow && iframe.contentWindow.postMessage) {
        iframe.contentWindow.postMessage(JSON.stringify(data), url.replace( /([^:]+:\/\/[^\/]+).*/, '$1'));
      }
    }
  };

  /**
    Send a postMessage to every widget iFrame

    @class MoneyDesktopWidgetLoader.sendPostMessage
    @param {Object} Data to send with postMessage
  **/
  MoneyDesktopWidgetLoader.prototype.sendPostMessage = function sendPostMessage (data) {
    var key,
        frameDetails;

    for (key in this.createdFramesDetails) if (this.createdFramesDetails.hasOwnProperty(key)) {
      frameDetails = this.createdFramesDetails[key];
      this.postMessageToFrame(frameDetails, data);
    }
  };

  /**
    Sends a postMessage with type "logout", to the widget iFrame.

    @class MoneyDesktopWidgetLoader.logout
  **/
  MoneyDesktopWidgetLoader.prototype.logout = function logout () {
    this.sendPostMessage({type: 'logout'});
  };

  /**
    Sends a postMessage with type "ping", to the widget iFrame.

    @class MoneyDesktopWidgetLoader.ping
  **/
  MoneyDesktopWidgetLoader.prototype.ping = function ping () {
    this.sendPostMessage({type: 'ping'});
  };

  //expose class to window so client can instantiate it
  global.MoneyDesktopWidgetLoader = MoneyDesktopWidgetLoader;

}).call(this);

