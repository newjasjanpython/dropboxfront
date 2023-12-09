import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(res.user, {
        displayName,
      });

      await setDoc(doc(db, 'users', res.user.uid), {
        uid: res.user.uid,
        displayName,
        email,
      });

      await setDoc(doc(db, 'userChats', res.user.uid), {});
      navigate('/');
    } catch (err) {
      console.error(err);
      setErr(true);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
      passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    }
  };

  return (
    <section>
      <div className="form-box card">
        <div className="form-value">
          <form onSubmit={handleSubmit}>
            <h2>Register</h2>
            <div className="inputbox">
              <ion-icon name="person"></ion-icon>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
              <label htmlFor="">Name</label>
            </div>
            <div className="inputbox">
              <ion-icon name="mail"></ion-icon>
              <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <label htmlFor="">Email</label>
            </div>
            <div className="inputbox">
              <ion-icon name="lock-closed" onClick={togglePasswordVisibility}></ion-icon>
              <input type="password" id="passwordInput" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <label htmlFor="">Password</label>
            </div>
            <button type="submit" disabled={loading}>
            {loading ? <span>Loading...</span> : <span>Register</span>}
             </button>

          </form>
          <div className="register">
            <p>
              Do you have an account? <a href="./login">Enter</a>
              <br/>
              { err }
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;


