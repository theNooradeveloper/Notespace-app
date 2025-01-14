function showBookmarkedNotes() {
    let subContainer = document.querySelectorAll('.sub-container');
    let notesContainer = document.querySelector('.notes-container');

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





function showAllNotes() {
    let subContainer = document.querySelectorAll('.sub-container')
    let notesPresent = subContainer.length > 0
    let notesContainer = document.querySelector('.notes-container');

    welcomeMsg.classList.add('hide');
    heroSection.classList.add('hide');
    dashboardTitle.innerText = 'All Notes';
    if (!notesPresent) {
        if (!notesContainer.querySelector('.no-results')) {
            let noBookmarkMsg = notesContainer.querySelector('no-bookmarks')
            if (noBookmarkMsg) noBookmarkMsg.remove();
            let noResultsMessage = document.createElement('div');
            noResultsMessage.className = 'no-results no-notes';
            noResultsMessage.textContent = 'No notes available';
            notesContainer.appendChild(noResultsMessage);
        }
    }
    else {
        let noResults = notesContainer.querySelector('.no-results');
        if (noResults) noResults.remove();
        subContainer.forEach((container) => {
            container.style.display = 'flex'
        })
    }
}

function showBookmarkedNotes() {
    welcomeMsg.classList.add('hide');
    heroSection.classList.add('hide');
    dashboardTitle.innerText = 'Bookmarked'

    subContainer.forEach((container) => {
        if (container.querySelector('.final-notes-container #bookmark-note i').classList.contains('bookmarked')) {
            let notesPresent = container.length > 0
            if (!notesPresent) {
                if (!notesContainer.querySelector('.no-results')) {
                    let noNotesMsg = notesContainer.querySelector('no-notes')
                    if (noNotesMsg) noNotesMsg.remove();
                    let noResultsMessage = document.createElement('div');
                    noResultsMessage.className = 'no-results';
                    noResultsMessage.textContent = 'No Bookmarked notes available';
                    notesContainer.appendChild(noResultsMessage);
                    container.style.display = 'none';
                }
                else {
                    let noResults = notesContainer.querySelector('.no-results');
                    if (noResults) noResults.remove();
                    container.style.display = 'flex';
                }
            }
        }
    })
}