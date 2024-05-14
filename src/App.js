import $ from 'jquery';
import { useState, useEffect, useRef } from 'react';
import './App.css';

// ユーザー定義ライブラリの読み込み
import at from './js/AuthMngr';
import jdm from './js/JknDataMngr';
import fb from './js/FirebaseMngr';

// モデルの読込
import MdlAuthUser from './js/mdl/MdlAuthUser';
import MdlPlayer from './js/mdl/MdlPlayer';

// コンポーネントの読み込み
import Auth from './cmp/Auth';
import Header from './cmp/Header';
import GameSettings from './cmp/GameSettings';
import GameSummaryInfo from './cmp/GameSummaryInfo';
import GameMatch from './cmp/GameMatch';
import GameBracket from './cmp/GameBracket';

// モデルの読込
import RegistAuthUser from './cmp/RegistAuthUser';
import MdlBatsuGame from './js/mdl/MdlBatsuGame';
import MdlRound from './js/mdl/MdlRound';
import MdlMatch from './js/mdl/MdlMatch';

function App() {
  // useState / useRef
  // 認証ユーザーをステートとして保持。
  /** @type {[MdlAuthUser, React.Dispatch]} */
  const [mdlAuthUser, setMdlAuthUser] = useState(undefined);
  // ログイン状態、空白(未設定)、LoggedIn、LoggedOutの3値を取る
  const [loginState, setloginState] = useState('');
  // DBの罰ゲーム設定
  const [dbBatsuGame, setDbBatsuGame] = useState('');
  // 参加プレイヤー
  const [mdlPlayers, setMdlPlayers] = useState([]);
  // 現在ラウンド
  const [currentRound, setCurrentRound] = useState(undefined);
  // 現在ラウンドの対戦数
  const [taisenSu, setTaisenSu] = useState(0);
  // 現在ラウンドの決着数
  const [kechakuSu, setKechakuSu] = useState(0);
  // 対戦
  const [matches, setMatches] = useState([]);
  // インフォメーション
  const [infoText, setInfoText] = useState('');

  // useEffect 2重実行防止フラグ
  const refCalled = useRef(false);
  // 対戦ユーザーを2重登録しないためのフラグ
  const userAdded = useRef(false);
  // 対戦ユーザーを2重登録しないためのフラグ
  const dbEventAttached = useRef(false);

  useEffect(() => {
    // 2重実行されるケースが多発するため、フラグ管理して1回だけの実行に限定する。
    if (refCalled.current) { return; }
    refCalled.current = true;

    // ログイン時のイベントハンドラを設定： stateを変更
    at.addOnAuthLoggedIn((user, additionalUserInfo) => {
      console.log('App: onAuthLoggedIn: ' + user.displayName);
      setloginState('LoggedIn');
    });
    // ログアウト時のイベントハンドラを設定： stateを変更
    at.addOnAuthLoggedOut(() => {
      console.log('App: onAuthLoggedOunt');
      setloginState('LoggedOut');
    });
    // ログイン監視を開始。上記ハンドラ設定前にアタッチすると、ハンドリングできない可能性あり、後ろで。
    at.attachLoginState();
  });

  function attachDbEvent() {
    // DBで罰ゲームの追加・更新時のイベントを設定する。
    MdlBatsuGame.onChildAddedOrUpdated((data) => {
      console.log('App: MdlBatsuGame.onChildAddedOrUpdated: ' + data._batsuGame);
      setDbBatsuGame(data._batsuGame);
    });

    // DBでゲーム参加ユーザーが登録された場合の処理
    MdlPlayer.onChildAdded(mdlPlayerOnChildAdded);

    // DBでラウンド追加 or 更新時
    MdlRound.onChildAddedOrUpdated(onDbRoundAddedOrUpdated);

    // DBで対戦が追加された時の処理
    MdlMatch.onChildAdded(onDbMatchAdded);
  }

  /**
   * 子コンポーネントで、認証ユーザー登録時のcallback
   * @param {MdlAuthUser} data 登録されたデータ
   */
  function onAuthUserRegisted(data) {
    setMdlAuthUser(data);
  }

  /**
   * プレイヤーの追加時の処理 : R1登録時のみ、テーブルに名前を追加
   * @param {MdlPlayer} mdlPlayer
   */
  function mdlPlayerOnChildAdded(mdlPlayer) {
    console.log('App: mdlPlayerOnChildAdded: ' + mdlPlayer._nickName);
    // ローカル管理オブジェクトにプレイヤーを追加
    jdm.addPlayer(mdlPlayer);
    if (mdlPlayer._round === 1) {
      if (mdlPlayer._authUid === mdlAuthUser.id) {
        jdm.playerMe = mdlPlayer;
      }
      setMdlPlayers(s => s = jdm.getPlayers(1).filter(v => v._authUid != null));
    }
  };

  /**
   * ラウンド更新時の処理
   * @param {MdlRound} mdlRound 
   * @returns 
   */
  async function onDbRoundAddedOrUpdated(mdlRound) {
    console.log('App: onDbRoundAddedOrUpdated: ' + mdlRound._round);
    setKechakuSu(0);
    setTaisenSu(0);
    setCurrentRound(mdlRound._round);
    jdm.round = mdlRound._round;

    // 以下の対戦追加処理は、管理者ユーザーのブラウザのみで実行する。
    if (!jdm.isPlayerAdmin) { return; }
    // 前ラウンドの未対戦のユーザーは双方を負け扱いとする。
    // TODO: 処理実装
    // fb.updateTaisenUnexecuted(jdm.round - 1);

    // 対象ユーザーを抽出 途中でjdmのユーザー追加処理が走りカウントが増えるので、別実体にする。
    const arrPlayers = jdm.getPlayers(mdlRound._round).slice();

    // 【gpt】arrPlayersのlengthが奇数の場合、配列の最後に仮想対戦相手を追加して偶数にする。
    if (arrPlayers.length % 2 !== 0) {
      const mdlAdjustPlayer = new MdlPlayer();
      mdlAdjustPlayer._authUid = null;
      mdlAdjustPlayer._nickName = arrPlayers.length === 1 ? '優勝' : '不戦勝';
      mdlAdjustPlayer._round = mdlRound._round;
      await mdlAdjustPlayer.save();
      arrPlayers.push(mdlAdjustPlayer);
    }

    // 【gpt】arrPlayers配列をランダムに並び替え →偏る・・・
    // arrPlayers.sort(() => Math.random() - 0.5);
    for (var i = arrPlayers.length - 1; i > 0; i--) {
      var r = Math.floor(Math.random() * (i + 1));
      var tmp = arrPlayers[i];
      arrPlayers[i] = arrPlayers[r];
      arrPlayers[r] = tmp;
    }
    // 2要素ずつ対戦相手としてDBに格納する。
    for (let i = 0; i < arrPlayers.length; i += 2) {
      const mdlMatch = new MdlMatch();
      mdlMatch._round = mdlRound._round;
      mdlMatch._uidPlayerA = arrPlayers[i]._authUid;
      mdlMatch._nickNamePlayerA = arrPlayers[i]._nickName;
      mdlMatch._uidPlayerB = arrPlayers[i + 1]._authUid;
      mdlMatch._nickNamePlayerB = arrPlayers[i + 1]._nickName;
      mdlMatch.save();
    }
  }

  /**
   * 対戦追加時の処理
   * @param {MdlMatch} mdlMatch 
   */
  function onDbMatchAdded(mdlMatch) {
    // 同期的な更新。単純にtaisenSu+1とすると、意図通りに更新されない。
    // サーバーでの更新時、インスタンスの設定値の更新を行う。matches配列の中のインスタンスの決着状況を最新化し、対戦表に送る為。
    mdlMatch.updateSync = true;
    mdlMatch.onUpdated(onDbMatchUpdated);
    setTaisenSu(s => s + 1);
    setMatches(s => [...s, mdlMatch]);
    jdm.increaseNumOfTaisenByRounds(mdlMatch._round);

    if (mdlMatch._uidPlayerA === jdm.playerMe._authUid || mdlMatch._uidPlayerB === jdm.playerMe._authUid) {
      const opponentNickName = mdlMatch._uidPlayerA === jdm.playerMe._authUid ? mdlMatch._nickNamePlayerB : mdlMatch._nickNamePlayerA;

      jdm.currentKeyTaisen = mdlMatch.id;

      if (opponentNickName === '不戦勝' || opponentNickName === '優勝') {
        // 不戦勝の勝者が自分であった場合、対戦レコードを更新する。
        mdlMatch._uidWinner = jdm.playerMe._authUid;
        mdlMatch._executed = true;
        mdlMatch.save();
      } else {
        jdm.currentKeyTaisen = mdlMatch.id;

        (async () => {
          $('#your-status-info').hide();
          $('#opponent-name').html(opponentNickName);
          if (opponentNickName !== '不戦勝' && opponentNickName !== '優勝') {
            $('.choices').show();
            $('#youropponent').html(`vs ${opponentNickName}!`).show().fadeOut(3000);
          } else if (opponentNickName === '不戦勝') {
            $('#youropponent').html(`${opponentNickName}!`).show();
            await sleep(2000);
            $('#youropponent').fadeOut(1000);
            await sleep(1000);
            $('#your-status-info').fadeIn(1000);
          }
        })();
      }
    }
  }

  function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  /**
   * 対戦情報更新時の処理、更新は基本的には勝敗決着時に起こる。
   * @param {MdlMatch} mdlMatch 
   */
  function onDbMatchUpdated(mdlMatch) {
    console.log('onDbMatchUpdated: nickNameA: ' + mdlMatch._nickNamePlayerA);
    console.log('onDbMatchUpdated: nickNameB: ' + mdlMatch._nickNamePlayerB);
    console.log('onDbMatchUpdated: executed: ' + mdlMatch._executed);
    console.log('onDbMatchUpdated: uidWinner: ' + mdlMatch._uidWinner);

    // ステートを更新し、対戦結果を再描画
    setMatches(s => [...s]);

    if (mdlMatch._nickNamePlayerA === '優勝' || mdlMatch._nickNamePlayerB === '優勝') {
      // 優勝決定
      startStars(200);
    } else if (mdlMatch._uidPlayerA === jdm.playerMe._authUid || mdlMatch._uidPlayerB === jdm.playerMe._authUid) {
      // 対戦のどちらかが自分
      if (mdlMatch._executed && mdlMatch._uidWinner === jdm.playerMe._authUid) {
        // プレイヤーのラウンドを進める。
        jdm.playerMe._round += 1;
        jdm.playerMe.save();
        jdm.addPlayer(jdm.playerMe);
        startStars(50);
      } else {
        startSkulls(50);
      }
    }
  }

  function startStars(n) {
    fallAnimation(n, "star", "★");
  }

  function startSkulls(n) {
    fallAnimation(n, "skull", "💀");
  }

  function fallAnimation(n, className, char) {
    for (var i = 0; i < n; i++) {
      var elem = document.createElement("div");
      elem.className = className;
      elem.textContent = char;
      elem.style.left = Math.random() * 100 + '%'; // 画面の幅に対するパーセンテージで左位置をランダム設定
      elem.style.fontSize = (Math.random() * (30 - 10) + 10) + 'px'; // 10pxから30pxの間でサイズをランダムに設定
      elem.style.animationDuration = (Math.random() * (10 - 5) + 5) + 's'; // 5秒から10秒の間でアニメーションの持続時間をランダムに設定
      document.body.appendChild(elem);

      // 星が画面下に到達した後の処理
      elem.addEventListener('animationend', function () {
        this.remove(); // アニメーションが終了した星をDOMから削除
      });
    }
  }

  let render = null;

  switch (loginState) {
    // ログインに成功していた場合、アプリケーションのレンダリングを開始
    case 'LoggedIn':
      console.log('App: case LoggedIn: ');
      jdm.authUser = at.user;

      if (mdlAuthUser === undefined) {
        console.log('App: case LoggedIn: mdlAuthUser === undefined:');
        MdlAuthUser.get(at.user.uid).then((data) => {
          setMdlAuthUser(data);
        });
      } else if (mdlAuthUser === null) {
        console.log('App: case LoggedIn: mdlAuthUser === null:');
        render = (
          <RegistAuthUser
            onAuthUserRegisted={onAuthUserRegisted}
          />
        );
      } else {
        console.log('App: case LoggedIn: authUserExists:');
        // ログインしているユーザーを対戦者リストに追加する。
        if (!userAdded.current) {
          userAdded.current = true;

          MdlPlayer.exists('authUid', '==', at.user.uid).then((exists) => {
            if (!exists) {
              const mdlPlayer = new MdlPlayer(null, true);
              mdlPlayer._authUid = at.user.uid;
              mdlPlayer._nickName = mdlAuthUser._nickName;
              mdlPlayer._round = 1;
              mdlPlayer.save();
            }
          });
        }

        if (!dbEventAttached.current) {
          dbEventAttached.current = true;
          attachDbEvent();
        }

        render = (
          <div>
            <Header />
            <main>
              <GameSettings
                currentRound={currentRound}
                authUser={mdlAuthUser}
                dbBatsuGame={dbBatsuGame}
              />
              <div className='info-and-taisen-wrapper'>
                <GameSummaryInfo
                  currentRound={currentRound}
                  taisenSu={taisenSu}
                  kechakuSu={kechakuSu}
                />
                <GameMatch />
              </div>
              <GameBracket
                mdlPlayers={mdlPlayers}
                currentRound={currentRound}
                matches={matches}
              />
            </main>
          </div>
        );
      }

      console.log('App: case LoggedIn: break:');
      break;
    // ログアウト・未認証時はログイン処理を実行
    case 'LoggedOut':
      render = <Auth />
      break;
    default:
      render = <h3>wating for check login state</h3>
  }

  console.log('App: render:');
  return render;
}

export default App;
