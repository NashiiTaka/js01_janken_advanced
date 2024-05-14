export default function GameSummaryInfo(props) {
  return (
    <div className="current-info">
      <dl className="dl_table">
        <dt>現在R</dt>
        <dd id="current-round">{props.currentRound || 1}</dd>
        <dt>対戦数</dt>
        <dd id="taisen-su">{props.taisenSu}</dd>
        <dt>決着数</dt>
        <dd id="kechaku-su">{props.kechakuSu}</dd>
      </dl>
    </div>
  );
}