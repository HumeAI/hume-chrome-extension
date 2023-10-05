import React, { MouseEvent, useEffect, useState } from 'react';
import { render } from 'react-dom';
import { STYLES } from '../shared/constants';
import './options.css';
// components
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import GetAPIKeyLink from './components/get-api-key-link';
import { HumeLogoLink } from '../shared/components';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Snackbar from '@mui/material/Snackbar';
// icons
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const Options: React.FC<{}> = () => {
  useEffect(() => {
    chrome.storage.sync.get(['apiKey']).then((result) => {
      const initialInputValue = result.apiKey ? result.apiKey : '';
      setApiKey(initialInputValue);
      setLoading(false);
    });
  }, []);

  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [snackBarOpen, setSnackBarOpen] = useState(false);

  const updateApiKey = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    chrome.storage.sync.set({ apiKey });
    setSnackBarOpen(true);
  };

  const onShowApiKeyClick = () => {
    setShowApiKey((show) => !show);
  };

  if (loading) return null;

  return (
    <div className='options-content'>
      <HumeLogoLink />
      <FormControl
        sx={{ m: 3, width: '420px' }}
        size='small'
        variant='outlined'
      >
        <InputLabel htmlFor='APIKey'>Your API Key</InputLabel>
        <OutlinedInput
          id='APIKey'
          type={showApiKey ? 'text' : 'password'}
          label='Your API Key'
          value={apiKey || null}
          onChange={(e) => setApiKey(e.target.value)}
          endAdornment={
            <InputAdornment position='end'>
              <IconButton
                aria-label='Toggle API Key visibility'
                onClick={onShowApiKeyClick}
                edge='end'
              >
                {showApiKey ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          }
        />
      </FormControl>
      <div className='options-footer-container'>
        <GetAPIKeyLink />
        <Button
          variant='outlined'
          sx={STYLES.customeSubmitBtnStyles}
          aria-label='Set API key'
          onClick={updateApiKey}
        >
          Submit
        </Button>
      </div>
      <Snackbar
        autoHideDuration={2000}
        message='API Key Set!'
        open={snackBarOpen}
        onClose={() => setSnackBarOpen(false)}
      />
    </div>
  );
};

const root = document.createElement('div');
root.setAttribute('class', 'options-container');
document.body.appendChild(root);
render(<Options />, root);
