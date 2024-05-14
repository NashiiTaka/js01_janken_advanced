import { useState } from "react";
import MdlPlayer from "../js/mdl/MdlPlayer";
import MdlMatch from "../js/mdl/MdlMatch";

/**
 * 引数の定義
 * @typedef GameBracketProps
 * @type {object}
 * @property {Array.<MdlPlayer>} mdlPlayers
 * @property {Array.<MdlMatch>} matches
 * @property {Number} currentRound
 */

/**
 * 対戦表を管理
 * @param {GameBracketProps} props 
 * @returns 
 */
export default function GameBracket(props) {
  // ラウンドヘッダ行の出力
  const roundHeader = [];
  if (Number.isInteger(props.currentRound)) {
    for (let i = 1; i <= props.currentRound; i++) {
      roundHeader.push(
        <th key={`R${i}-header`}>{`R${i}`}</th>
      );
    }
  }

  // 対戦を、プレイヤー別、ラウンド別に整理する。
  const matchesMap = {};
  props.matches.forEach((m) => {
    matchesMap[m._uidPlayerA] ||= {};
    matchesMap[m._uidPlayerA][m._round] ||= {};
    matchesMap[m._uidPlayerA][m._round]['uidOpponent'] = m._uidPlayerB;
    matchesMap[m._uidPlayerA][m._round]['nickNameOpponent'] = m._nickNamePlayerB;
    matchesMap[m._uidPlayerA][m._round]['executed'] = m._executed;
    matchesMap[m._uidPlayerA][m._round]['uidWinner'] = m._uidWinner;
    matchesMap[m._uidPlayerA][m._round]['unexecutedMatch'] = m._unexecutedMatch;

    matchesMap[m._uidPlayerB] ||= {};
    matchesMap[m._uidPlayerB][m._round] ||= {};
    matchesMap[m._uidPlayerB][m._round]['uidOpponent'] = m._uidPlayerA;
    matchesMap[m._uidPlayerB][m._round]['nickNameOpponent'] = m._nickNamePlayerA;
    matchesMap[m._uidPlayerB][m._round]['executed'] = m._executed;
    matchesMap[m._uidPlayerB][m._round]['uidWinner'] = m._uidWinner;
    matchesMap[m._uidPlayerB][m._round]['unexecutedMatch'] = m._unexecutedMatch;
  });

  function createPlayersRow() {
    const arrRender = [];

    for (let i = 0; i < props.mdlPlayers.length; i++) {
      const mdlPlayer = props.mdlPlayers[i];
      arrRender.push(
        <tbody key={`${mdlPlayer._authUid}-rows`}>
          <tr
            // 最終行のみ、最終行用のクラスを追加する。(テーブルに丸みをもたせる)
            className={`player-${mdlPlayer._authUid}${mdlPlayer._loseRound ? ' looser' : ''}`}
            id={`player-${mdlPlayer._authUid}-1`}
            key={`${mdlPlayer._authUid}-top-row`}
          >
            <td rowSpan="2" className={`td-no bottom-cell${i === props.mdlPlayers.length - 1 ? " left-bottom" : ""}`} key={`${mdlPlayer._authUid}-no`}>{i + 1}</td>
            <td rowSpan="2" className={`td-name bottom-cell${props.currentRound ? '' : ' right-end'}${i === props.mdlPlayers.length - 1 && !props.currentRound ? " right-bottom" : ""}`} key={`${mdlPlayer._authUid}-name`}>{mdlPlayer._nickName}</td>
            {createPlayerRoundTop(mdlPlayer, i === props.mdlPlayers.length - 1)}
          </tr>
          <tr
            className={`player-${mdlPlayer._authUid}`}
            id={`player-${mdlPlayer._authUid}-2`}
            key={`${mdlPlayer._authUid}-bottom-row`}
          >
            {createPlayerRoundBottom(mdlPlayer, i === props.mdlPlayers.length - 1)}
          </tr>
        </tbody>
      );
    }

    return arrRender;
  }

  /**
   * 
   * @param {MdlPlayer} mdlPlayer 
   * @param {boolean} isLastPlayer
   */
  function createPlayerRoundTop(mdlPlayer, isLastPlayer) {
    const ret = [];
    for (let i = 1; i <= props.currentRound; i++) {
      const info = matchesMap[mdlPlayer._authUid] && matchesMap[mdlPlayer._authUid][i] ? matchesMap[mdlPlayer._authUid][i] : null;
      if (!Number.isInteger(mdlPlayer._loseRound) || i <= mdlPlayer._loseRound) {
        // まだ負けていないか、負けた当ラウンドまで。上行に対戦相手、下行に結果を出力する。
        ret.push(
          <td
            className={`td-opponent round-${i}${i === props.currentRound ? ' right-end' : ''}`}
            key={`${mdlPlayer._authUid}-R${i}-opponent`}
          >
            {info ? (info['nickNameOpponent'] !== '不戦勝' && info['nickNameOpponent'] !== '優勝' ? 'vs ' : '') + info['nickNameOpponent']  : '-'}
          </td>
        );
      } else {
        // 負けた次ラウンド以降。2行分を1セルとし、負けた翌ラウンドのみ、〜R敗退と出力する。
        ret.push(
          <td
            className={`bottom-cell${i === props.currentRound ? ' right-end' : ''}${isLastPlayer ? " right-bottom" : ""}`}
            rowSpan="2"
            key={`${mdlPlayer._authUid}-R${i}-result`}
          >
            {mdlPlayer._loseRound === i - 1 ? `R${mdlPlayer._loseRound}&nbsp;敗退` : '-'}
          </td>
        );
      }
    }
    return ret;
  }
  /**
   * 
   * @param {MdlPlayer} mdlPlayer 
   * @param {boolean} isLastPlayer
   */
  function createPlayerRoundBottom(mdlPlayer, isLastPlayer) {
    const ret = [];
    for (let i = 1; i <= props.currentRound; i++) {
      if (!Number.isInteger(mdlPlayer._loseRound) || i <= mdlPlayer._loseRound) {
        // まだ負けていないか、負けた当ラウンドまで。下行に結果を表示する。
        const info = matchesMap[mdlPlayer._authUid] && matchesMap[mdlPlayer._authUid][i] ? matchesMap[mdlPlayer._authUid][i] : null;
        let v = null;
        if(info && info['nickNameOpponent'] === '不戦勝'){
          console.log('autuUid: ' + mdlPlayer._authUid);
          console.log('nickName: ' + mdlPlayer._nickName);
          console.log('executed: ' + info['executed']);
          console.log('uidWinner: ' + info['uidWinner']);
        }
        if(info && info['executed']){
          v = info['uidWinner'] === mdlPlayer._authUid ? '○' : '×';
        }else{
          v = '-';
        }
        ret.push(
          <td
            className={`td-result round-${i} bottom-cell${i === props.currentRound ? ' right-end' : ''}${isLastPlayer ? " right-bottom" : ""}`}
            key={`${mdlPlayer._authUid}-R${i}-result`}
          >
            {v}
          </td>
        );
      }
    }
    return ret;
  }

  return (
    <div>
      <p>対戦表</p>
      <table id="tbl" className="taisen-table">
        <thead>
          <tr id="tbl-header">
            <th>No</th>
            <th>名前</th>
            {roundHeader}
          </tr>
        </thead>
        {createPlayersRow()}
      </table>
    </div>
  );
}