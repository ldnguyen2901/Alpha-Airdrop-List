import React from 'react';

const Card = React.memo(function Card({ children, className = "" }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-4 border dark:border-gray-700 shadow-sm transition-all duration-300 ease-in-out ${className}`}>
      {children}
    </div>
  );
});

export default Card;
