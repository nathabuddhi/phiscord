import React, { useEffect } from 'react';
import { auth } from '@/components/firebase';

const guestMiddleware = (WrappedComponent) => {
  return (props) => {
    useEffect(() => {
      const checkUser = () => {
        auth.onAuthStateChanged((user) => {
          if (user) {
            setTimeout(() => {
              window.location.href = '/home';
            }, 3000);
          }
        });
      };

      checkUser();
    }, []);

    return <WrappedComponent {...props} />;
  };
};

export default guestMiddleware;
