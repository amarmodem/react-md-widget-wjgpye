import React, { Component } from 'react';
import { render } from 'react-dom';

import MDWidget from './MDWidget';
import ReadMe from './ReadMe';
import './style.css';

class App extends Component {
  constructor() {
    super();
    this.state = {
      name: 'React'
    };
  }

  render() {
    return (
      <div className="container mt-3">
        <div className="alert alert-info">
          NOTE: You should expect to see an error, since the widgetUrl is fake.
        </div>
        <MDWidget />
        <hr />
        <ReadMe />
      </div>
    );
  }
}

render(<App />, document.getElementById('root'));
