if (textArea.innerHTML.trim() === '' || textArea.innerText.trim() === '') //might contain non-visible html tags
{
    textArea.style.border = '2px solid red';
    alert('Cannot create empty note.Please add some content');
    return;
}

//resetting border to neutral state
textArea.style.border = ''
overlayContainer.style.display = 'none';

let selectedBackground = textArea.style.cssText;
let currentDate = new Date().toLocaleDateString();
let noteText = textArea.innerHTML;
if (noteToEdit) {
    // Update existing note
    noteToEdit.querySelector('.user-text').innerHTML = noteText;
    noteToEdit.style.cssText = selectedBackground;
    noteToEdit.querySelector('.date').innerText = currentDate;

    // Reset editing state
    noteToEdit = null;
    createNoteBtn.innerText = 'Create Note';
    return;
}

//create new note
let subContainer = document.createElement('div');
subContainer.classList.add('sub-container')
subContainer.innerHTML = ` <section class="final-notes-container" tabindex="1" style='${selectedBackground}'>
<div class="user-text"> ${noteText}</div>
<div class="date_icon">
    <div class="date">${currentDate}</div>
    <div class="icons">
    <button id="bookmark-note" title='Bookmark'><i class="fa-regular fa-bookmark"></i></button>
        <button id="edit-note" title='Edit'><i class="fa-regular fa-pen-to-square"></i></button>
        <button id="delete-note" title='Delete'> <i class="fa-solid fa-trash"></i></button>
    </div>
</div>
</section>`

notesContainer.appendChild(subContainer);
let currentNote = subContainer.querySelector('.final-notes-container')
subContainer.addEventListener('click', (e) => {
    editDeleteBookmarkNote(e, currentNote)
})