import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import awsExports from './aws-exports';

Amplify.configure(awsExports);

// wrap App with the Cognito authenticator
const AppWithAuth = withAuthenticator(App);

// create the root and render the wrapped App
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppWithAuth />
  </React.StrictMode>
);
