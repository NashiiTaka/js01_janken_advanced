export default function GameMatch(props) {
  return (
    <div className="choices-wrapper">
      <p className="progress" id="your-status-info">お待ちください</p>
      <p className="hide progress" id="youropponent"></p>
      <p className="hide progress" id="jankenpon"><span className="hide">じゃん</span><span className="hide">&nbsp;&nbsp;けん</span><span
        className="hide">&nbsp;&nbsp;ぽん！</span></p>
      <p className="hide progress" id="aikodesyo"><span className="hide">あい</span><span className="hide">&nbsp;&nbsp;こで</span><span
        className="hide">&nbsp;&nbsp;しょ！</span></p>
      <p className="hide progress" id="kekka"></p>
      <div className="choices hide" id="choices">
        <p>あなたの手&nbsp;&nbsp;<span className="prompt" id="my-status">選んでください！</span></p>
        <ul>
          <li className="choice" id="gu_btn" value="0">グー</li>
          <li className="choice" id="par_btn" value="1">パー</li>
          <li className="choice" id="cho_btn" value="2">チョキ</li>
        </ul>
        <p><span id="opponent-name">相手</span>の手&nbsp;&nbsp;<span className="info hide" id="opponent-status">決まりました！</span>
        </p>
        <ul>
          <li className="choice-opponent-default" id="notyet_opponent_btn" value="">まだ</li>
          <li className="choice-opponent hide" id="gu_opponent_btn" value="0">グー</li>
          <li className="choice-opponent hide" id="par_opponent_btn" value="1">パー</li>
          <li className="choice-opponent hide" id="cho_opponent_btn" value="2">チョキ</li>
        </ul>
      </div>
    </div>
  );
}