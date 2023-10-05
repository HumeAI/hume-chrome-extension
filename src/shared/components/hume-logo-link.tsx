import React from 'react';
import './hume-logo-link.css';
// components
import Link from '@mui/material/Link';

const HumeLogoLink: React.FC<{}> = () => {
  return (
    <Link
      href='https://beta.hume.ai/'
      target='_blank'
      aria-label='Go to Hume Developer Portal'
    >
      <img className='hume-logo' src='Logo-Hume.svg' alt='Hume AI Logo' />
    </Link>
  );
};

export default HumeLogoLink;
