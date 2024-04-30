// Firebaseの初期化
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
import { getDatabase, ref, push, set, onChildAdded, remove, onChildRemoved, update, onChildChanged, onValue }
    from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBYHC7mgehcnO58aE8PQYJqyxUSToZGioo",
    authDomain: "sample-bdcb1.firebaseapp.com",
    projectId: "sample-bdcb1",
    storageBucket: "sample-bdcb1.appspot.com",
    messagingSenderId: "525120777563",
    appId: "1:525120777563:web:e3d17ab3e2f3ab32a37e7e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

/**
 * Firebaseとの接続を管理する。
 */
class FirebaseMngr {
    #db = null;
    #dbRefPlayers = null;
    #dbRefTaisen = null;
    #dbRefChoice = null;
    #dbRefRounds = null;
    #dbRefBatsuGame = null;
    #round = null;

    constructor() {
        this.initialize();
    }

    /**
     * データベース本体を取得
     */
    get db() { return this.#db; }
    /**
     * ユーザーデータ データベースリファレンスを取得
     */
    get dbRefPlayers() { return this.#dbRefPlayers; }
    /**
     * 対戦データ データベースリファレンスを取得
     */
    get dbRefTaisen() { return this.#dbRefTaisen; }
    /**
     * 選択手データ データベースリファレンスを取得
     */
    get dbRefChoice() { return this.#dbRefChoice; }
    /**
     * 状況データ データベースリファレンスを取得
     */
    get dbRefRounds() { return this.#dbRefRounds; }
    /**
     * 罰ゲームデータ データベースリファレンスを取得
     */
    get dbRefBatsuGame() { return this.#dbRefBatsuGame; }

    /**
     * 新しいユーザーを追加する。
     * @param {string} name 
     * @param {number} round 
     */
    addPlayer(name, round, originalKeyPlayer) {
        const newPostRef = push(this.dbRefPlayers);
        set(newPostRef, {
            name: name,
            round: round,
            originalKeyPlayer: originalKeyPlayer || newPostRef.key
        });
    }

    /**
     * データの初期化を行う
     */
    initialize() {
        // データベース 関連 オブジェクト
        this.#db = getDatabase(app);
        this.#dbRefPlayers = ref(this.db, "janken_players");
        this.#dbRefTaisen = ref(this.#db, "janken_taisen");
        this.#dbRefChoice = ref(this.#db, "janken_choice");
        this.#dbRefRounds = ref(this.#db, "janken_rounds/0");
        this.#round = 0;
        const newRound = {
            round: this.#round
        }
        set(this.#dbRefRounds, newRound);

        this.#dbRefBatsuGame = ref(this.#db, "janken_batsu_game");
    }

    /**
     * データを全て削除する。
     */
    removeAll() {
        remove(this.#dbRefChoice);
        remove(this.#dbRefRounds);
        remove(this.#dbRefTaisen);
        remove(this.#dbRefPlayers);
        remove(this.#dbRefBatsuGame);
    }

    /**
     * ラウンド別の進出ユーザー情報を取得する。
     * @param {number} roundNo 
     * @returns [{key, val()}] ユーザー情報の配列。0件の場合も配列を返却
     */
    getPlayers(roundNo) {
        return new Promise((resolve) => {
            onValue(this.dbRefPlayers, (snapshot) => {
                const ret = [];
                snapshot.forEach((childSnapshot) => {
                    if (childSnapshot.val().round == roundNo) {
                        ret.push(childSnapshot);
                    }
                });
                // 作成したユーザ配列で非同期処理を完了させる。
                resolve(ret);
            }, {
                onlyOnce: true
            });
        });
    }

    /**
     * 対戦を追加する。
     * @param {*} nameA 1人目のプレイヤー
     * @param {*} nameB 2人目のプレイヤー
     * @param {*} roundNo ラウンド数 
     */
    addTaisen(originalKeyPlayerA, namePlayerA, originalKeyPlayerB, namePlayerB, roundNo) {
        const newTaisenId = push(this.dbRefTaisen);
        const newTaisen = {
            originalKeyPlayerA: originalKeyPlayerA,
            namePlayerA: namePlayerA,
            originalKeyPlayerB: originalKeyPlayerB,
            namePlayerB: namePlayerB,
            keyWinnerPlayer: null,
            round: roundNo
        }
        set(newTaisenId, newTaisen);
    }

    /**
     * データ追加時のイベントを設定する。
     * @param {*} dbRef 監視対象のテーブル
     * @param {function} callBack イベントハンドラ
     */
    setOnChildAdded(dbRef, callBack) {
        onChildAdded(dbRef, callBack);
    }

    /**
     * データ変更時のイベントを設定する。
     * @param {*} dfRef 監視対象のテーブル
     * @param {function} callBack イベントハンドラ
     */
    setOnChildChanged(dfRef, callBack){
        onChildChanged(dfRef, callBack);
    }

    /**
     * 対戦データを更新する。
     * @param {*} keyTaisen 対戦データのキー
     * @param {*} toObj 更新内容
     */
    updateTaisen(keyTaisen, toObj) {
        const update_item = ref(this.db, "janken_taisen/" + keyTaisen);
        update(update_item, toObj)
    }

    addChoice(keyTaisen, turn, keyPlayer, name, choice, choiceVal, winVS) {
        const choiceObj = {
            keyTaisen: keyTaisen,
            turn: turn,
            keyPlayer: keyPlayer,
            name: name,
            choice: choice,
            choiceVal: choiceVal,
            winVS: winVS,
            result: null
        };
        const newChoiceRef = push(this.dbRefChoice);
        set(newChoiceRef, choiceObj);
    }

    /**
     * ラウンドを進める
     * 初期値は0
     */
    increaseRound(){
        update(this.dbRefRounds, { round: ++this.#round });
    }

    /**
     * 罰ゲームを更新する。updateイベントが拾いもれるケースがあったので、remove, setでaddで拾ってみる。
     * @param {string} batsuGame 罰ゲーム
     */
    replaceBatsuGame(batsuGame){
        remove(this.#dbRefBatsuGame);
        set(this.#dbRefBatsuGame, { batsuGame: batsuGame });
    }
}

// インポート先では単一のインスタンスが参照される。
// このことにより、シングルトンを実現する
export default new FirebaseMngr();