import './css/Header.css'

import logo from '../logo.svg';
import authMngr from '../js/AuthMngr';

export default function Header(props) {

    /**
     * サインアウトを実行
     * @param {Event} e 
     */
    const signOut = (e) => {
        e.preventDefault();
        authMngr.signOut();
    }

    return (
        <header>
            <div className='headerInnerWapper'>
                <div className='headerLogo'>
                    <img src={logo} className="App-logo" alt="logo" />
                </div>
                <div className='headerRight'>
                    <div className='textRight'>
                        Coding Sample&nbsp;&nbsp;
                        <a href="janken_tpl.html">コメント有</a>&nbsp;
                        <a href="janken_tpl_witout_comment.html">コメント無</a>
                        &nbsp;<span>pvp</span>
                        &nbsp;&nbsp;&nbsp;
                        <a
                            href="logout"
                            onClick={ (e) => signOut(e) }
                        >ログアウト</a>
                        <br />
                    </div>
                    <h1 className='textCenter'>じゃんけん&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</h1>
                </div>
            </div>
        </header>
    )
}