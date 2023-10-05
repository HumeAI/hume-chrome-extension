import React, { useEffect, useState } from 'react';
import { render } from 'react-dom';
import { STYLES } from '../shared/constants';
import './popup.css';
// components
import AuthenticatedMenu from './components/authenticated-menu';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import { HumeLogoLink } from '../shared/components';
import UnauthenticatedMenu from './components/unauthenticated-menu';

const Popup: React.FC<{}> = () => {
  useEffect(() => {
    // opens port to enable listening for when Popup is closed (see background.js script)
    chrome.runtime.connect({ name: 'popup' });
    chrome.storage.sync.get(['apiKey'], ({ apiKey }) => {
      setAuthenticated(!!apiKey);
    });
  }, []);

  const [authenticated, setAuthenticated] = useState(false);

  return (
    <Card sx={STYLES.cardStyles}>
      <CardContent sx={STYLES.cardContentStyles}>
        <HumeLogoLink />
        <Divider sx={{ marginTop: '12px' }} />
        {!authenticated ? <UnauthenticatedMenu /> : <AuthenticatedMenu />}
      </CardContent>
    </Card>
  );
};

const root = document.createElement('div');
root.setAttribute('class', 'popup-container');
document.body.appendChild(root);
render(<Popup />, root);
