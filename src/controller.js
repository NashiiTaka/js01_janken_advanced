// ライブラリインポート
import $ from 'jquery'; // npm install jquery
import axios from 'axios'; // npm install axios

// クラスインポート
// import jdm from './JknDataMngr.js';
// import fb from './FirebaseMngr.js';

import JknDataMngr from './JknDataMngr.js';
import FirebaseMngr from './FirebaseMngr.js';
const jdm = new JknDataMngr();
const fb = new FirebaseMngr();

// ユーザー登録押下時の処理：DBに登録をかける
$(`#btnRegisterName`).on('click', () => {
  console.log(`clicked: btnRegisterName`);

  // 入力値異常判定処理
  const inputVal = $("#txtName").val().trim();
  if (inputVal === '') {
    alert('名前を入力してください');
    return;
  }

  // 名前の入力欄を非活性化
  $('#btnRegisterName').prop('disabled', true);
  $('#txtName').prop('disabled', true);

  // DBへのユーザーの追加処理
  fb.addPlayer(inputVal, jdm.round == 0 ? 1 : jdm.round, null);
});

// 罰ゲーム確定時の処理 : 全員に罰ゲーム内容を共有する。
$('#btnBatsuKakutei').on('click', () => {
  fb.replaceBatsuGame($('#batsu-game').val());
});

// 罰ゲーム更新時の処理 
fb.setOnChildAdded(fb.dbRefBatsuGame, (data) => {
  console.log('×ゲーム変更');
  $('#batsu-game').val(data.val().batsuGame);
});

// 全データ削除処理
$("#btnReset").on('click', () => {
  console.log('clicked: btnReset');
  fb.removeAll();
});

// ラウンド締切ボタン押下 : ラウンド更新処理のキック
$("#btnCloseRound").on('click', async () => {
  console.log('clicked: btnCloseEntry');
  closeRound();
});
// ラウンド締切処理 : 対象ユーザーを特定, 対戦組合せの作成
async function closeRound() {
  fb.updateRound(jdm.round + 1);
}

// ラウンド進行時の処理 : 対戦の作成, 各種表示項目の更新
fb.setOnChildChanged(fb.dbRefRounds, async (data) => {
  // console.log('setOnChildChanged: fb.dbRefRounds');
  $('#kechaku-su').html(0);
  jdm.round = data.val().round;
  $('#current-round').html(jdm.round);

  // 以下の対戦追加処理は、管理者ユーザーのブラウザのみで実行する。
  if (!jdm.isPlayerAdmin) { return; }
  $("#btnCloseRound").val(`R${jdm.round}終了`);

  // 前ラウンドの未対戦のユーザーは双方を負け扱いとする。
  fb.updateTaisenUnexecuted(jdm.round - 1);

  // 対象ユーザーを抽出
  const arrPlayers = (await fb.getPlayers(jdm.round)).map((v) => v.val());
  // 【gpt】arrPlayersのlengthが奇数の場合、配列の最後にnullを追加して偶数にする。
  if (arrPlayers.length % 2 !== 0) {
    arrPlayers.push({
      originalKeyPlayer: null,
      name: arrPlayers.length == 1 ? '優勝' : '不戦勝'
    });
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
    fb.addTaisen(
      arrPlayers[i].originalKeyPlayer,
      arrPlayers[i].name,
      arrPlayers[i + 1].originalKeyPlayer,
      arrPlayers[i + 1].name,
      jdm.round
    );
  }
});

// テーブルオブジェクトは頻繁にアクセスするので変数に取っておく。
const tbl = $('#tbl');

// プレイヤーの追加時の処理 : R1登録時のみ、テーブルに名前を追加
fb.setOnChildAdded(fb.dbRefPlayers, (data) => {
  const keyPlayer = data.key;
  const player = data.val();
  // console.log('onChildAdded / players / [' + player.round + '] ' + player.name);

  // ローカル管理オブジェクトにプレイヤーを追加
  jdm.addPlayer(player.round, data);
  // 1ラウンド目のプレイヤー追加時、追加された名前が自入力分、かつ管理オブジェクトに自分が未登録の場合、
  // このデータを自データとして管理オブジェクトに登録する。
  if ((
    player.name === $("#txtName").val().trim()
  ) && player.round === 1 && jdm.playerMe == null
  ) {
    jdm.playerMe = data;
  }
  // 管理者の場合は管理者用のボタンを表示する。
  if (jdm.isPlayerAdmin && player.round === 1) {
    fb.initializeRound();
    $('#btnReset').show();
    $('#btnCloseRound').show();
    $('#batsu-game').prop('disabled', false);
    $('#btnGenBatsu').show();
    $('#btnBatsuKakutei').show();
  }

  // 1ラウンド目の時は、勝敗テーブルのエントリー名列を作成していく。
  if (player.round === 1) {
    // 最終行以外の最終行、上クラスを削除。last-childを試したがどうしても特定クラスの最後の要素を選択できなかった。
    tbl.find('tr.taisen-all-top-row').removeClass('taisen-all-top-row');
    tbl.find('tr.taisen-all-bottom-row').removeClass('taisen-all-bottom-row');
    tbl.append(`<tr class="player-${keyPlayer} taisen-all-top-row taisen-all-bottom-row taisen-top-row taisen-bottom-row" id="player-${keyPlayer}-1"><td rowspan="2" class="td-no bottom-cell">${jdm.getPlayers(1).length}</td><td rowspan="2" class="td-name bottom-cell">${player.name}</td></tr>`);
    tbl.append(`<tr class="player-${keyPlayer}" id="player-${keyPlayer}-2"</tr>`);
  }
});

// 対戦の追加時の処理 : 対戦相手を各プレイヤー行に代入。それぞれのセルへのアクセス用のパラメータを設定。自分の対戦キーを保持。
fb.setOnChildAdded(fb.dbRefTaisen, async (data) => {
  const keyTaisen = data.key;
  const taisen = data.val();

  // ラウンド内で初めての対戦追加の場合、テーブルヘッダ行のラウンドを追加する。対戦のセルを追加する。
  if (jdm.getNumOfTaisenByRounds(jdm.round) == 0) {
    $('#tbl-header').append(`<th>R${jdm.round}</th>`);
    for (const playerData of jdm.getPlayers(1)) {
      const loseRound = $(`.player-${playerData.key}`).hasClass('looser') ? parseInt($(`.player-${playerData.key}`).attr('lose-round')) : null;

      if (loseRound) {
        $(`#player-${playerData.key}-1`).append(`<td class="bottom-cell" rowspan="2">${loseRound == jdm.round - 1 ? `R${loseRound}&nbsp;敗退` : '-'}</td>`);

        if ($(`#player-${playerData.key}-2`).hasClass('taisen-bottom-row')) {
          $(`#player-${playerData.key}-2`).removeClass('taisen-bottom-row');
          $(`#player-${playerData.key}-1`).addClass('taisen-bottom-row');
        }
        if ($(`#player-${playerData.key}-2`).hasClass('taisen-all-bottom-row')) {
          $(`#player-${playerData.key}-2`).removeClass('taisen-all-bottom-row');
          $(`#player-${playerData.key}-1`).addClass('taisen-all-bottom-row');
        }
      } else {
        $(`#player-${playerData.key}-1`).append(`<td class="td-opponent round-${jdm.round}">-</td>`);
        $(`#player-${playerData.key}-2`).append(`<td class="td-result round-${jdm.round} bottom-cell">-</td>`);

        if ($(`#player-${playerData.key}-1`).hasClass('taisen-bottom-row')) {
          $(`#player-${playerData.key}-1`).removeClass('taisen-bottom-row');
          $(`#player-${playerData.key}-2`).addClass('taisen-bottom-row');
        }
        if ($(`#player-${playerData.key}-1`).hasClass('taisen-all-bottom-row')) {
          $(`#player-${playerData.key}-1`).removeClass('taisen-all-bottom-row');
          $(`#player-${playerData.key}-2`).addClass('taisen-all-bottom-row');
        }
      }
    }
  }

  // 対戦数を増やす
  jdm.increaseNumOfTaisenByRounds(taisen.round);
  $('#taisen-su').html(jdm.getNumOfTaisenByRounds(jdm.round));

  // 対戦相手を各プレイヤー行に代入。それぞれのセルへのアクセス用のパラメータを設定。
  // 結果には、id: taisen-${keyTaisen}-${keyPlayer}でアクセスする。
  if (taisen.originalKeyPlayerA == null || taisen.originalKeyPlayerB == null) {
    const tgtKey = taisen.originalKeyPlayerA || taisen.originalKeyPlayerB;
    const opponentValue = taisen.originalKeyPlayerA ? taisen.namePlayerB : taisen.namePlayerA;
    $(`.player-${tgtKey}`).find(`.td-opponent.round-${jdm.round}`).html(opponentValue);
    $(`.player-${tgtKey}`).find(`.td-result.round-${jdm.round}`).attr('id', `taisen-${keyTaisen}-${tgtKey}`);

    if (opponentValue == '不戦勝') {
      // 不戦勝の勝者が自分であった場合、対戦レコードを更新する。
      if (jdm.playerMe && (tgtKey == jdm.playerMe.key)) {
        jdm.addPlayerMeToNextRound();
        taisenResultUpd(keyTaisen, tgtKey);
        startStars(50);
      }
    } else if (opponentValue == '優勝') {
      const winner = taisen.originalKeyPlayerA ? taisen.namePlayerA : taisen.namePlayerB;
      startStars(200);
      $('#your-status-info').html(`${winner}&nbsp;優勝！`).show().fadeOut(300).fadeIn(300).fadeOut(300).fadeIn(300).fadeOut(300).fadeIn(300);
    }
  } else {
    $(`.player-${taisen.originalKeyPlayerA}`).find(`.td-opponent.round-${jdm.round}`).html('vs&nbsp;' + taisen.namePlayerB);
    $(`.player-${taisen.originalKeyPlayerA}`).find(`.td-result.round-${jdm.round}`).attr('id', `taisen-${keyTaisen}-${taisen.originalKeyPlayerA}`);
    $(`.player-${taisen.originalKeyPlayerB}`).find(`.td-opponent.round-${jdm.round}`).html('vs&nbsp;' + taisen.namePlayerA);
    $(`.player-${taisen.originalKeyPlayerB}`).find(`.td-result.round-${jdm.round}`).attr('id', `taisen-${keyTaisen}-${taisen.originalKeyPlayerB}`);
  }

  // 対戦プレイヤーのいずれかに自分が設定されている場合、その対戦を現在の対戦として対戦キーを保持しておく。
  if (jdm.playerMe && (taisen.originalKeyPlayerA == jdm.playerMe.key || taisen.originalKeyPlayerB == jdm.playerMe.key)) {
    jdm.currentKeyTaisen = keyTaisen;
    const opponentName = taisen.originalKeyPlayerA == jdm.playerMe.key ? taisen.namePlayerB : taisen.namePlayerA;
    $('#your-status-info').hide();
    $('#opponent-name').html(opponentName);
    if (opponentName != '不戦勝' && opponentName != '優勝') {
      $('.choices').show();
      $('#youropponent').html(`vs ${opponentName}!`).show().fadeOut(2000);
    } else if (opponentName == '不戦勝') {
      $('#youropponent').html(`${opponentName}!`).show();
      await sleep(2000);
      $('#youropponent').fadeOut(1000);
      await sleep(1000);
      $('#your-status-info').fadeIn(1000);
    }
  }
});

// じゃんけん手の選択肢オブジェクト : 表示名と勝てる相手を格納する。
const jknChoices = [
  { choice: "グー", winVS: "チョキ" },
  { choice: "パー", winVS: "グー" },
  { choice: "チョキ", winVS: "パー" }
];
// じゃんけん手が押された時の処理 : DBに登録する。
$(`.choice`).on('click', (elem) => {
  // すでに手を選んでいた場合は、イベントをスキップする。
  if (jdm.chosenCurrentTurn) { return; }
  jdm.chosenCurrentTurn = true;

  const myChoice = jknChoices[parseInt(elem.target.value)];
  $(elem.target).addClass('chosen');

  fb.addChoice(
    jdm.currentKeyTaisen
    , jdm.turn
    , jdm.playerMe.key
    , jdm.playerMe.val().name
    , myChoice.choice
    , elem.target.value
    , myChoice.winVS
  );
});

// 手選択時の処理
fb.setOnChildAdded(fb.dbRefChoice, (data) => {
  // console.log('onChildAdded / Choice');
  const keyChoice = data.key;
  const choice = data.val();

  // 自分と同じ対戦、ターン、nameが自分でないものが相手の選択データ
  if (
    choice.keyTaisen == jdm.currentKeyTaisen
    && choice.turn == jdm.turn
  ) {
    if (choice.keyPlayer == jdm.playerMe.key) {
      jdm.myChoice = data;
      $('#my-status').html('お待ちください').removeClass('prompt').addClass('info');
    } else {
      // 相手の手が決まったら、選択肢を表示、ステータスを更新しておく。
      jdm.opponentChoice = data;
      $('#opponent-status').show();
      $('#notyet_opponent_btn').hide();
      $('.choice-opponent').show();
    }

    // 双方の手が出揃ったら、対戦を始める
    if (jdm.isBothChoiceReady) {
      execTaisen();
    }
  }
});

// 対戦の実行処理 : 勝敗決定後の処理
async function execTaisen() {
  const intervalKakegoe = 800;

  const progressElem = !jdm.isAiko ? $('#jankenpon') : $('#aikodesyo');
  await sleep(intervalKakegoe);
  progressElem.show();
  progressElem.children('span').eq(0).show();
  await sleep(intervalKakegoe);
  progressElem.children('span').eq(1).show();
  await sleep(intervalKakegoe);
  progressElem.children('span').eq(2).show();
  await sleep(intervalKakegoe);
  progressElem.fadeOut(1000);
  await sleep(intervalKakegoe);
  $(`.choice-opponent[value="${jdm.opponentChoice.val().choiceVal}"]`).addClass('chosen');
  $(`.choice-opponent[value="${jdm.opponentChoice.val().choiceVal}"]`).fadeOut(300).fadeIn(300).fadeOut(300).fadeIn(300);
  await sleep(2000);

  const ret = jdm.execTaisen();

  if (ret === 'あいこ') {
    $('#kekka').html(ret).show().fadeOut(2000);
    await sleep(2000);
    $(`.choice`).removeClass('chosen').fadeOut(500).fadeIn(500);
    $('#my-status').html('あいこのため、もう一度！').removeClass('info').addClass('prompt');
    $('#opponent-status').hide();
    $('#notyet_opponent_btn').show();
    $('.choice-opponent').hide().removeClass('chosen');
    $('#jankenpon span').hide();
    $('#aikodesyo span').hide();
  } else {
    $('#kekka').html(ret).show().fadeOut(3000);
    if (ret == '勝ち') {
      startStars(50);
    } else {
      startSkulls(50);
    }
    await sleep(2500);
    $(`.choice`).removeClass('chosen');
    $('#my-status').html('選んでください！').removeClass('info').addClass('prompt');
    $('#opponent-status').hide();
    $('#notyet_opponent_btn').show();
    $('.choice-opponent').hide().removeClass('chosen');
    $('#jankenpon span').hide();
    $('#aikodesyo span').hide();
    $('.choices').fadeOut(1000);
    await sleep(1000);

    if (ret == '勝ち') {
      $('#your-status-info').show();
    } else {
      $('#your-status-info').html('負けました・・・').show();
    }
  }
}

function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

// 勝敗決定時の処理 : 結果セルの更新
function taisenResultUpd(keyTaisen, keyWinnerPlayer) {
  fb.updateTaisen(
    keyTaisen,
    { keyWinnerPlayer: keyWinnerPlayer }
  );
}

// 対戦結果更新時の処理
// ここに至るのは勝負完了後、ラウンド締切に夜双方敗退
fb.setOnChildChanged(fb.dbRefTaisen, (data) => {
  const keyTaisen = data.key;
  const taisen = data.val();
  const keyOpponentPlayer = taisen.keyWinnerPlayer == taisen.originalKeyPlayerA ? taisen.originalKeyPlayerB : taisen.originalKeyPlayerA;

  // 対戦締切 or ラウンド数が異なっている場合は、双方を負けとする。
  if (taisen.unexecutedTaisen || jdm.round != taisen.round) {
    $(`#taisen-${keyTaisen}-${taisen.originalKeyPlayerA}`).html('×').fadeOut(500).fadeIn(500).fadeOut(500).fadeIn(500).fadeOut(500).fadeIn(500);
    $(`#taisen-${keyTaisen}-${taisen.originalKeyPlayerB}`).html('×').fadeOut(500).fadeIn(500).fadeOut(500).fadeIn(500).fadeOut(500).fadeIn(500);
    $(`.player-${taisen.originalKeyPlayerA}`).addClass('looser').attr('lose-round', taisen.round);
    $(`.player-${taisen.originalKeyPlayerB}`).addClass('looser').attr('lose-round', taisen.round);
  } else {
    $(`#taisen-${keyTaisen}-${taisen.keyWinnerPlayer}`).html('○').fadeOut(500).fadeIn(500).fadeOut(500).fadeIn(500).fadeOut(500).fadeIn(500);
    $(`#taisen-${keyTaisen}-${keyOpponentPlayer}`).html('×').fadeOut(500).fadeIn(500).fadeOut(500).fadeIn(500).fadeOut(500).fadeIn(500);
    $(`.player-${keyOpponentPlayer}`).addClass('looser').attr('lose-round', taisen.round);
  }

  // 決着数をインクリメント
  jdm.increaseNumOfKechakuByRounds(taisen.round);
  // 対戦のラウンドと現在ラウンドが同じ場合は、ラウンドを進める
  if (taisen.round == jdm.round) {
    $('#kechaku-su').html(jdm.getNumOfKechakuByRounds(jdm.round));
  }
});

// 星のエフェクトを停止する関数
function stopStars() {
  $('.star').remove();
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

$('#btnGenBatsu').on('click', () => {
  $('#btnGenBatsu').prop('disabled', true);
  reply();
});

const API_KEY = '';
const URL = "https://api.openai.com/v1/chat/completions";

function reply() {
  var text = '宴会でみんなが楽しめる罰ゲームを、ランダムに一つだけ教えて。ゲームの内容は不要で、負けた時に行わなければならない罰ゲームだけに絞って回答ください。';
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
      $("#batsu-game").val(chatgpt_response);
    } catch (error) {
      console.log(error);
      alert('エラー発生：' + error.message + '\n429 = Too Many Requests\n\n try again!');
    } finally {
      $('#btnGenBatsu').prop('disabled', false);
    }
  }
  getResponse();
}