import app from './mdl/firebaseAppIns';
import * as at from 'firebase/auth';

/**
 * ユーザー認証を管理するクラス
 */
class AuthMngr {
    #auth;
    #onAuthLoggedIn = [];
    #onAuthLoggedOut = [];
    #isLoggedIn = false;
    #provider;
    #user;
    #additionalUserInfo;
    #attachedLoginState = false;

    /**
     * コンストラクタ、ネイティブonAuthをハンドルするイベントハンドラを設定する。
     */
    constructor() {
        console.log('AuthMngr: constructor()');
        // 本来はappの引数は不要。未使用lintErrorになる。firebaseの初期化処理はしておきたいので、importは入れておく。
        this.#auth = at.getAuth(app);
    }

    /**
     * ログイン状態の変更にアタッチする。状態の変更はonAutuLoggedIn/Outで監視する。
     */
    attachLoginState() {
        console.log('AuthMngr: attachLoginState()');

        // すでにアタッチ処理が終わっている場合は、処理を終了する。
        if (this.#attachedLoginState) { return; }
        this.#attachedLoginState = true;

        at.onAuthStateChanged(this.#auth, (user) => {
            if (user) {
                console.log('AuthMngr: onAuthStateChanged: Logged In: ' + user.displayName);
                this.#user = user;
                // ログイン直後ではないため、additionalUserInfoは同じ値化を保証できない為、nullクリアする。
                this.#additionalUserInfo = null;
                this.#isLoggedIn = true;
                this.#onAuthLoggedIn.forEach((v) => {
                    v(this.user, this.additionalUserInfo);
                });
            } else {
                console.log('AuthMngr: onAuthStateChanged: Logged out: ' + (this.user ? this.user.displayName : 'no name'));
                this.#isLoggedIn = false;
                this.#user = null;
                this.#additionalUserInfo = null;
                this.#onAuthLoggedOut.forEach((v) => {
                    v();
                });
            }
        });
    }

    /**
     * 現在ログインしているかを返却する
     * @returns {boolean} ログインしている場合true
     */
    get isLoggedIn() {
        return this.#isLoggedIn;
    }

    /**
     * ログインしているユーザー情報を返却
     */
    get user() {
        return this.#user;
    }

    /**
     * ログインしているユーザーの追加情報を返却
     */
    get additionalUserInfo() {
        return this.#additionalUserInfo;
    }

    /**
     * ポップアップでユーザー認証を行う。
     */
    signInWithPopup() {
        this.#provider = new at.GoogleAuthProvider();
        this.#provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
        at.signInWithPopup(this.#auth, this.#provider).then((result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            // const credential = at.GoogleAuthProvider.credentialFromResult(result);
            // const token = credential.accessToken;
            // The signed-in user info.
            this.#user = result.user;
            this.#additionalUserInfo = at.getAdditionalUserInfo(result);
            this.#isLoggedIn = true;

            console.log('signInWithPopup: Logged In: ' + this.#user.displayName);

            // ログイン時のイベントハンドラを実行する。
            this.#onAuthLoggedIn.forEach((v) => {
                v(this.#user, this.#additionalUserInfo);
            });
        }).catch((error) => {
            console.log('signInWithPopup: Login Failed: ' + error.message);
            // // Handle Errors here.
            // const errorCode = error.code;
            // const errorMessage = error.message;
            // // The email of the user's account used.
            // const email = error.customData.email;
            // // The AuthCredential type that was used.
            // const credential = GoogleAuthProvider.credentialFromError(error);
            // // ...
            // throw new Error('認証エラー:' + error.message);
        });
    }

    /**
     * サインアウトを実行する。エラー発生時もコンソール出漁のみ
     */
    signOut() {
        at.signOut(this.#auth).then(() => {
            console.log('AuthMngr: signOut: succeeded: ' + this.user ? this.user.displayName : '');
        }).catch((error) => {
            console.log('AuthMngr: signOut: failed=' + error.message);
        });
    }

    /**
     * ログイン時のイベントハンドラを登録する。
     * @param {function} func ログイン時に実行される。
     */
    addOnAuthLoggedIn(func) {
        this.#onAuthLoggedIn.push(func);
    }
    /**
     * ログアウト時のイベントハンドラを登録する。
     * @param {function} func ログアウト時に実行される
     */
    addOnAuthLoggedOut(func) {
        this.#onAuthLoggedOut.push(func);
    }
}

const _ins = new AuthMngr();
export default _ins;