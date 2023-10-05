import React, { useEffect, useState } from 'react';
import { ACTIONS, COLORS, STYLES } from '../../shared/constants';
import './authenticated-menu.css';
// components
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
// icons
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';

const AuthenticatedMenu: React.FC<{}> = () => {
  useEffect(() => {
    chrome.storage.sync.get(['streaming'], (results) => {
      if (results.streaming) setStarted(true);
      setStreaming(results.streaming);
    });
    chrome.runtime.onMessage.addListener((msg) => {
      const { STREAMING_STATE_UPDATED, TOP_FIVE_UPDATED } = ACTIONS;
      if (msg.action === STREAMING_STATE_UPDATED) setStreaming(msg.streaming);
      if (msg.action === TOP_FIVE_UPDATED) setTopFive(msg.topFiveExpressions);
    });
  }, []);

  const [started, setStarted] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [topFive, setTopFive] = useState([]);

  const toggleStreamingState = () => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => {
      if (!started && !streaming) setStarted(true);
      const action = !streaming ? ACTIONS.CONNECT : ACTIONS.DISCONNECT;
      chrome.tabs.sendMessage(tab.id, { action, removeOverlay: false });
    });
  };

  return !started && !streaming ? (
    <div className='start-streaming-btn-container'>
      <Typography sx={{ textAlign: 'center' }} variant='body1' gutterBottom>
        Click "Start" to begin performing inference on this webpage's video for
        the top five captured emotional expressions using Hume's streaming API!
      </Typography>
      <Button
        size='large'
        variant='outlined'
        aria-label='Start streaming'
        sx={STYLES.customCTABtnStyles}
        onClick={toggleStreamingState}
      >
        Start
      </Button>
      <Link
        sx={{ color: '#353535' }}
        href='https://hume.ai/products/facial-expression-model'
        target='_blank'
        aria-label='Go to developer documentation'
      >
        Learn more
      </Link>
    </div>
  ) : (
    <>
      <div className='card-header'>
        <Typography variant='body1'>Top 5 Expressions</Typography>
        <IconButton
          sx={STYLES.stopStreamBtnStyles}
          aria-label={streaming ? 'stop streaming' : 'start streaming'}
          onClick={toggleStreamingState}
        >
          {streaming ? (
            <PauseCircleIcon fontSize='large' />
          ) : (
            <PlayCircleIcon fontSize='large' />
          )}
        </IconButton>
      </div>

      {topFive.length ? (
        topFive.map(({ name, score }, i) => {
          return (
            <div className='score-container'>
              <Typography variant='body2'>{i + 1}</Typography>
              <div
                className='expression-color-tile'
                style={{ backgroundColor: COLORS[name] }}
              ></div>
              <Typography sx={{ width: '144px' }} variant='body2'>
                {name}
              </Typography>
              <Typography variant='body2'>
                {(Math.round(100 * score) / 100).toFixed(2)}
              </Typography>
            </div>
          );
        })
      ) : (
        <div className='no-face-detected-msg-container'>
          <Typography variant='body1'>No face detected...</Typography>
        </div>
      )}
    </>
  );
};

export default AuthenticatedMenu;
