import React from 'react';
import Markdown from 'react-markdown';

import source from './README.md';

export default () => <div className="col-12"><Markdown source={source} /></div>;