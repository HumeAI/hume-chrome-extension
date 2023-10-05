import React from 'react';
import { STYLES } from '../../shared/constants';
import './unauthenticated-menu.css';
// components
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const UnauthenticatedMenu: React.FC<{}> = () => {
  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className='unauthenticated-menu'>
      <Typography sx={{ textAlign: 'center' }} variant='body1' gutterBottom>
        Please set your API key in the options page to begin.
      </Typography>
      <Button
        sx={STYLES.customCTABtnStyles}
        size='large'
        variant='outlined'
        aria-label='Open options page to set API key'
        onClick={openOptionsPage}
      >
        Set API key
      </Button>
    </div>
  );
};

export default UnauthenticatedMenu;
