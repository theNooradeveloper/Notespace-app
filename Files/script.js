import { getAuth, auth, signOut, db, doc, setDoc, updateDoc, deleteDoc, collection, getDocs } from '../Files/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

const welcomeMsg = document.getElementById('welcome-msg');
const loginNow = document.getElementById('login-now');
const guestProfile = document.getElementById('guest-profile');
let allTodo = [];
//all DOM elements are available inside onAuthStateChanged
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is signed in:");
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
            loadTODO().then((todos) => {
                allTodo = todos;
                updateTodoList();
            });
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

function openOverlay() {
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
}
openOverlay();

//create canvas btn
let createCanvasBtns = document.querySelectorAll('.create-canvas-btn')
createCanvasBtns.forEach((createCanvasBtn) => {
    createCanvasBtn.addEventListener('click', () => {
        if (!auth.currentUser) {
            displayAlertMessage('Login to to create Canvas.', 'LogIn')
            return;
        }
        window.location.href = 'Files/canvas.html'
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
    }
}

//to remove the red border
textArea.addEventListener('input', () => {
    createNoteBtn.disabled = false
    if (textArea.innerText.trim() !== '')
        textArea.style.border = '';
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
        //resets to null to update note is no longer being updated
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
        displayAlertMessage('Failed to save note. Please try again.', 'OK');
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
    textArea.style.border = '';
}


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
            // const noteDocRef = doc(notesRef, noteId);
            const noteDocRef = doc(db, 'users', userId, 'notes', noteId);
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
        displayAlertMessage('Something went wrong. Please try again.', 'OK');
    }
}


//upload image
imageIcon.addEventListener('click', () => {
    uploadImage();

})
//function to upload the image
function uploadImage() {
    //retrieves the file input ele
    const imageUpload = document.getElementById('insert-image');
    imageUpload.click();
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0]
        if (file) {
            //read the content's of file stored on the user's comp
            const reader = new FileReader();
            //triggered when the file has been successfully read
            reader.onload = (e) => {
                // console.log(e.target.result);
                const image = document.createElement('img')
                image.src = e.target.result; //the result of reading the file
                image.classList.add('image');
                image.style.maxWidth = '100%';
                image.style.maxHeight = '100px';
                image.style.cursor = 'pointer';
                image.title = 'Double click to delete';
                textArea.appendChild(image);
                imageUpload.value = ''
                //to delete the image
                image.addEventListener('dblclick', () => {
                    image.remove();
                })
            }
            //to show on the browser
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

createNoteBtn.addEventListener('click', createOrUpdateNote);

//keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey) {
        //save note
        if (e.key === 's') {
            e.preventDefault();
            createOrUpdateNote();
        }
        //create new note
        else if (e.key.toLowerCase() === 'm') {
            e.preventDefault();
            openOverlay();
        }
    }
}, true)

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
            // console.log('match found', note);
            // highlightText(noteTextElement, searchQuery)
            note.style.display = 'flex';
            notesFound = true
        }
        else {
            // console.log('match not found', note);
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
// function highlightText(element, searchQuery) {
//     const regex = new RegExp(`(${searchQuery})`, 'gi'); // Create a case-insensitive regex to match the search query
//     const originalText = element.textContent;
//     const highlightedText = originalText.replace(regex, `<span class="highlight">$1</span>`); // Wrap matches in a span with the 'highlight' class
//     element.innerHTML = highlightedText;
// }


//navigating to pages on clicking on sidebar buttons
const dashboardBtn = document.getElementById('dashboard');
dashboardBtn.addEventListener('click', () => {
    window.location.href = 'index.html'
})

const allNotesBtn = document.getElementById('all-notes');
const heroSection = document.querySelector('.hero-section');
const dashboardTitle = document.getElementById('dashboard-title');
const bookmarkBtn = document.getElementById('bookmarked-btn');
const todoBtn = document.getElementById('create-todo-btn')

//to show all notes on btn click
allNotesBtn.addEventListener('click', showAllNotes);
//to show all bookmarked notes
bookmarkBtn.addEventListener('click', showBookmarkedNotes);
//to show todo section
todoBtn.addEventListener('click', showTodo);



//display modal message
function showAllNotes() {
    let subContainer = document.querySelectorAll('.sub-container');
    let notesContainer = document.querySelector('.notes-container');


    let todoSection = document.querySelector('.todo-section')
    if (todoSection) todoSection.style.display = 'none';
    notesContainer.classList.remove('hide');
    document.body.classList.add('bg')
    document.querySelector('.main-container').style.backgroundImage = "unset"
    document.querySelector('.search-and-profile').style.display = 'flex'


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

//show bookmarked notes
function showBookmarkedNotes() {
    let subContainer = document.querySelectorAll('.sub-container');
    let notesContainer = document.querySelector('.notes-container');
    let todoSection = document.querySelector('.todo-section')
    if (todoSection) todoSection.style.display = 'none';
    notesContainer.classList.remove('hide');
    document.body.classList.add('bg')
    document.querySelector('.main-container').style.backgroundImage = "unset"
    document.querySelector('.search-and-profile').style.display = 'flex'
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

//show todo page
function showTodo() {

    let notesContainer = document.querySelector('.notes-container');
    if (!auth.currentUser) {
        displayAlertMessage('Login to create Todo lists.', 'LogIn')
        return;
    }
    // Hide welcome message and hero section
    welcomeMsg.classList.add('hide');
    heroSection.classList.add('hide');
    notesContainer.classList.add('hide');
    document.body.style.backgroundImage = 'unset'
    document.querySelector('.main-container').style.backgroundImage = "url('https://excalidraw.nyc3.cdn.digitaloceanspaces.com/lp-cms/media/home-hero.svg')"
    dashboardTitle.innerText = '~Todo lists~';
    document.querySelector('.search-and-profile').style.display = 'none'
    let todoSection = document.querySelector('.todo-section')
    todoSection.style.display = 'block';

}

let todoAddButton = document.getElementById('todo-add-button')
let input = document.getElementById('todo-text-box')
let todoUL = document.querySelector('#todoList')


todoAddButton.addEventListener('click', (e) => {
    e.preventDefault();
    addTodo();
})

async function addTodo() {
    let todoText = input.value.trim();
    if (todoText.length > 0) {
        const currentUser = auth.currentUser;
        if (!currentUser) return; // Ensure user is logged in

        const userId = currentUser.uid;
        const todosRef = collection(db, 'users', userId, 'todos');

        const newTodoRef = doc(todosRef); // Create a new document reference

        const todoData = {
            id: newTodoRef.id,
            text: todoText,
            completed: false,
        };
        showLoader();
        try {
            await setDoc(newTodoRef, todoData);
            allTodo.push(todoData);
            updateTodoList();
            input.value = '';
        } catch (error) {
            console.error('Error adding to-do:', error);
            alert('Failed to add the task. Please try again.');
        } finally {
            removeLoader();
        }
    }
}
//function to update todo for every change in todo list
async function updateTodoList() {
    todoUL.innerHTML = ''; // Clear existing list in the DOM

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userId = currentUser.uid;
    const todosRef = collection(db, 'users', userId, 'todos');

    try {
        const querySnapshot = await getDocs(todosRef);
        allTodo = []; // Reset `allTodo`
        querySnapshot.forEach((doc) => {
            const todo = { ...doc.data(), id: doc.id };
            allTodo.push(todo); // Populate the array
            createTodo(todo, doc.id); // Render the todo in the DOM

        });
    } catch (error) {
        console.error('Error fetching todos:', error);
    }
}
//function to create todo item
async function createTodo(todo, todoId) { // Use Firestore document ID
    let todoLI = document.createElement('li');
    todoLI.classList.add('todo', 'draggable_ele');
    todoLI.draggable = 'true';
    // Add drag events to the new to-do
    addDragEvents(todoLI);
    if (todo.completed) todoLI.classList.add('completed'); // Apply completed class for completed tasks
    let todoID = 'todo-' + todoId;
    todoLI.innerHTML = `
        <input type="checkbox" name="checkbox" id="${todoID}">
        <label for="${todoID}" class="custom-checkbox" title="Tick task as completed">
            <svg fill="transparent" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
                <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q65 0 123 19t107 53l-58 59q-38-24-81-37.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-18-2-36t-6-35l65-65q11 32 17 66t6 70q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-56-216L254-466l56-56 114 114 400-401 56 56-456 457Z"/>
            </svg>
        </label>
        <label for="${todoID}" class="todoText">${todo.text}</label>
        <button class="delete-btn" title="Delete task">
            <svg fill="rgb(97, 96, 96)" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
                <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
            </svg>
        </button>`;
    todoUL.appendChild(todoLI);

    // Handle checkbox state change
    checkboxChange(todoLI, todoId);

    // Handle delete action
    deleteTODO(todoLI, todoId);

    // Set checkbox checked state
    let checkbox = todoLI.querySelector('input[type="checkbox"]');
    checkbox.checked = todo.completed;

    // Enable editing of the todo
    makeEditable(todoLI, todoId);
}
//function to make todo editable

function makeEditable(todoLI, todoId) { // Use Firestore doc ID instead of array index
    let todoTextLabel = todoLI.querySelector('.todoText');

    todoTextLabel.addEventListener('dblclick', () => {
        let currentText = todoTextLabel.textContent;
        let input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.className = 'editInput';

        // Replace label with input
        todoTextLabel.replaceWith(input);

        // Save the edited text
        // Save Edit on Enter or Blur
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveEdit(input, todoTextLabel, todoId);
        });
        input.addEventListener('blur', () => saveEdit(input, todoTextLabel, todoId));
    });

}
// Function to save the edited text
async function saveEdit(input, todoTextLabel, todoId) {
    const updatedText = input.value.trim();
    if (updatedText.length > 0 && auth.currentUser) {
        const userId = auth.currentUser.uid;
        const todoDocRef = doc(db, 'users', userId, 'todos', todoId);

        try {
            // Save the updated text to Firestore
            await updateDoc(todoDocRef, { text: updatedText });
            todoTextLabel.textContent = updatedText;
            input.replaceWith(todoTextLabel);
            // Update the local `allTodo` array to reflect the change
            allTodo = allTodo.map((todo) =>
                todo.id === todoId ? { ...todo, text: updatedText } : todo
            );
            console.log('Todo updated successfully in Firestore.');
        } catch (error) {
            console.error('Error saving edited to-do:', error);
            displayAlertMessage('Failed to save changes. Please try again.', 'OK');
        }
    } else {
        displayAlertMessage('Todo text cannot be empty.', 'OK');
        input.replaceWith(todoTextLabel);
    }
}
//function to delete the tasks
function deleteTODO(task, todoId) {
    let deleteButton = task.querySelector('.delete-btn');
    deleteButton.onclick = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const userId = currentUser.uid;
        const todoDocRef = doc(db, 'users', userId, 'todos', todoId);

        try {
            await deleteDoc(todoDocRef);
            task.remove(); // Remove the task from the DOM
        } catch (error) {
            console.error('Error deleting todo:', error);
            displayAlertMessage('Failed to delete task. Please try again.', 'OK');
        }
    };
}
//function to handle checkbox change
function checkboxChange(task, todoId) {
    let checkbox = task.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const userId = currentUser.uid;
        const todoDocRef = doc(db, 'users', userId, 'todos', todoId);

        try {
            await updateDoc(todoDocRef, { completed: checkbox.checked });
            task.classList.toggle('completed', checkbox.checked);
            allTodo = allTodo.map((todo) =>
                todo.id === todoId ? { ...todo, completed: checkbox.checked } : todo
            );
        } catch (error) {
            console.error('Error updating todo completion state:', error);
        }
    });
}
//function to load the todos from firestore
async function loadTODO() {
    const currentUser = auth.currentUser;
    if (!currentUser) return []; // Ensure user is logged in
    const userId = currentUser.uid;
    const todosRef = collection(db, 'users', userId, 'todos');

    try {
        const querySnapshot = await getDocs(todosRef);
        const todos = [];
        querySnapshot.forEach((doc) => {
            todos.push({ ...doc.data(), id: doc.id });
        });
        return todos;
    } catch (error) {
        console.error('Error loading to-dos:', error);
        return [];
    }
}

//draggable todos
let draggedEl = null;
function addDragEvents(todoElement) {
    todoElement.addEventListener('dragstart', (e) => {
        todoElement.classList.add('drag_started');
        draggedEl = todoElement; // Store the element being dragged
    });

    todoElement.addEventListener('dragend', () => {
        todoElement.classList.remove('drag_started');
        draggedEl = null;
    });
}

const draggableContainer = document.querySelector('.draggable_container');

if (draggableContainer) {
    draggableContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    draggableContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedEl) draggableContainer.appendChild(draggedEl);
    });
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
    if (modalActionBtn.innerText === 'LogIn')
        window.open('Files/form.html')
    else if(modalActionBtn.innerText === 'Yes')
        logoutUser()
    else {
        modalContainer.classList.add('out');
        setTimeout(() => {
            modalContainer.classList.remove('two');
        }, 1000)
    }
}
loginNow.onclick = () => {
    window.open('Files/form.html')
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

// Function to show loader
function showLoader() {
    let todoBtn = document.querySelector('#todo-add-button');
    todoBtn.innerHTML = '';
    const loaderParent = document.createElement('div');
    loaderParent.classList.add('small-loader-parent');
    loaderParent.innerHTML = '<div class="small-loader"></div>';
    todoBtn.appendChild(loaderParent);
}
//remove lader
function removeLoader() {
    const loaderParent = document.querySelector('.small-loader-parent');
    if (loaderParent) {
        loaderParent.remove();
    }
    // Restore the "Add" button text
    const todoBtn = document.querySelector('#todo-add-button');
    todoBtn.innerHTML = 'Add Todo';
}

const logoutButton = document.getElementById('logout');
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        displayAlertMessage('Are you sure you want to logout?', 'Yes')
    });
}
// Logout function
function logoutUser() {
    showSpinner()
    const auth = getAuth();
    signOut(auth)
        .then(() => {
            console.log("User logged out successfully.");
            removeSpinner()
            displayAlertMessage('User logged out successfully.', 'OK');
            setTimeout(() => {
                window.location.href = 'Files/form.html'
            }, 3000)
        })
        .catch((error) => {
            displayAlertMessage(error.code, 'OK');
            console.error("Error logging out:", error.message);

        });
}

//fetching the notes from Firestore
async function loadUserNotes() {
    showSpinner();
    const currentUser = auth.currentUser;
    if (!currentUser) {
        removeSpinner();
        return;
    }
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
        displayAlertMessage('Failed to load notes. Please try again.', 'OK');
    } finally {
        // Remove the spinner after data loading is complete
        removeSpinner();
    }
}

document.querySelector('.about').addEventListener('click', () => {
    window.location.href = 'Files/about.html'
})


