
import { getAuth, auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from './firebase.js';

const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('login-password').value;
  loginUser(email, password);
});

function loginUser(email, password) {

  if (!email || !password) {
    displayAlertMessage('Email and password are required!', 'Ok');
    // console.log('email:'+ email,'password'+password);
    return;
  }
  const auth = getAuth();
  showSpinner();
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      // console.log("User logged in:",user);
      removeSpinner();
      displayAlertMessage('Welcome back! Loggedin sucessfully', 'ok')
      setTimeout(() => {
        window.location.href = '../index.html'
      }, 3000)
    })
    .catch((error) => {
      removeSpinner();
      const errorMessage = error.code === 'auth/user-not-found'
        ? 'No account found with this email.'
        : 'An error occurred. Please try again.';
      displayAlertMessage(errorMessage, 'Ok');
      console.error("Login error:", error.code, error.message);
    });
}

const registerForm = document.getElementById('register-form');
const formInputs = registerForm.querySelectorAll('.form-control');

registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = formInputs[0].value;
  const email = formInputs[1].value;
  const password = formInputs[2].value;
  registerUser(email, password, name);
});

// Function to sign up new users
async function registerUser(email, password, name) {
  if (!email || !password || !name) {
    displayAlertMessage('Email, password, and name are required!', 'Ok');
    return;
  }

  try {
    showSpinner();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: name });
    removeSpinner();
    displayAlertMessage('Registration Successful, Welcome!', 'Ok');
    setTimeout(() => {
      window.location.href = '../index.html';
    }, 3000);
  } catch (error) {
    removeSpinner();
    displayAlertMessage('Registration error: ' + error.message, 'Ok');
    console.error("Registration error:", error.message);
  }
}

// Firebase configuration and initialization
const provider = new GoogleAuthProvider();

// Function to sign in with Google
async function googleSignIn() {
  try {
    showSpinner();

    // Sign in with popup
    const result = await signInWithPopup(auth, provider);

    // The signed-in user info
    const user = result.user;
    console.log('User signed in with Google: ', user);

    if (user.displayName) {
      removeSpinner();
      displayAlertMessage('Welcome! Registration successful', 'OK')
      setTimeout(() => {
        window.location.href = '../index.html'
      }, 3000)
    } else {
      updateProfile(user, { displayName: 'Guest' })
        .then(() => {
          removeSpinner();
          displayAlertMessage('Welcome Guest', 'Ok');
        })
        .catch((error) => {
          removeSpinner();
          console.error("Error updating user profile:", error.message);
          displayAlertMessage('Error setting display name.', 'Ok');
        });
    }
    setTimeout(() => {
      window.open('../index.html', '_blank');
    }, 3000);

  } catch (error) {
    removeSpinner();
    console.error("Error during Google sign-in:", error.code, error.message);
    displayAlertMessage('Google login error: ' + error.message, 'Ok');
  }
}

document.getElementById('google-signin-btn').addEventListener('click', googleSignIn);

// Function to show spinner
function showSpinner() {
  const spinnerOverlay = document.createElement('div');
  spinnerOverlay.classList.add('spinner-overlay');
  spinnerOverlay.innerHTML = '<div class="loader"></div>';
  document.body.appendChild(spinnerOverlay);
}

// Function to remove spinner
function removeSpinner() {
  const spinnerOverlay = document.querySelector('.spinner-overlay');
  if (spinnerOverlay) {
    spinnerOverlay.remove();
  }
}

//display modal message
let modalContainer = document.getElementById('modal-container');
const modalActionBtn = document.getElementById('modal-action-btn');
function displayAlertMessage(msg, action) {
  modalContainer.classList.remove('out');
  modalContainer.classList.add('two');
  document.getElementById('modal-msg').innerHTML = msg;
  modalActionBtn.innerHTML = action;

}
//to close the modal
function closeModal() {

  document.getElementById('modal-action-btn').addEventListener('click', () => {
    modalContainer.classList.add('out');
    setTimeout(() => {
      modalContainer.classList.remove('two');
    }, 1000)
  })
}
closeModal();


const registerWrapper = document.getElementById('register-wrapper');
const loginWrapper = document.getElementById('login-wrapper');
const registerLinkBtn = document.getElementById('register-link');
const loginLinkBtn = document.getElementById('login-link');

// Toggle between login and register views
registerLinkBtn.onclick = () => {
  loginWrapper.classList.add('hide');
  registerWrapper.classList.remove('hide');
};

loginLinkBtn.onclick = () => {
  registerWrapper.classList.add('hide');
  loginWrapper.classList.remove('hide');
};

//password visibility toggle

document.querySelectorAll('#slash_eye').forEach((eyeSlashIcon) => {
  const parent = eyeSlashIcon.parentElement;
  const eyeVisibleIcon = parent.querySelector('#slash_eye-visible');
  const passwordInput = parent.querySelector('.password');

  eyeSlashIcon.addEventListener('click', () => {
    passwordInput.type = 'text';
    eyeSlashIcon.style.display = 'none';
    eyeVisibleIcon.style.display = 'inline';
  });

  eyeVisibleIcon.addEventListener('click', () => {
    passwordInput.type = 'password';
    eyeVisibleIcon.style.display = 'none';
    eyeSlashIcon.style.display = ' block';
  });
});