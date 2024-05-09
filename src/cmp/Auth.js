import './css/Auth.css'

import React, { useEffect, useRef } from 'react';
import authMngr from '../js/AuthMngr';

export default function Auth(props) {
  const refCalled = useRef(false);

  useEffect(() => {
    // 2重実行されるケースが多発するため、フラグ管理して1回だけの実行に限定する。
    if(refCalled.current){ return; }
    refCalled.current = true;
    authMngr.signInWithPopup();
  });

  return (
    <div>Authorization needed</div>
  );
}
