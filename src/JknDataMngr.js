import FirebaseMngr from './FirebaseMngr.js';
const fb = new FirebaseMngr();

/**
 * ジャンケンに関するあらゆるデータを管理する
 * 単一のインスタンスとしたいため、シングルトンで実装する。
 * @see https://qiita.com/NeGI1009/items/f8b17d856a4b15b1ecbc
 */
class JknDataMngr {
    #iRound = 0;
    #playerMe = null;
    #playersRounds = {};
    #numOfTaisenByRounds = {};
    #numOfKechakuByRounds = {};
    #currentKeyTaisen = null;
    #chosenCurrentTurn = false;
    #turn = 1;
    #myChoice = null;
    #opponentChoice = null;
    #isAiko = false;
    /**
     * コンストラクタ、プレイヤー名を引数に取り、各変数を初期化する。
     */
    constructor() {
        // Lint対応
        this.#isAiko = false;
    }

    /**
     * 現在のラウンド数
     */
    get round() {
        return this.#iRound;
    }
    set round(round) {
        this.#iRound = round;
    }

    /**
     * ラウンド別のユーザーを取得する。
     * @param {number} roundNo ラウンド数
     * @returns [{key, val()}] ユーザー情報の配列。0件の場合も配列を返却
     */
    getPlayers(roundNo) {
        this.#playersRounds[roundNo] ||= [];
        return this.#playersRounds[roundNo];
    }
    /**
     * 
     * @param {number} roundNo ラウンド数
     * @param {object} player [{key, val()}] ユーザー情報の配列。
     */
    addPlayer(roundNo, player) {
        this.#playersRounds[roundNo] ||= [];
        this.#playersRounds[roundNo].push(player);
    }

    /**
     * ラウンド別の対戦数を取得
     * @param {number} roundNo ラウンド
     * @returns number 対戦数
     */
    getNumOfTaisenByRounds(roundNo) {
        this.#numOfTaisenByRounds[roundNo] ||= 0;
        return this.#numOfTaisenByRounds[roundNo];
    }
    /**
     * ラウンド別の対戦数をインクリメント
     * @param {number} roundNo ラウンド
     * @returns number 対戦数
     */
    increaseNumOfTaisenByRounds(roundNo) {
        this.#numOfTaisenByRounds[roundNo] ||= 0;
        return ++this.#numOfTaisenByRounds[roundNo];
    }

    /**
     * ラウンド別の対戦数を取得
     * @param {number} roundNo ラウンド
     * @returns number 対戦数
     */
    getNumOfKechakuByRounds(roundNo) {
        this.#numOfKechakuByRounds[roundNo] ||= 0;
        return this.#numOfKechakuByRounds[roundNo];
    }
    /**
     * ラウンド別の対戦数をインクリメント
     * @param {number} roundNo ラウンド
     * @returns number 対戦数
     */
    increaseNumOfKechakuByRounds(roundNo) {
        this.#numOfKechakuByRounds[roundNo] ||= 0;
        return ++this.#numOfKechakuByRounds[roundNo];
    }

    /**
     * プレイヤー名
     */
    get playerMe() {
        return this.#playerMe;
    }
    /**
     * プレイヤー名
     */
    set playerMe(player) {
        this.#playerMe = player;
    }
    /**
     * プレイヤーは管理者である
     * @returns bool プレイヤーは管理者である
     */
    get isPlayerAdmin() {
        return this.#playerMe ? this.#playerMe.val().name === 'なっしー' : false;
    }

    /**
     * 現在の対戦キーを取得
     */
    get currentKeyTaisen() {
        return this.#currentKeyTaisen;
    }
    /**
     * 現在の対戦キーを設定
     */
    set currentKeyTaisen(keyTaisen) {
        this.#currentKeyTaisen = keyTaisen;
    }

    /**
     * じゃんけんの手の選択済み
     */
    get chosenCurrentTurn() {
        return this.#chosenCurrentTurn;
    }
    set chosenCurrentTurn(chosen) {
        return this.#chosenCurrentTurn = chosen;
    }

    /**
     * じゃんけんの手の選択済み
     */
    get turn() {
        return this.#turn;
    }
    /**
     * ターンを進める
     * @returns 進んだ後のターン
     */
    increaseTurn() {
        return ++this.#turn;
    }

    /**
     * 自分のじゃんけんの選択手
     */
    get myChoice() {
        return this.#myChoice;
    }
    set myChoice(choice) {
        return this.#myChoice = choice;
    }

    /**
     * 自分のじゃんけんの選択手
     */
    get opponentChoice() {
        return this.#opponentChoice;
    }
    set opponentChoice(choice) {
        return this.#opponentChoice = choice;
    }

    /**
     * 双方の手が登録されている場合、trueを返却
     */
    get isBothChoiceReady() {
        return this.myChoice && this.opponentChoice;
    }

    /**
     * 今があいこであるかを返却する。
     */
    get isAiko(){
        return this.#isAiko;
    }

    addPlayerMeToNextRound(){
        fb.addPlayer(
            this.playerMe.val().name
            , this.round + 1
            , this.playerMe.val().originalKeyPlayer
        );
    }

    /**
     * 対戦を実行する。。。この操作はcontrollerだよなぁ。 TODO: 現在ラウンドと異なる場合はUserAddは不可。締切済みで負けな旨を出力。
     * @returns string 勝ち、負け、あいこ
     */
    execTaisen() {
        if (!this.isBothChoiceReady) { throw new Error('双方の手が確定していません。'); }

        let ret = null;

        if (this.myChoice.val().choice === this.opponentChoice.val().choice) {
            ret = "あいこ";
            this.increaseTurn();
            this.myChoice = null;
            this.opponentChoice = null;
            this.#isAiko = true;
            this.chosenCurrentTurn = false;
        } else if (this.myChoice.val().winVS === this.opponentChoice.val().choice) {
            ret = '勝ち';

            // 次のラウンドにユーザ登録する。
            this.addPlayerMeToNextRound();

            // 対戦データの勝者を登録する。
            fb.updateTaisen(
                this.myChoice.val().keyTaisen,
                { keyWinnerPlayer: this.playerMe.key }
            );

            this.#chosenCurrentTurn = false;
            this.#currentKeyTaisen = null;
            this.#isAiko = false;
            this.#myChoice = null;
            this.#opponentChoice = null;
            this.#turn = 1;
        } else {
            ret = '負け';
        }

        return ret;
    }
}

// インポート先では単一のインスタンスが参照される。
// このことにより、シングルトンを実現する
// const _instance = new JknDataMngr();
// export default _instance;
export default JknDataMngr;