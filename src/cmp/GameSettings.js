import axios from 'axios'; // npm install axios
import './css/Header.css'
import { useState, useEffect, useRef } from 'react';

import at from '../js/AuthMngr';
import jdm from '../js/JknDataMngr';
import fb from '../js/FirebaseMngr';

import MdlBatsuGame from '../js/mdl/MdlBatsuGame';
import MdlRound from '../js/mdl/MdlRound';

export default function GameSettings(props) {
  // useState / useRef
  const [displayName, setDisplayName] = useState(props.authUser._nickName);
  // ローカルの×ゲーム設定状態
  const [batsuGame, setBatsuGame] = useState(props.dbBatsuGame);
  const [btnGenBatsuDisabled, setBtnGenBatsuDisabled] = useState(false);
  const refCalled = useRef(false);

  useEffect(() => {
    // 2重実行されるケースが多発するため、フラグ管理して1回だけの実行に限定する。
    if (refCalled.current) { return; }
    refCalled.current = true;
  });

  // 管理者用の要素の表示設定
  const hideInputClassName = jdm.isPlayerAdmin ? '' : 'hide';

  // 罰ゲーム確定ボタン押下時の処理
  function onBtnBatsuKakutei(){
    MdlBatsuGame.deleteAll();
    const mdl = new MdlBatsuGame();
    mdl._batsuGame = batsuGame;
    mdl.save();
  }

  // ラウンド締切ボタン押下 : ラウンド更新処理のキック、ハンドリングはApp.jsにて。
  function onBtnCloseEntry(){
    console.log('clicked: btnCloseEntry');
    MdlRound.AdvanceTheRound();
  };

  const API_KEY = '';
  const URL = "https://api.openai.com/v1/chat/completions";
  const onBtnGenBatsu = () => {
    setBtnGenBatsuDisabled(true);

    const text = '宴会でみんなが楽しめる罰ゲームを、ランダムに一つだけ教えて。ゲームの内容は不要で、負けた時に行わなければならない罰ゲームだけに絞って回答ください。';
    async function getResponse() {
      try {
        const response = await axios.post(
          URL,
          {
            "model": "gpt-3.5-turbo",
            "messages": [
              { "role": "user", "content": text }
            ]
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${API_KEY}`,
            },
          }
        );
        var chatgpt_response = response.data.choices[0].message.content;
        setBatsuGame(chatgpt_response);
      } catch (error) {
        console.log(error);
        alert('エラー発生：' + error.message + '\n429 = Too Many Requests\n\n try again!');
      } finally {
        setBtnGenBatsuDisabled(false);
      }
    }

    getResponse();
  }

  return (
    <div>
      <div>
        {/* 名前を入力してください。 */}
        You are
        <input
          type="text"
          id="txtName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={true}
        />
        <input
          id="btnCloseRound"
          type="submit"
          value={props.currentRound ? `R${jdm.round}終了` : "エントリー締切"}
          className={hideInputClassName}
          onClick={onBtnCloseEntry}
        />
        <input
          id="btnReset"
          type="submit"
          value="データリセット"
          className={hideInputClassName}
          onClick={() => { fb.removeAll() }}
        />
      </div>
      <div className="batsu-wrapper">
        バツゲーム
        <input
          type="text"
          id="batsu-game"
          // 管理者ユーザーではないか、db罰ゲームが確定していたら非活性化
          disabled={!jdm.isPlayerAdmin}
          // db罰ゲーム(優先) or ローカル罰ゲームを設定
          value={jdm.isPlayerAdmin ? batsuGame : props.dbBatsuGame}
          onChange={(e) => setBatsuGame(e.target.value)}
        />
        <input
          id="btnGenBatsu"
          type="submit"
          value="自動生成"
          className={hideInputClassName}
          onClick={onBtnGenBatsu}
          // 自動生成中か、管理者ユーザーではないか場合、非活性化
          disabled={btnGenBatsuDisabled || !jdm.isPlayerAdmin}
        />
        <input  
          id="btnBatsuKakutei"
          type="submit"
          value="確定"
          // 管理者ユーザーではないか、db罰ゲームが確定していたら非活性化
          disabled={!jdm.isPlayerAdmin}
          className={hideInputClassName}
          onClick={onBtnBatsuKakutei}
        />
      </div>
    </div>
  )
}