// ライブラリインポート
import $ from 'jquery'; // npm install jquery

import jdm from './JknDataMngr';
import fb from './FirebaseMngr';

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
  // const keyChoice = data.key;
  const choice = data.val();

  // 自分と同じ対戦、ターン、nameが自分でないものが相手の選択データ
  if (
    choice.keyTaisen === jdm.currentKeyTaisen
    && choice.turn === jdm.turn
  ) {
    if (choice.keyPlayer === jdm.playerMe.key) {
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
    if (ret === '勝ち') {
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

    if (ret === '勝ち') {
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
  const keyOpponentPlayer = taisen.keyWinnerPlayer === taisen.originalKeyPlayerA ? taisen.originalKeyPlayerB : taisen.originalKeyPlayerA;

  // 対戦締切 or ラウンド数が異なっている場合は、双方を負けとする。
  if (taisen.unexecutedMatch || jdm.round !== taisen.round) {
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
  if (taisen.round === jdm.round) {
    $('#kechaku-su').html(jdm.getNumOfKechakuByRounds(jdm.round));
  }
});

// 星のエフェクトを停止する関数
// function stopStars() {
//   $('.star').remove();
// }

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
