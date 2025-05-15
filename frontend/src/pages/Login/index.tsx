import { ReactComponent as GoogleIcon } from "./Google.svg";
import style from "./index.module.scss";
import listeninklogo from "./listenink-logo.png";

const google = () => {
  // Use full backend URL in development. I'm sure there is a less kludgy way to do this, but the dev proxy is determined to mess with us
  const backendUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8080' 
    : '';
  window.location.href = `${backendUrl}/api/v1/auth/google`;
};

export function Login() {
  return (
    <div className={style.container}> 
      <div className={style.loginBox}>
        <img src={listeninklogo} className={style.logo} />
        <div className={`${style.loginButton} ${style.google}`} onClick={google}>
          <GoogleIcon className={style.icon} />
          Sign in with Google
	</div>
      </div>
    </div>
  );
}
