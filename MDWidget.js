import React, { Component } from 'react';
import PropTypes from 'prop-types';

import mockApi from './mockApi';
import waitFor from './waitFor';

class MDWidget extends Component {
  state = { widgetUrl: '' };

  componentWillMount() {
    window.addEventListener('message', this.onMessage);
  }

  componentDidMount() {
    this.load();
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.onMessage);
    // NOTE: Currently unable to dispose of the MoneyDesktopWidgetLoader
  }

  onMessage = event => {
    // NOTE: The message event is generic, so a lot of events that are not related
    // to MoneyDesktop come through here.  Since the event is used by more than just
    // money desktop the consumer cannot simply JSON.parse the event.data.
    // It would be nice if some of this boilerplate was done for the consumer.
    try {
      const data = JSON.parse(event.data);
      if (data.moneyDesktop) {
        // Now that we've filtered only the money desktop events, let's forward them
        // to the onMoneyDesktopMessage
        this.onMoneyDesktopMessage({ ...event, data });
      }
    } catch (e) {
      // Only interested in moneyDesktop events, just ignore errors
    }
  }

  onMoneyDesktopMessage = event => {
    console.log('moneyDesktop message', event);
  }

  // NOTE: Helper method to determine when the state has finished updating
  updateState = state => new Promise(resolve => this.setState(state, resolve));

  load = async () => {
    try {
      // NOTE: We need two things to complete before we are ready to load the widget:
      // 1) We need to load the MoneyDesktopWidgetLoader script
      // 2) We need to have the wigetUrl from the API
      const [Loader, widgetUrl] = await Promise.all([
        this.getLoader(), 
        this.getWidgetUrl()
      ]);
      // NOTE: Now that we have the Loader and the URL we can load the script.
      // We have to disable autoload because in a SPA the page may have been
      // loaded several minutes ago.
      this.loader = new Loader({ autoload: false });
      this.loader.load();
    } catch(e) {
      // TODO: Handle any errors more gracefully.
      console.error('Uh oh!', e);
    }
  }

  getLoader = async () => {
    // NOTE: In a SPA the MoneyDesktopWidgetLoader script may or may not have been
    // previously loaded.  Since it sits on the global namespace we have to check
    // to see if it already exists.
    if (global.MoneyDesktopWidgetLoader) return global.MoneyDesktopWidgetLoader;

    // NOTE: Nope, doesn't exist.  Now we have to add the script.
    const s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = 'https://widgets.moneydesktop.com/assets/md-widget-v4.js';
    this.instance.appendChild(s);

    // NOTE: Wait for it to finish loading...
    const loader = await waitFor({
      selector: () => global.MoneyDesktopWidgetLoader,
      timeout: 5000,
    });

    return loader;
  }

  getWidgetUrl = async () => {
    // NOTE: We need to call the API in order to fetch the current user's widget URL.
    const { url: widgetUrl } = await mockApi.getWidgetUrl();
    await this.updateState({ widgetUrl });
    return widgetUrl;
  }

  reference = instance => {
    this.instance = instance;
  }

  render() {
    const { widgetUrl } = this.state;
    
    return (
      <div ref={this.reference}>
        <div
          className="md-widget"
          data-url={widgetUrl}
          data-width="100%"
          data-height="100%">
            Loading...
        </div>
      </div>
    );
  }
}

MDWidget.propTypes = {};

MDWidget.defaultProps = {};

export default MDWidget;
