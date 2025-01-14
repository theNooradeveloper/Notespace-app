import { getAuth, auth, signOut, db, doc, setDoc, updateDoc, deleteDoc, collection, getDocs } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

const welcomeMsg = document.getElementById('welcome-msg');
const loginNow = document.getElementById('login-now');
const guestProfile = document.getElementById('guest-profile');
//all DOM elements are available inside onAuthStateChanged
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is signed in:", user);
            // welcomeMsg.style.display = 'block';
            let welcomeUsername = welcomeMsg.querySelector('#welcome-username');
            let popupUsername = document.getElementById('popup-username');
            let popupUseremail = document.getElementById('popup-useremail');
            let username = user.displayName;
            let useremail = user.email;
            welcomeUsername.innerText = username;
            popupUsername.innerText = username;
            popupUseremail.innerText = useremail;
            loginNow.classList.add('hide')
            guestProfile.classList.add('show')
            console.log(user.displayName, user.email);
            // Call loadUserNotes to fetch and display notes for the logged-in user
            loadUserNotes();

        } else {
            console.log("No user signed in");
        }
    });

})

let notesContainer = document.getElementsByClassName('notes-container')[0];
let overlayContainer = document.querySelector('.overlay')
let newNoteBtns = document.querySelectorAll('.create-new-note')
let createNoteBtn = document.querySelector('.create-btn #create-note')
const textArea = document.querySelector('.textarea');
const imageIcon = document.getElementById('image-icon');
let setSelectedImage = document.querySelector('.user-selected-image');
let noteToEdit = null;


newNoteBtns.forEach((newNoteBtn) => {
    //overlay block displaying on new note button click
    newNoteBtn.addEventListener('click', () => {
        if (!auth.currentUser) {
            displayAlertMessage('Login to create Notes.', 'LogIn')
            return;
        }
        textArea.innerHTML = ''
        textArea.style.background = ''
        overlayContainer.style.display = 'flex';
        createNoteBtn.disabled = true
        document.querySelector('.date_icon .date').innerHTML = new Date().toLocaleDateString()

    })
})

//to close the note
const closeNoteBtn = document.querySelector('#close-note');
closeNoteBtn.addEventListener('click', () => {
    overlayContainer.style.display = 'none'
})

//main logic
function formatText(command, defaultUi, value) {
    document.execCommand(command, defaultUi, value)
}

//basic operations 
const optionButton = document.querySelectorAll('.option-button');
optionButton.forEach((button) => {
    button.addEventListener('click', () => {
        formatText(button.id, false, null)
    })
})

//available font lists
let fontLists = [
    "Arial",
    "Verdana",
    "Times New Roman",
    "Garamond",
    "Georgia",
    "Courier New",
    "cursive",
];
//to generate font option list
fontLists.map((font) => {
    let option = document.createElement('option');
    option.value = font;
    option.innerHTML = font;
    document.getElementById('fontName').appendChild(option)

})

//to generate font size lists
for (let i = 1; i <= 8; i++) {
    let option = document.createElement('option');
    option.value = i;
    option.innerHTML = i;
    document.getElementById('fontSize').appendChild(option)
}


//advanced operations which requires values
const advOptionButton = document.querySelectorAll('.adv-option-button');
advOptionButton.forEach((button) => {
    button.addEventListener('input', () => {
        formatText(button.id, false, button.value)
    })
})

//function for background color change
const bgSelectContainer = document.querySelectorAll('.bg-select-container span')
bgSelectContainer.forEach((background, index) => {
    background.addEventListener('click', (e) => {
        changeBackground(index, e);
    })
})

//function to change the background
function changeBackground(index, e) {
    if (index === 0) {
        textArea.style.cssText = "background-color: #efdcc8; background-image: repeating-linear-gradient(to right, #ccc, #ccc 1px, transparent 1px, transparent 20px), repeating-linear-gradient(to bottom, #ccc, #ccc 1px, transparent 1px, transparent 20px);";

    }
    else if (index === 1) {
        textArea.style.cssText = "background: radial-gradient(circle, #ffa69e 1px, transparent 1px), repeating-linear-gradient(to bottom, #ffffff, #ffffff 20px, transparent 20px), repeating-linear-gradient(to right, #ffffff, #ffffff 20px, transparent 20px); background-size: 20px 20px;";

    }
    else if (index === 2) {
        textArea.style.cssText = `background-image: linear-gradient(to right, rgb(182 173 173) 1px, transparent 1px), linear-gradient(rgb(171 156 156) 1px, transparent 1px);
background-size: 20px 20px;
background-position: 0% 0%;
background-color: #faf8f8;`;
    }
    else if (index === 3) {
        textArea.style.background = ''
        let colorPicker = e.target;
        colorPicker.addEventListener('input', (e) => {
            let color = e.target.value;
            textArea.style.backgroundColor = color;
            textArea.style.backgroundImage = 'unset';
        })
        // colorPicker.click()
    }
}

//to remove the red border
textArea.addEventListener('input', () => {
    //if the user clears after typing
    createNoteBtn.disabled = false
    if (textArea.innerText.trim() !== '')
        textArea.style.border = '1px solid black';
    else textArea.style.border = '2px solid red';
})

// Function to create or update note in Firestore
async function createOrUpdateNote() {
    if (textArea.innerHTML.trim() === '' || textArea.innerText.trim() === '') {
        textArea.style.border = '2px solid red';
        alert('Cannot create an empty note. Please add some content');
        return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
        alert('You need to log in to create or save notes.');
        return;
    }

    const userId = currentUser.uid;
    const notesRef = collection(db, 'users', userId, 'notes'); // Sub-collection for the user's notes

    const selectedBackground = textArea.style.cssText;
    const currentDate = new Date().toLocaleDateString();
    const noteText = textArea.innerHTML;

    if (noteToEdit) {
        // Update an existing note
        const noteId = noteToEdit.dataset.id;
        const noteDocRef = doc(notesRef, noteId);

        await updateDoc(noteDocRef, {
            text: noteText,
            style: selectedBackground,
            date: currentDate,
        });

        // Update the DOM
        noteToEdit.querySelector('.user-text').innerHTML = noteText;
        noteToEdit.style.cssText = selectedBackground;
        noteToEdit.querySelector('.date').innerText = currentDate;

        noteToEdit = null;
        createNoteBtn.innerText = 'Create Note';
        overlayContainer.style.display = 'none';
        return;
    }

    // Create a new note
    const newNoteRef = doc(notesRef);
    const noteData = {
        notesID: newNoteRef.id,
        text: noteText,
        style: selectedBackground,
        date: currentDate,
    };

    try {
        await setDoc(newNoteRef, noteData);
        console.log('Note saved successfully');
    } catch (error) {
        console.error('Error saving note:', error);
        alert('Failed to save note. Please try again.');
    }

    // Add the new note to the DOM
    let subContainer = document.createElement('div');
    subContainer.classList.add('sub-container');
    subContainer.innerHTML = `<section class="final-notes-container" tabindex="1" style='${selectedBackground}' data-id="${noteData.id}">
        <div class="user-text">${noteText}</div>
        <div class="date_icon">
            <div class="date">${currentDate}</div>
            <div class="icons">
                <button id="bookmark-note" title='Bookmark'><i class="fa-regular fa-bookmark"></i></button>
                <button id="edit-note" title='Edit'><i class="fa-regular fa-pen-to-square"></i></button>
                <button id="delete-note" title='Delete'><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    </section>`;

    notesContainer.appendChild(subContainer);
    let currentNote = subContainer.querySelector('.final-notes-container');
    subContainer.addEventListener('click', (e) => {
        editDeleteBookmarkNote(e, currentNote);
    });
    overlayContainer.style.display = 'none';
}


//function to edit ,delete and bookmark note
// function editDeleteBookmarkNote(event, currentNote) {
//     if (event.target.closest('#delete-note')) {
//         currentNote.parentNode.remove();
//     }
//     if (event.target.closest('#edit-note')) {
//         overlayContainer.style.display = 'flex';
//         textArea.innerHTML = currentNote.querySelector('.user-text').innerHTML;
//         textArea.style.cssText = currentNote.style.cssText;
//         // Set the noteToEdit reference so we can update it later
//         noteToEdit = currentNote;
//         createNoteBtn.innerText = 'Save Note';
//     }
//     if (event.target.closest('#bookmark-note')) {
//         let bookmarkNoteBtn = currentNote.querySelector('#bookmark-note');
//         bookmarkNoteBtn.querySelector('i').classList.toggle('bookmarked');
//     }
// }

async function editDeleteBookmarkNote(event, currentNote) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userId = currentUser.uid;
    const notesRef = collection(db, 'users', userId, 'notes');

    try {
        if (event.target.closest('#delete-note')) {
            const noteId = currentNote.dataset.id;
            const noteDocRef = doc(notesRef, noteId);

            await deleteDoc(noteDocRef);
            currentNote.parentNode.remove();
            console.log('Note deleted successfully.');
        }

        if (event.target.closest('#edit-note')) {
            overlayContainer.style.display = 'flex';
            textArea.innerHTML = currentNote.querySelector('.user-text').innerHTML;
            textArea.style.cssText = currentNote.style.cssText;
            noteToEdit = currentNote; // Save reference to the note being edited
            createNoteBtn.innerText = 'Save Note';
        }

        if (event.target.closest('#bookmark-note')) {
            const noteId = currentNote.dataset.id;
            const noteDocRef = doc(notesRef, noteId);

            // Locate the <i> icon, even if the user clicks on the button
            const bookmarkButton = event.target.closest('#bookmark-note');
            const bookmarkIcon = bookmarkButton.querySelector('i');

            const isCurrentlyBookmarked = bookmarkIcon.classList.contains('bookmarked');
            const newBookmarkState = !isCurrentlyBookmarked;

            await updateDoc(noteDocRef, {
                isBookmarked: newBookmarkState,
            });

            if (newBookmarkState) {
                bookmarkIcon.classList.add('bookmarked');
            } else {
                bookmarkIcon.classList.remove('bookmarked');
            }
        }
    } catch (error) {
        console.error('Error handling note action:', error.code, error.message);
        alert('Something went wrong. Please try again.');
    }
}


//upload image
imageIcon.addEventListener('click', () => {
    uploadImage();

})
//function to upload the image
function uploadImage() {
    const imageUpload = document.getElementById('insert-image');
    imageUpload.click();
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0]
        if (file) {
            //read the content's of file stored on the user's comp
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log(e.target.result);

                const image = document.createElement('img')
                image.src = e.target.result;
                image.classList.add('image');
                image.style.maxWidth = '100%';
                image.style.maxHeight = '100px';
                image.style.cursor = 'pointer';
                image.title = 'Double click to delete';
                image.contentEditable = true
                textArea.appendChild(image);
                imageUpload.value = ''
                //to delete the image
                image.addEventListener('dblclick', () => {
                    image.remove();
                })
            }
            reader.readAsDataURL(file);
        }
    })
}

//toggle user profile list images
let profileIcon = document.getElementById('user-edit-icon');
profileIcon.addEventListener('click', () => {
    let profileList = document.querySelector('.profile-lists');
    profileList.classList.toggle('show-profile-lists');
})

//clicking on profile images to change profile
let profileListImages = document.querySelectorAll('.profile-list-images')
profileListImages.forEach((image) => {
    image.addEventListener('click', (e) => {
        let selectedImage = e.target;
        setSelectedImage.src = selectedImage.src;
        changeMainProfileImage(setSelectedImage.src)
    })
})
//upload profile image from folder
let uploadProfileImageIcon = document.getElementById('upload-profileimage');
let selectFromFolder = document.querySelector('.select-from-folder')
uploadProfileImageIcon.addEventListener('click', () => {
    selectFromFolder.click();
})


selectFromFolder.addEventListener('change', (e) => {
    const file = e.target.files[0]
    if (file) {
        //read the content's of file stored on the user's comp
        const reader = new FileReader();
        reader.onload = (e) => {
            const profileImage = document.createElement('img')
            profileImage.src = e.target.result;
            profileImage.classList.add('profile-list-images');
            setSelectedImage.src = profileImage.src
            selectFromFolder.value = ''
            changeMainProfileImage(setSelectedImage.src)
        }
        reader.readAsDataURL(file);
    }

})
//function to change the main profile image
function changeMainProfileImage(src) {
    let setImage = document.querySelector('.main-profile-image')
    setImage.src = src;
}
//show the profile popup on clicking profile icon

guestProfile.addEventListener('click', () => {
    document.querySelector('.profile-popup').classList.toggle('show-profile-popup')
})



//adding active class to sidebar btn
let sidebarBtns = document.querySelectorAll('.sidebar-btn');
sidebarBtns[0].classList.add('active-sidebar-btn'); //default active btn
sidebarBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
        addActiveClass(e)
    })
})
//function to add active class to clicked sidebar btn
function addActiveClass(e) {
    const target = e.target;
    if (target.classList.contains('active-sidebar-btn'))
        target.classList.remove('active-sidebar-btn')
    else {
        sidebarBtns.forEach((btn) => {
            btn.classList.remove('active-sidebar-btn')
            target.classList.add('active-sidebar-btn')
        })
    }
}

createNoteBtn.addEventListener('click', createOrUpdateNote)

//function to search the note on enter press
function searchNotesOnKeyup() {
    let userInput = document.getElementById('userinput');
    userInput.addEventListener('keyup', (e) => {
        // if (e.key === 'Enter') {
        let searchQuery = e.target.value.trim();
        if (searchQuery == '') resetNotesView()
        else searchNotesByDateOrKeyword(searchQuery)

    })
}

//searching by date or keyword
function searchNotesByDateOrKeyword(searchQuery) {
    const notes = document.querySelectorAll('.sub-container');
    let heroSection = document.querySelector('.hero-section');
    let notesContainer = document.querySelector('.notes-container');
    let notesFound = false;
    notes.forEach((note) => {
        const createdDate = note.querySelector('.date_icon .date')?.innerText.trim();
        const noteTextElement = note.querySelector('.user-text')
        let noteText = noteTextElement.textContent.trim();
        if (createdDate === searchQuery || noteText.includes(searchQuery)) {
            console.log('match found', note);
            highlightText(noteTextElement, searchQuery)
            note.style.display = 'flex';
            notesFound = true
        }
        else {
            console.log('match not found', note);
            note.style.display = 'none';
        }
    })
    if (notesFound) {
        heroSection.style.display = 'none'; //hide the hero section if any notes are found
        notesContainer.querySelector('.no-results')?.remove(); //if it exists then remove
    }
    else {
        console.log('No matches are found');
        if (!notesContainer.querySelector('.no-results')) {
            heroSection.style.display = 'none';
            let noResultsMessage = document.createElement('div');
            noResultsMessage.className = 'no-results';
            noResultsMessage.textContent = 'No matches are found';
            notesContainer.appendChild(noResultsMessage);
        }
        // heroSection.style.display = 'grid';
    }

}

//fuunction to reset note view if searchQuery is empty 
function resetNotesView() {
    const notes = document.querySelectorAll('.sub-container');
    let heroSection = document.querySelector('.hero-section');
    let noResults = document.querySelector('.no-results')
    notes.forEach((note) => {
        note.style.display = 'flex'
    })
    if (noResults) noResults.remove();
    heroSection.style.display = 'grid';
}


searchNotesOnKeyup()

// //function to highlight the search text
function highlightText(element, searchQuery) {
    const regex = new RegExp(`(${searchQuery})`, 'gi'); // Create a case-insensitive regex to match the search query
    const originalText = element.textContent;
    const highlightedText = originalText.replace(regex, `<span class="highlight">$1</span>`); // Wrap matches in a span with the 'highlight' class
    element.innerHTML = highlightedText;
}


//navigating to pages on clicking on sidebar buttons
const dashboardBtn = document.getElementById('dashboard');
dashboardBtn.addEventListener('click', () => {
    window.location.href = 'index.html'
})

const allNotesBtn = document.getElementById('all-notes');
const heroSection = document.querySelector('.hero-section');
const dashboardTitle = document.getElementById('dashboard-title');
let subContainer = document.querySelectorAll('.sub-container');
const bookmarkBtn = document.getElementById('bookmarked-btn');

//to show all notes on btn click
allNotesBtn.addEventListener('click', showAllNotes);
//to show all bookmarked notes
bookmarkBtn.addEventListener('click', showBookmarkedNotes);



//display modal message
function showAllNotes() {
    let subContainer = document.querySelectorAll('.sub-container');
    let notesContainer = document.querySelector('.notes-container');
    let notesPresent = subContainer.length > 0;
    if (!auth.currentUser) {
        displayAlertMessage('Login to access your Notes.', 'LogIn')
        return;
    }
    // Hide welcome message and hero section
    welcomeMsg.classList.add('hide');
    heroSection.classList.add('hide');
    dashboardTitle.innerText = 'All Notes';

    // Remove any existing "no results" message
    let noResultsMessage = notesContainer.querySelector('.no-results');
    if (noResultsMessage) noResultsMessage.remove();

    // Show all notes or display "no notes available" message
    if (notesPresent) {
        let noResultsmsg = notesContainer.querySelector('.no-results');
        if (noResultsmsg) noResultsmsg.remove();
        subContainer.forEach((container) => {
            container.style.display = 'flex';
        });
    } else {
        let noResults = document.createElement('div');
        noResults.className = 'no-results no-notes';
        noResults.textContent = 'No notes available';
        notesContainer.appendChild(noResults);
    }
}


function showBookmarkedNotes() {
    let subContainer = document.querySelectorAll('.sub-container');
    let notesContainer = document.querySelector('.notes-container');
    if (!auth.currentUser) {
        displayAlertMessage('Login to access Bookmarked Notes.', 'LogIn')
        return;
    }
    // Hide welcome message and hero section
    welcomeMsg.classList.add('hide');
    heroSection.classList.add('hide');
    dashboardTitle.innerText = 'Bookmarked';

    // Remove any existing "no results" message
    let noResultsMessage = notesContainer.querySelector('.no-results');
    if (noResultsMessage) noResultsMessage.remove();

    let hasBookmarks = false;

    // Iterate through all note containers
    subContainer.forEach((container) => {
        let bookmarkIcon = container.querySelector('.final-notes-container #bookmark-note i');
        if (bookmarkIcon && bookmarkIcon.classList.contains('bookmarked')) {
            container.style.display = 'flex';
            hasBookmarks = true;
        } else {
            container.style.display = 'none';
        }
    });

    // If no bookmarks, display "no bookmarked notes" message
    if (!hasBookmarks) {
        let noBookmarks = document.createElement('div');
        noBookmarks.className = 'no-results no-bookmarks';
        noBookmarks.textContent = 'No bookmarked notes available';
        notesContainer.appendChild(noBookmarks);
    }
}


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

    document.getElementById('close-modal').addEventListener('click', () => {
        modalContainer.classList.add('out');
        setTimeout(() => {
            modalContainer.classList.remove('two');
        }, 1000)
    })
}
closeModal();

//direct to login page
modalActionBtn.onclick = () => {
    window.open('form.html', '_blank')
}
loginNow.onclick = () => {
    window.open('form.html', '_blank')
}


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

const logoutButton = document.getElementById('logout');
if (logoutButton) {
    logoutButton.addEventListener('click', logoutUser);
}
// Logout function
function logoutUser() {
    const auth = getAuth();
    showSpinner()
    signOut(auth)
        .then(() => {
            console.log("User logged out successfully.");
            removeSpinner()
            displayAlertMessage('User logged out successfully.', 'OK');
            setTimeout(() => {
                window.location.href = 'form.html'
            }, 3000)
        })
        .catch((error) => {
            displayAlertMessage(error.code, 'OK');
            console.error("Error logging out:", error.message);

        });
}


async function loadUserNotes() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userId = currentUser.uid;
    const notesRef = collection(db, 'users', userId, 'notes');

    try {
        const querySnapshot = await getDocs(notesRef);

        querySnapshot.forEach((doc) => {
            const noteData = doc.data();
            const isBookmarked = noteData.isBookmarked || false;
            const bookmarkClass = isBookmarked ? 'bookmarked' : '';

            let subContainer = document.createElement('div');
            subContainer.classList.add('sub-container');
            subContainer.innerHTML = `<section class="final-notes-container" tabindex="1" style='${noteData.style}' data-id="${doc.id}">
                <div class="user-text">${noteData.text}</div>
                <div class="date_icon">
                    <div class="date">${noteData.date}</div>
                    <div class="icons">
                        <button id="bookmark-note" title='Bookmark'><i class="fa-regular fa-bookmark ${bookmarkClass}"></i></button>
                        <button id="edit-note" title='Edit'><i class="fa-regular fa-pen-to-square"></i></button>
                        <button id="delete-note" title='Delete'><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            </section>`;

            notesContainer.appendChild(subContainer);
            let currentNote = subContainer.querySelector('.final-notes-container');
            subContainer.addEventListener('click', (e) => {
                editDeleteBookmarkNote(e, currentNote);
            });
        });
    } catch (error) {
        console.error('Error loading notes:', error);
        alert('Failed to load notes. Please try again.');
    }
}




