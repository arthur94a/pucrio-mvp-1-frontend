const DOMAIN = 'http://127.0.0.1:5000'

/******************************************************
* GET COMMENT LIST (INFINITE SCROLL)
*******************************************************/
let lastId = null;
let loading = false;

const getList = async () => {
  if (loading) return;
  loading = true;

  let url = DOMAIN + '/list';
  if (lastId !== null) {
    url += `?last_id=${lastId}`;
  }

  fetch(url, {
    method: 'get',
  })
    .then((response) => response.json())
    .then((data) => {

      if (!data.comments || data.comments.length === 0) {
        window.removeEventListener('scroll', handleScroll);
        return;
      }

      data.comments.forEach(comment => {
        createCard('comments', comment);
        handleClickShowEditCard()
      });

      lastId = data.comments[data.comments.length - 1].id;
      loading = false;
    })
    .catch((error) => {
      console.error('Error:', error);
      loading = false;
    });
};

/******************************************************
* SCROLL HANDLER — CARREGA MAIS AO CHEGAR NO FIM
*******************************************************/
function handleScroll() {
  const scrollPosition = window.innerHeight + window.scrollY;
  const bottom = document.body.offsetHeight - 200;

  if (scrollPosition >= bottom) {
    getList();
  }
}

/******************************************************
* INIT LIST + EVENTO DE SCROLL
*******************************************************/
window.addEventListener('scroll', handleScroll);
getList();

/******************************************************
* CREATE COMMENT
*******************************************************/
document.getElementById("comment_form").addEventListener("submit", async function (e) {
    e.preventDefault(); // impede o envio normal

    const url = DOMAIN + '/create'

    const data = {
        comment: document.getElementById("comment").value,
        username: document.getElementById("username").value,
        password: document.getElementById("password").value
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if(response.statusText === 'OK') {
        const result = await response.json();
        const sectionComment = document.getElementById("comments")
        sectionComment.prepend(createCard('comments', result, true))
        closeModal('modal_create')
    } else {
        const errors = await response.json();
        
        if(errors[0]?.msg) {
            setModalErrors('comment_form_feedback', errors[0]?.msg)
        }

        if(errors.error) {
            setModalErrors('comment_form_feedback', errors.error)
        }
    }
});

/******************************************************
* EDIT COMMENT
*******************************************************/
document.getElementById("comment_form_edit").addEventListener("submit", async function (e) {
    e.preventDefault()

    const url = DOMAIN + '/update'

    const data = {
        id: document.getElementById("edit_card_id").value,
        comment: document.getElementById("edit_comment").value,
        password: document.getElementById("edit_password").value
    };

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if(response.statusText === 'OK') {
        replaceCommentCardText(data.id, data.comment)
        closeModal('modal_edit')
    } else {
        const errors = await response.json();
        
        if(errors[0]?.msg) {
            setModalErrors('edit_comment_form_feedback', errors[0]?.msg)
        }

        if(errors.error) {
            setModalErrors('edit_comment_form_feedback', errors.error)
        }
    }
})

/******************************************************
* DELETE COMMENT
*******************************************************/
document.getElementById("comment_form_delete").addEventListener("submit", async function (e) {
    e.preventDefault()

    console.log('clicou')

    const url = DOMAIN + '/delete'

    const data = {
        id: document.getElementById("delete_card_id").value,
        password: document.getElementById("delete_password").value
    };

    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if(response.statusText === 'OK') {
        removeDeletedCard(data.id)
        closeModal('modal_delete')
    } else {
        const errors = await response.json();
        
        if(errors[0]?.msg) {
            setModalErrors('delete_comment_form_feedback', errors[0]?.msg)
        }

        if(errors.error) {
            setModalErrors('delete_comment_form_feedback', errors.error)
        }
    }
})

/******************************************************
* OPEN MODAL
*******************************************************/
function handleOpenModalCreate() {
    const buttons = document.getElementsByName('open_modal_create')

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            openModal('modal_create')
        })
    })
}

function handleOpenModalEdit() {
    const container = document.getElementById('comments');

    container.addEventListener('click', (event) => {
        const editButton = event.target.closest('.card_edit_button');

        if(editButton) {
            const cardId = editButton?.dataset.cardId
            document.getElementById('edit_card_id').value = cardId

            const card = editButton.closest('.card_comment');
            const cardText = card.querySelector('.card_text').textContent.trim();
            document.getElementById('edit_comment').value = cardText;

            openModal('modal_edit')
        }
    })
}

function handleOpenModalDelete() {
    const container = document.getElementById('comments');

    container.addEventListener('click', (event) => {
        const deleteButton = event.target.closest('.card_delete_button');

        if(deleteButton) {
            const cardId = deleteButton?.dataset.cardId
            document.getElementById('delete_card_id').value = cardId

            openModal('modal_delete')
        }
    })
}

handleOpenModalCreate()
handleOpenModalEdit()
handleOpenModalDelete()

/******************************************************
* CLOSE MODAL
*******************************************************/
function handleCloseModalCreate() {
    const overlays = document.querySelectorAll('.modal_overlay')

    overlays.forEach(overlay => {
        overlay.addEventListener("click", () => {
            closeModal('modal_create')
            closeModal('modal_edit')
            closeModal('modal_delete')
        })
    })
}

handleCloseModalCreate()

/******************************************************
* HANDLE CLICK TO SHOW COMMENT EDIT AND DELETE ICONS
*******************************************************/
function handleClickShowEditCard() {
    const container = document.getElementById('comments');

    container.addEventListener('click', (event) => {
        const card = event.target.closest('.card_comment');
        const cardId = (card?.id)?.split('-')[1] // get the number id of "comment-id"

        if (!card) return;

        document.querySelectorAll('.card_comment').forEach(card => {
            card.classList.remove('show');
        });

        document.querySelectorAll('.card_edit_buttons_container').forEach(container => {
            container.remove()
        })

        card.classList.add('show');

        const metadata = card.querySelector('.card_metadata');
        createEditButtons(metadata, cardId)
    });
}

/******************************************************
* FUNCTIONS
*******************************************************/
/* INSERT CARDS LIST
*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
function createCard(elementId, commentObj, newCard = false) {
    if (!commentObj) return

    const elementContainer = document.getElementById(elementId)

    const cardEl = document.createElement('article')
    const contentEl = document.createElement('div')
    const metadataEl = document.createElement('div')
    const textEl = document.createElement('span')
    const userEl = document.createElement('span')
    const datetimeEl = document.createElement('div')
    const dateEl = document.createElement('span')
    const timeEl = document.createElement('span')

    let date, time = ''

    const { id, comment, created_at, updated_at, username } = commentObj

    cardEl.setAttribute('id', "comment-" + id)

    cardEl.className = 'card_comment'
    contentEl.className = 'card_content'
    textEl.className = 'card_text'
    metadataEl.className = 'card_metadata'
    userEl.className = 'card_username'
    datetimeEl.className = 'card_datetime'
    dateEl.className = 'card_date'
    timeEl.className = 'card_time'

    textEl.textContent = comment
    userEl.textContent = '@' + username

    contentEl.appendChild(userEl)
    contentEl.appendChild(textEl)

    if(updated_at) {
        time = formatDatetime(updated_at)?.time
        date = formatDatetime(updated_at)?.date
    } else {
        time = formatDatetime(created_at)?.time
        date = formatDatetime(created_at)?.date
    }

    timeEl.textContent = time
    dateEl.textContent = date

    datetimeEl.appendChild(timeEl)
    datetimeEl.appendChild(dateEl)

    metadataEl.appendChild(datetimeEl)

    cardEl.appendChild(contentEl)
    cardEl.appendChild(metadataEl)
    
    if (newCard) {
        elementContainer.prepend(cardEl)
    } else {
        elementContainer.appendChild(cardEl)
    }

    return cardEl
}

/* INSERT EDIT BUTTONS
*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
function createEditButtons(element, cardId) {
    const containerEl = document.createElement('div')
    const editButtonEl = document.createElement('button')
    const deleteButtonEl = document.createElement('button')

    containerEl.className = 'card_edit_buttons_container'
    editButtonEl.className = 'card_edit_button'
    deleteButtonEl.className = 'card_delete_button'
    editButtonEl.dataset.cardId = cardId
    deleteButtonEl.dataset.cardId = cardId

    editButtonEl.textContent = 'Editar'
    deleteButtonEl.textContent = 'Excluir'

    containerEl.appendChild(editButtonEl)
    containerEl.appendChild(deleteButtonEl)

    element.appendChild(containerEl)
}

/* FORMAT DATETIME TO RETURN DATE AND TIME VALUES
*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
function formatDatetime(datetime) {
    if (!datetime) return { date: '', time: '' }

    const date = datetime.split('T')[0]
    let time = datetime.split('T')[1]
    time = time.slice(0,8)

    return { date, time }
}

/* OPEN MODAL
*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
function openModal(elementId) {
    const modal = document.getElementById(elementId)
    modal.classList.add('open')
}

/* CLOSE MODAL
*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
function closeModal(elementId) {
    const modal = document.getElementById(elementId)
    modal.classList.remove('open')
}

/* SET MODAL ERRORS
*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
function setModalErrors(elementId, error) {
    const feedback = document.getElementById(elementId)
    feedback.textContent = error
}

/* REPLACE COMMENT CARD TEXT
*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
function replaceCommentCardText(id, newText) {
    const card = document.getElementById('comment-' + id)
    const textEl = card.querySelector('.card_text')
    textEl.textContent = newText
}

/* REMOVE DELETED CARD
*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
function removeDeletedCard(id) {
    const commentId = 'comment-' + id
    const card = document.getElementById(commentId)

    card.remove()
}