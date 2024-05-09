import { useState } from 'react';
import './App.css';

// ユーザー定義ライブラリの読み込み
import at from './js/AuthMngr';
import jdm from './js/JknDataMngr';
import fb from './js/FirebaseMngr';

// コンポーネントの読み込み
import Auth from './cmp/Auth';
import Header from './cmp/Header';
import GameSettings from './cmp/GameSettings';

function App() {
  const [loginState, setloginState] = useState('');
  at.addOnAuthLoggedIn((user, additionalUserInfo) => {
    console.log('App: onAuthLoggedIn: ' + user.displayName);
    setloginState('LoggedIn');
  });
  at.addOnAuthLoggedOut(() => {
    console.log('App: onAuthLoggedOunt');
    setloginState('LoggedOut');
  });
  at.attachLoginState();

  let ret = null;

  switch(loginState){
    // ログインに成功していた場合、アプリケーションのレンダリングを開始
    case 'LoggedIn':
      jdm.authUser = at.user;
      console.log(jdm.isPlayerAdmin);

      ret = (
        <div>
          <Header />
          <main>
            <GameSettings
              jdm={jdm}
              fb={fb}
            />
          </main>
        </div>
      );
      break;
    // ログアウト・未認証時はログイン処理を実行
    case 'LoggedOut':
      ret = <Auth />
      break;
    default:
      ret = <h3>wating for check login state</h3>
  }

  console.log('App: render...');
  return ret;
}

export default App;
