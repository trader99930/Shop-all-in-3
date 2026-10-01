import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

import { User } from '../types/index.ts';

import {
  auth,
  googleAuthProvider,
} from '../lib/firebase.ts';

import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getIdToken,
} from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;

  loginWithGoogle: () => Promise<void>;

  loginWithIdentifier: (
    identifier: string,
    password?: string,
    intendedRole?: 'shopkeeper' | 'customer'
  ) => Promise<{
    success: boolean;
    user?: User;
    error?: string;
    accountRole?: 'customer' | 'shopkeeper' | 'super_admin';
  }>;

  registerCustomer: (
    name: string,
    phone: string,
    email: string,
    password?: string
  ) => Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }>;

  switchUser: (roleOrEmail: string) => Promise<void>;

  logout: () => Promise<void>;

  refreshSession: () => Promise<void>;

  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [idToken, setIdToken] =
    useState<string | null>(null);

  /*
   * ----------------------------------------------------
   * AUTH HEADERS
   * ----------------------------------------------------
   */

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const activeToken =
      idToken ||
      localStorage.getItem('yunay_session_token');

    if (activeToken) {
      headers['Authorization'] =
        `Bearer ${activeToken}`;
    }

    const effectiveUid =
      currentUser?.uid ||
      localStorage.getItem('yunay_active_uid');

    if (effectiveUid) {
      headers['x-yunay-uid'] =
        effectiveUid;
    }

    return headers;
  };

  /*
   * ----------------------------------------------------
   * LOAD USER PROFILE FROM BACKEND
   * ----------------------------------------------------
   */

  const loadCurrentUser = async (
    token?: string
  ): Promise<User | null> => {
    try {
      const activeToken =
        token ||
        idToken ||
        localStorage.getItem(
          'yunay_session_token'
        );

      if (!activeToken) {
        setCurrentUser(null);
        return null;
      }

      const headers: Record<string, string> = {
        Authorization:
          `Bearer ${activeToken}`,
      };

      const storedUid =
        localStorage.getItem(
          'yunay_active_uid'
        );

      if (storedUid) {
        headers['x-yunay-uid'] =
          storedUid;
      }

      const res = await fetch(
        '/api/auth/me',
        {
          method: 'GET',
          headers,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
          'Unable to load user profile'
        );
      }

      if (data?.user) {
        setCurrentUser(data.user);

        if (data.user.uid) {
          localStorage.setItem(
            'yunay_active_uid',
            data.user.uid
          );
        }

        return data.user;
      }

      setCurrentUser(null);
      return null;
    } catch (error) {
      console.error(
        'Failed to load current user:',
        error
      );

      setCurrentUser(null);
      return null;
    }
  };

  /*
   * ----------------------------------------------------
   * REFRESH SESSION
   * ----------------------------------------------------
   */

  const refreshSession = async () => {
    try {
      const firebaseUser =
        auth.currentUser;

      /*
       * Firebase is the primary source
       * of authentication.
       */

      if (firebaseUser) {
        const token =
          await getIdToken(
            firebaseUser,
            true
          );

        setIdToken(token);

        localStorage.setItem(
          'yunay_session_token',
          token
        );

        localStorage.setItem(
          'yunay_active_uid',
          firebaseUser.uid
        );

        await loadCurrentUser(token);

        return;
      }

      /*
       * Fallback for an existing server
       * session if one is still valid.
       */

      const storedToken =
        localStorage.getItem(
          'yunay_session_token'
        );

      if (storedToken) {
        setIdToken(storedToken);

        await loadCurrentUser(
          storedToken
        );

        return;
      }

      setCurrentUser(null);
    } catch (error) {
      console.error(
        'Failed to refresh session:',
        error
      );

      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  /*
   * ----------------------------------------------------
   * EMAIL + PASSWORD LOGIN
   * ----------------------------------------------------
   */

  const loginWithIdentifier = async (
    identifier: string,
    password?: string,
    intendedRole?: 'shopkeeper' | 'customer'
  ): Promise<{
    success: boolean;
    user?: User;
    error?: string;
    accountRole?: 'customer' | 'shopkeeper' | 'super_admin';
  }> => {
    setLoading(true);

    try {
      const cleanIdentifier =
        identifier.trim();

      if (!cleanIdentifier) {
        return {
          success: false,
          error:
            'Please enter your mobile number or email address.',
        };
      }

      if (!password) {
        return {
          success: false,
          error:
            'Please enter your password.',
        };
      }

      /*
       * ------------------------------------------------
       * FIREBASE EMAIL LOGIN
       * ------------------------------------------------
       */

      if (cleanIdentifier.includes('@')) {
        try {
          const credential =
            await signInWithEmailAndPassword(
              auth,
              cleanIdentifier,
              password
            );

          const firebaseUser =
            credential.user;

          const token =
            await getIdToken(
              firebaseUser,
              true
            );

          setIdToken(token);

          localStorage.setItem(
            'yunay_session_token',
            token
          );

          localStorage.setItem(
            'yunay_active_uid',
            firebaseUser.uid
          );

          const res = await fetch(
            '/api/auth/me',
            {
              method: 'GET',
              headers: {
                Authorization:
                  `Bearer ${token}`,
                'x-yunay-uid':
                  firebaseUser.uid,
              },
            }
          );

          const data =
            await res.json();

          if (res.ok && data?.user) {
            // Role enforcement: if intended role doesn't match
            if (intendedRole === 'shopkeeper' && data.user.role === 'customer') {
              return {
                success: false,
                error: 'This account is registered as a Customer. Please choose "Customer Sign In" to access your account.',
              };
            }
            if (intendedRole === 'customer' && data.user.role === 'shopkeeper') {
              return {
                success: false,
                error: 'This account is registered as a Shop Owner. Please choose "Shop Owner Sign In" to access your store.',
              };
            }

            setCurrentUser(
              data.user
            );

            localStorage.setItem(
              'yunay_active_uid',
              data.user.uid
            );

            return {
              success: true,
              user: data.user,
            };
          }
        } catch (fbErr: any) {
          console.warn('Firebase email auth fallback to database:', fbErr?.code || fbErr?.message);
        }
      }

      /*
       * ------------------------------------------------
       * DATABASE AUTHENTICATION (Mobile / Email / Admin)
       * ------------------------------------------------
       *
       * Supports Email, Phone, and Admin ID with Password.
       */

      const res = await fetch(
        '/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            identifier:
              cleanIdentifier,
            password,
            intendedRole,
            role: intendedRole,
          }),
        }
      );

      const data =
        await res.json();

      if (
        res.ok &&
        data?.user
      ) {
        if (data.token) {
          setIdToken(
            data.token
          );

          localStorage.setItem(
            'yunay_session_token',
            data.token
          );
        }

        setCurrentUser(
          data.user
        );

        localStorage.setItem(
          'yunay_active_uid',
          data.user.uid
        );

        return {
          success: true,
          user: data.user,
        };
      }

      return {
        success: false,
        error:
          data?.error ||
          'Login failed',
        accountRole: data?.accountRole,
      };
    } catch (error: any) {
      console.error(
        'Login error:',
        error
      );

      /*
       * Firebase gives useful errors such as:
       * auth/invalid-credential
       * auth/user-not-found
       * auth/wrong-password
       * auth/invalid-email
       */

      let message =
        error?.message ||
        'Login failed';

      switch (
        error?.code
      ) {
        case 'auth/invalid-credential':
          message =
            'Email or password is incorrect.';
          break;

        case 'auth/user-not-found':
          message =
            'No Firebase account exists with this email.';
          break;

        case 'auth/wrong-password':
          message =
            'Incorrect password.';
          break;

        case 'auth/invalid-email':
          message =
            'Please enter a valid email address.';
          break;

        case 'auth/user-disabled':
          message =
            'This Firebase account has been disabled.';
          break;

        case 'auth/too-many-requests':
          message =
            'Too many login attempts. Please try again later.';
          break;
      }

      return {
        success: false,
        error: message,
      };
    } finally {
      setLoading(false);
    }
  };

  /*
   * ----------------------------------------------------
   * CUSTOMER REGISTRATION
   * ----------------------------------------------------
   *
   * Existing registration API is intentionally kept.
   * We are not changing the rest of the application.
   */

  const registerCustomer = async (
    name: string,
    phone: string,
    email: string,
    password?: string
  ): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> => {
    setLoading(true);

    try {
      const res = await fetch(
        '/api/auth/register-customer',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            name,
            phone,
            email,
            password,
          }),
        }
      );

      const data =
        await res.json();

      if (
        res.ok &&
        data?.user
      ) {
        if (data.token) {
          setIdToken(
            data.token
          );

          localStorage.setItem(
            'yunay_session_token',
            data.token
          );
        }

        setCurrentUser(
          data.user
        );

        localStorage.setItem(
          'yunay_active_uid',
          data.user.uid
        );

        return {
          success: true,
          user: data.user,
        };
      }

      return {
        success: false,
        error:
          data?.error ||
          'Registration failed',
      };
    } catch (error: any) {
      console.error(
        'Registration error:',
        error
      );

      return {
        success: false,
        error:
          error?.message ||
          'Network error',
      };
    } finally {
      setLoading(false);
    }
  };

  /*
   * ----------------------------------------------------
   * DEMO / USER SWITCH
   * ----------------------------------------------------
   *
   * Existing functionality retained.
   */

  const switchUser = async (
    roleOrEmail: string
  ) => {
    setLoading(true);

    try {
      let body: any = {};

      if (
        roleOrEmail.includes('@')
      ) {
        body = {
          email: roleOrEmail,
        };
      } else if (
        [
          'super_admin',
          'shopkeeper',
          'customer',
        ].includes(roleOrEmail)
      ) {
        body = {
          role: roleOrEmail,
        };
      } else {
        body = {
          uid: roleOrEmail,
          email: roleOrEmail,
        };
      }

      const res = await fetch(
        '/api/auth/demo-switch',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(
            body
          ),
        }
      );

      const data =
        await res.json();

      if (data?.user) {
        if (data.token) {
          setIdToken(
            data.token
          );

          localStorage.setItem(
            'yunay_session_token',
            data.token
          );
        }

        setCurrentUser(
          data.user
        );

        localStorage.setItem(
          'yunay_active_uid',
          data.user.uid
        );
      }
    } catch (error) {
      console.error(
        'Error switching user:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ----------------------------------------------------
   * GOOGLE LOGIN
   * ----------------------------------------------------
   */

  const loginWithGoogle =
    async () => {
      setLoading(true);

      try {
        const credential =
          await signInWithPopup(
            auth,
            googleAuthProvider
          );

        const firebaseUser =
          credential.user;

        const token =
          await getIdToken(
            firebaseUser,
            true
          );

        setIdToken(token);

        localStorage.setItem(
          'yunay_session_token',
          token
        );

        localStorage.setItem(
          'yunay_active_uid',
          firebaseUser.uid
        );

        const res =
          await fetch(
            '/api/auth/me',
            {
              method: 'GET',
              headers: {
                Authorization:
                  `Bearer ${token}`,
                'x-yunay-uid':
                  firebaseUser.uid,
              },
            }
          );

        const data =
          await res.json();

        if (
          !res.ok ||
          !data?.user
        ) {
          throw new Error(
            data?.error ||
            'Unable to load Google user profile.'
          );
        }

        setCurrentUser(
          data.user
        );
      } catch (error: any) {
        console.error(
          'Google Sign-In Error:',
          error
        );

        throw error;
      } finally {
        setLoading(false);
      }
    };

  /*
   * ----------------------------------------------------
   * LOGOUT
   * ----------------------------------------------------
   */

  const logout = async () => {
    try {
      await firebaseSignOut(
        auth
      );
    } catch {
      // Ignore Firebase logout errors
    }

    setIdToken(null);
    setCurrentUser(null);

    localStorage.removeItem(
      'yunay_active_uid'
    );

    localStorage.removeItem(
      'yunay_session_token'
    );
  };

  /*
   * ----------------------------------------------------
   * FIREBASE AUTH STATE LISTENER
   * ----------------------------------------------------
   */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          try {
            if (!firebaseUser) {
              /*
               * Firebase says there is no
               * authenticated user.
               */

              setIdToken(null);
              setCurrentUser(null);

              localStorage.removeItem(
                'yunay_active_uid'
              );

              localStorage.removeItem(
                'yunay_session_token'
              );

              setLoading(false);

              return;
            }

            /*
             * Firebase user exists.
             */

            const token =
              await getIdToken(
                firebaseUser,
                true
              );

            setIdToken(token);

            localStorage.setItem(
              'yunay_session_token',
              token
            );

            localStorage.setItem(
              'yunay_active_uid',
              firebaseUser.uid
            );

            /*
             * Load corresponding YUNAY
             * PostgreSQL profile.
             */

            await loadCurrentUser(
              token
            );
          } catch (error) {
            console.error(
              'Firebase auth state error:',
              error
            );

            setCurrentUser(null);
          } finally {
            setLoading(false);
          }
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /*
   * ----------------------------------------------------
   * PROVIDER
   * ----------------------------------------------------
   */

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        loginWithGoogle,
        loginWithIdentifier,
        registerCustomer,
        switchUser,
        logout,
        refreshSession,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth =
  () => {
    const context =
      useContext(
        AuthContext
      );

    if (!context) {
      throw new Error(
        'useAuth must be used within an AuthProvider'
      );
    }

    return context;
  };