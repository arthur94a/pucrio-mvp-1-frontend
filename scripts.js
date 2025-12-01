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
document.getElementById("commentForm").addEventListener("submit", async function (e) {
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

handleOpenModalCreate()

/******************************************************
* CLOSE MODAL
*******************************************************/
function handleCloseModalCreate() {
    const overlays = document.querySelectorAll('.modal_overlay')

    overlays.forEach(overlay => {
        overlay.addEventListener("click", () => {
            closeModal('modal_create')
        })
    })
}

handleCloseModalCreate()

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

    const { comment, created_at, updated_at, username } = commentObj

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