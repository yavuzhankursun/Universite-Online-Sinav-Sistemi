import React, { useState, useEffect } from 'react';

function Timer({ durationMinutes, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60); // saniye cinsinden

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onTimeUp) {
        onTimeUp();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (onTimeUp) {
            onTimeUp();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft < 60; // Son 1 dakika

  return React.createElement('div', {
    className: `timer ${isWarning ? 'warning' : ''}`
  },
    React.createElement('span', null, `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
  );
}

export default Timer;

