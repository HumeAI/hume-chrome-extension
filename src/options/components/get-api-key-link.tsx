import React from 'react';
// components
import Link from '@mui/material/Link';

const GetAPIKeyLink: React.FC<{}> = () => {
  return (
    <Link
      sx={{ color: '#353535' }}
      href='https://beta.hume.ai/sign-up'
      target='_blank'
      aria-label='Go to Hume Sign up page'
    >
      Get an API key
    </Link>
  );
};

export default GetAPIKeyLink;
