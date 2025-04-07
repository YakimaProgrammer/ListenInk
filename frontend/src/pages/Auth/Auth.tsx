import React, { JSX } from 'react';
import ReactDOM from 'react-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const responseGoogle = (response: any) => {
  console.log(response);
};

export const Auth = (): JSX.Element => {
  return (
    <GoogleOAuthProvider clientId="836845435178-oaeinjfucvl53c46r6c2drc008m08cbn.apps.googleusercontent.com">
      <div>
        <GoogleLogin
          onSuccess={responseGoogle}
          onError={() => console.log('Login Failed')}
        />
      </div>
    </GoogleOAuthProvider>
  );
};
