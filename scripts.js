/******************************************************
* GET COMMENT LIST 
*******************************************************/
const getList = async () => {
  let url = 'http://127.0.0.1:5000/list';
  fetch(url, {
    method: 'get',
  })
    .then((response) => response.json())
    .then((data) => {
        data.comments.forEach(comment => {
            createCard('comments', comment)
            console.log(comment)
        })
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}
/* Init list
*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
getList()

/******************************************************
* INSERT CARDS LIST
*******************************************************/
function createCard(elementId, commentObj) {
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
    
    elementContainer.appendChild(cardEl)
}

function formatDatetime(datetime) {
    if (!datetime) return { date: '', time: '' }

    const date = datetime.split('T')[0]
    let time = datetime.split('T')[1]
    time = time.slice(0,8)

    return { date, time }
}