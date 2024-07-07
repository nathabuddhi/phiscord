import { useState, useEffect } from 'react';
import { auth, db } from '@/components/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Loading from '@/components/loading';

const userMiddleware = (WrappedComponent) => {
  return (props) => {
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      let isMounted = true;
      const getUser = async () => {
        auth.onAuthStateChanged(async (user) => {
          if (!isMounted) return;

          if (user) {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setUserDetails(docSnap.data());
            } else {
              await auth.signOut();
              sessionStorage.setItem('toastMessage', JSON.stringify({
                variant: 'destructive',
                title: 'User data not found!',
                description: 'User data could not be retrieved. Please login again.'
              }));
              window.location.href = '/login';
            }
          } else if (sessionStorage.getItem('logout') != 'true') {
            sessionStorage.setItem('toastMessage', JSON.stringify({
              variant: 'destructive',
              title: 'Not logged in!',
              description: 'You are not logged in. Please login before using PHiscord.'
            }));
            window.location.href = '/login';
          }
          setLoading(false);
        });
      };

      getUser();
      return () => {
        isMounted = false;
      };
    }, []);

    if (loading) {
      return <Loading />;
    }

    return <WrappedComponent userDetails={userDetails} {...props} />;
  };
};

export default userMiddleware;
