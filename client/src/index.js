import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import '@aws-amplify/ui-react/styles.css';

import App from './App';
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';
import { Authenticator } from '@aws-amplify/ui-react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL;

Amplify.configure(awsExports);

// create the root and render the wrapped App
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
    <Authenticator loginMechanisms={['email']} signUpAttributes={['email']}>
      <App />
    </Authenticator>
    </BrowserRouter>
  </React.StrictMode>
);
