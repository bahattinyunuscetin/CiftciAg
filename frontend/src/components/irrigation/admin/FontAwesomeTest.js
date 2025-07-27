import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons';

const FontAwesomeTest = () => {
  return (
    <div>
      <h1>FontAwesome Test</h1>
      <FontAwesomeIcon icon={faHome} size="3x" />
      <p>If you can see the home icon above, FontAwesome is working!</p>
    </div>
  );
};

export default FontAwesomeTest; 